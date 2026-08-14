import os
from unittest.mock import patch

import pytest
from livekit.agents import AgentSession, inference, llm

from agent import (
    MURF_MAIN_VOICE,
    MURF_SPECIALIST_VOICE,
    Assistant,
    ClinicSpecialist,
)
from triage import lookup_healthcare_facility

# Dummy Murf API key for testing TTS instantiation
os.environ["MURF_API_KEY"] = os.getenv("MURF_API_KEY", "test_murf_key")


def _llm() -> llm.LLM:
    return inference.LLM(model="openai/gpt-4.1-mini")


# ---------------------------------------------------------------------------
# 1. Specialist Agent Structure & Voice Configuration Tests
# ---------------------------------------------------------------------------


def test_specialist_is_separate_agent_with_distinct_instructions() -> None:
    """Verify ClinicSpecialist exists as a separate Agent with its own instructions."""
    main_agent = Assistant()
    specialist_agent = ClinicSpecialist()

    assert isinstance(main_agent, Assistant)
    assert isinstance(specialist_agent, ClinicSpecialist)
    assert main_agent.instructions != specialist_agent.instructions
    assert "Clinic & Appointment Specialist" in specialist_agent.instructions
    assert "MediSathi" in main_agent.instructions


def test_distinct_murf_voice_configuration() -> None:
    """Verify main agent and specialist agent use DIFFERENT Murf voices."""
    assert MURF_MAIN_VOICE != MURF_SPECIALIST_VOICE, (
        f"Main voice ({MURF_MAIN_VOICE}) must not equal specialist voice ({MURF_SPECIALIST_VOICE})"
    )

    main_agent = Assistant()
    specialist_agent = ClinicSpecialist()

    assert main_agent.tts._opts.voice != specialist_agent.tts._opts.voice, (
        f"Main TTS voice ({main_agent.tts._opts.voice}) must be different from "
        f"Specialist TTS voice ({specialist_agent.tts._opts.voice})"
    )
    assert main_agent.tts._opts.voice == MURF_MAIN_VOICE
    assert specialist_agent.tts._opts.voice == MURF_SPECIALIST_VOICE


def test_main_agent_has_handoff_tool_with_clear_description() -> None:
    """Verify Assistant has transfer_to_clinic_specialist tool with clear guidance."""
    agent = Assistant()
    tools = agent.tools
    tool_names = [t.info.name for t in tools]

    assert "transfer_to_clinic_specialist" in tool_names

    handoff_tool = next(
        t for t in tools if t.info.name == "transfer_to_clinic_specialist"
    )
    description = handoff_tool.info.description.lower()

    assert "clinic" in description
    assert "facility" in description
    assert "do not use" in description or "only when" in description


def test_specialist_context_transfer_in_on_enter() -> None:
    """Verify context passed during handoff is received by the specialist."""
    context = {
        "user_request": "find a PHC near Jabalpur for general consultation",
        "reason": "facility lookup requested",
        "location": "Jabalpur",
        "language": "English",
    }
    specialist = ClinicSpecialist(context=context)

    assert specialist.context == context
    assert (
        specialist.context["user_request"]
        == "find a PHC near Jabalpur for general consultation"
    )
    assert specialist.context["location"] == "Jabalpur"


# ---------------------------------------------------------------------------
# 2. Facility Lookup Tool Tests
# ---------------------------------------------------------------------------


def test_facility_lookup_functionality() -> None:
    """Verify lookup_healthcare_facility returns verified facility data."""
    result = lookup_healthcare_facility(facility_type="PHC", location="Jabalpur")

    assert result["success"] is True
    assert result["found"] is True
    assert len(result["facilities"]) > 0
    assert (
        "Jabalpur" in result["facilities"][0]["name"]
        or "PHC" in result["facilities"][0]["type"]
    )


def test_facility_lookup_failure_graceful_handling() -> None:
    """Verify facility lookup handles errors gracefully without guessing."""
    with patch(
        "triage.SAMPLE_FACILITIES",
        new=None,
    ):
        result = lookup_healthcare_facility(facility_type="Unknown", location="Invalid")

        assert result["success"] is False
        assert result["found"] is False
        assert "couldn't retrieve" in result["message"]


# ---------------------------------------------------------------------------
# 3. LLM-Judged Behavioral & Handoff Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_normal_question_stays_with_main_agent() -> None:
    """Test Case 1: Normal health questions stay with main MediSathi agent."""
    async with (
        _llm() as llm,
        AgentSession(llm=llm) as session,
    ):
        await session.start(Assistant())

        result = await session.run(user_input="What should I do for a mild headache?")

        # Should NOT invoke transfer_to_clinic_specialist
        events = result.events
        func_calls = [
            e.item.name
            for e in events
            if hasattr(e, "item") and hasattr(e.item, "name")
        ]
        assert "transfer_to_clinic_specialist" not in func_calls

        await (
            result.expect.next_event()
            .is_message(role="assistant")
            .judge(
                llm,
                intent="Provides safe, friendly educational health guidance for a mild headache without transferring to a specialist.",
            )
        )


@pytest.mark.asyncio
async def test_facility_request_triggers_handoff() -> None:
    """Test Case 2 & 3: Clinic/PHC request triggers handoff tool."""
    async with (
        _llm() as llm,
        AgentSession(llm=llm) as session,
    ):
        await session.start(Assistant())

        result = await session.run(
            user_input="I need help finding a clinic or PHC near me for a general consultation."
        )

        result.expect.next_event().is_function_call(
            name="transfer_to_clinic_specialist"
        )


@pytest.mark.asyncio
async def test_emergency_does_not_trigger_clinic_handoff() -> None:
    """Test Case 6: Emergency symptoms do NOT trigger clinic handoff."""
    async with (
        _llm() as llm,
        AgentSession(llm=llm) as session,
    ):
        await session.start(Assistant())

        result = await session.run(
            user_input="I have severe chest pain and difficulty breathing."
        )

        events = result.events
        func_calls = [
            e.item.name
            for e in events
            if hasattr(e, "item") and hasattr(e.item, "name")
        ]
        assert "transfer_to_clinic_specialist" not in func_calls

        # Should invoke symptom triage or provide emergency safety advice
        await (
            result.expect.next_event()
            .is_message(role="assistant")
            .judge(
                llm,
                intent="Recognizes severe chest pain / breathing difficulty as a medical emergency and advises caller to contact local emergency medical services immediately.",
            )
        )

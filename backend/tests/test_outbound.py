import json
import logging
from types import SimpleNamespace

import pytest

from outbound import (
    OutboundCallConfig,
    OutboundCallConfigurationError,
    build_call_metadata,
    classify_call_failure,
    is_sip_uri,
    load_outbound_config,
    make_outbound_call,
    make_room_name,
    mask_phone_number,
    mask_sip_destination,
    normalize_phone_number,
    normalize_sip_destination,
    parse_call_metadata,
)

# ---------------------------------------------------------------------------
# E.164 validation (existing Day 5 tests, preserved)
# ---------------------------------------------------------------------------


def test_phone_number_validation_and_normalization() -> None:
    assert normalize_phone_number(" +91 98765-43210 ") == "+919876543210"
    with pytest.raises(ValueError, match=r"E\.164"):
        normalize_phone_number("9876543210")


def test_phone_number_masking_does_not_expose_destination() -> None:
    assert mask_phone_number("+919876543210") == "+91******3210"


# ---------------------------------------------------------------------------
# SIP URI normalization
# ---------------------------------------------------------------------------


def test_bare_username_becomes_sip_uri() -> None:
    assert normalize_sip_destination("myuser") == "sip:myuser@sip.linphone.org"


def test_bare_username_with_explicit_domain() -> None:
    assert (
        normalize_sip_destination("myuser", domain="custom.sip.example.com")
        == "sip:myuser@custom.sip.example.com"
    )


def test_full_sip_uri_is_preserved() -> None:
    assert (
        normalize_sip_destination("sip:alice@sip.linphone.org")
        == "sip:alice@sip.linphone.org"
    )


def test_e164_passed_through_normalize_sip_destination() -> None:
    assert normalize_sip_destination("+919876543210") == "+919876543210"


def test_invalid_sip_uri_rejected() -> None:
    with pytest.raises(ValueError, match="sip:user@domain"):
        normalize_sip_destination("sip:bad uri spaces@domain")


def test_invalid_bare_username_rejected() -> None:
    with pytest.raises(ValueError, match="letters"):
        normalize_sip_destination("bad user!!")


def test_empty_destination_rejected() -> None:
    with pytest.raises(ValueError, match="non-empty"):
        normalize_sip_destination("")
    with pytest.raises(ValueError, match="non-empty"):
        normalize_sip_destination("   ")


def test_is_sip_uri_detection() -> None:
    assert is_sip_uri("sip:user@domain") is True
    assert is_sip_uri("SIP:user@domain") is True
    assert is_sip_uri("+919876543210") is False
    assert is_sip_uri("bareuser") is False


def test_extract_sip_call_to() -> None:
    from outbound import extract_sip_call_to

    assert extract_sip_call_to("sip:shivamksr1@sip.linphone.org") == "shivamksr1"
    assert extract_sip_call_to("shivamksr1") == "shivamksr1"
    assert extract_sip_call_to("+919876543210") == "+919876543210"
    assert extract_sip_call_to("sip:user") == "user"


def test_mask_trunk_id() -> None:
    from outbound import mask_trunk_id

    assert mask_trunk_id("ST_oK2sYycdVEfF") == "ST_o***fF"
    assert mask_trunk_id("ST_test") == "ST_t***st"
    assert mask_trunk_id("ST_12") == "ST***"
    assert mask_trunk_id("") == "***"


# ---------------------------------------------------------------------------
# SIP destination masking
# ---------------------------------------------------------------------------


def test_sip_destination_masking_hides_username() -> None:
    masked = mask_sip_destination("sip:longusername@sip.linphone.org")
    assert "longusername" not in masked
    assert "sip.linphone.org" in masked
    assert masked.startswith("sip:")


def test_sip_short_username_fully_masked() -> None:
    masked = mask_sip_destination("sip:ab@sip.linphone.org")
    assert masked == "sip:***@sip.linphone.org"


def test_phone_number_falls_through_sip_mask() -> None:
    masked = mask_sip_destination("+919876543210")
    assert masked == "+91******3210"


def test_mask_never_exposes_full_destination() -> None:
    """Verify that neither phone numbers nor SIP usernames leak in masked output."""
    phone = "+919876543210"
    sip = "sip:secretuser@sip.linphone.org"
    assert "9876543210" not in mask_sip_destination(phone)
    assert "secretuser" not in mask_sip_destination(sip)


# ---------------------------------------------------------------------------
# Metadata (backward compatible + SIP)
# ---------------------------------------------------------------------------


def test_outbound_metadata_is_minimal_and_parses() -> None:
    metadata = build_call_metadata(
        phone_number="+919876543210",
        user_id="caller-42",
        reason="Follow-up after a health concern",
    )
    raw = json.loads(metadata)
    assert raw["destination"] == "+919876543210"
    assert raw["phone_number"] == "+919876543210"
    assert "medical_notes" not in raw
    assert parse_call_metadata(metadata)["user_id"] == "caller-42"
    assert parse_call_metadata("not-json") == {}


def test_sip_metadata_round_trip() -> None:
    metadata = build_call_metadata(
        destination="myuser",
        user_id="demo-user",
        reason="Health follow-up",
    )
    raw = json.loads(metadata)
    assert raw["destination"] == "sip:myuser@sip.linphone.org"
    assert "phone_number" not in raw  # SIP destinations don't get phone_number key

    parsed = parse_call_metadata(metadata)
    assert parsed["destination"] == "sip:myuser@sip.linphone.org"
    assert "phone_number" not in parsed  # empty values are stripped
    assert parsed["user_id"] == "demo-user"


def test_legacy_phone_number_metadata_still_parses() -> None:
    """Metadata from older Day 5 code (only phone_number key) still works."""
    legacy = json.dumps(
        {"phone_number": "+919876543210", "call_type": "triage_followup"}
    )
    parsed = parse_call_metadata(legacy)
    assert parsed["destination"] == "+919876543210"
    assert parsed["phone_number"] == "+919876543210"


def test_metadata_requires_destination_or_phone() -> None:
    with pytest.raises(ValueError, match="destination or phone_number"):
        build_call_metadata(reason="test")


# ---------------------------------------------------------------------------
# Room names
# ---------------------------------------------------------------------------


def test_room_names_are_unique_and_non_sensitive() -> None:
    first = make_room_name()
    second = make_room_name()
    assert first.startswith("medisathi-followup-")
    assert first != second
    assert "98765" not in first


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


def test_configuration_requires_outbound_trunk() -> None:
    with pytest.raises(OutboundCallConfigurationError, match="OUTBOUND_TRUNK"):
        load_outbound_config(
            {
                "LIVEKIT_URL": "wss://example.livekit.cloud",
                "LIVEKIT_API_KEY": "key",
                "LIVEKIT_API_SECRET": "secret",
            }
        )


def test_configuration_requires_all_livekit_vars() -> None:
    with pytest.raises(OutboundCallConfigurationError, match="LIVEKIT_URL"):
        load_outbound_config({})


def test_configuration_loads_with_all_vars() -> None:
    config = load_outbound_config(
        {
            "LIVEKIT_URL": "wss://test.livekit.cloud",
            "LIVEKIT_API_KEY": "key",
            "LIVEKIT_API_SECRET": "secret",
            "LIVEKIT_SIP_OUTBOUND_TRUNK_ID": "ST_test",
        }
    )
    assert config.outbound_trunk_id == "ST_test"
    assert config.livekit_url == "wss://test.livekit.cloud"


# ---------------------------------------------------------------------------
# Failure classification
# ---------------------------------------------------------------------------


def test_failure_outcomes_are_safe() -> None:
    assert classify_call_failure(RuntimeError("SIP busy here"))[0] == "busy"
    assert classify_call_failure(RuntimeError("call rejected"))[0] == "declined"
    assert classify_call_failure(RuntimeError("request timeout"))[0] == "no_answer"
    assert classify_call_failure(RuntimeError("voicemail detected"))[0] == "voicemail"
    outcome, message = classify_call_failure(RuntimeError("provider error"))
    assert outcome == "provider_failure"
    assert "provider" in message.lower()


def test_unavailable_classified_as_no_answer() -> None:
    assert classify_call_failure(RuntimeError("user unavailable"))[0] == "no_answer"


# ---------------------------------------------------------------------------
# Mocked outbound calls — E.164
# ---------------------------------------------------------------------------


class _DispatchService:
    def __init__(self) -> None:
        self.deleted = False

    async def create_dispatch(self, request):
        self.request = request
        return SimpleNamespace(id="dispatch-1")

    async def delete_dispatch(self, dispatch_id, room_name) -> None:
        assert dispatch_id == "dispatch-1"
        assert room_name.startswith("medisathi-followup-")
        self.deleted = True


class _SIPService:
    async def create_sip_participant(self, request, *, trunk_id, timeout):
        self.request = request
        assert trunk_id == "ST_test"
        assert timeout == 10
        return SimpleNamespace(participant_identity=request.participant_identity)


class _LiveKitClient:
    def __init__(self) -> None:
        self.agent_dispatch = _DispatchService()
        self.sip = _SIPService()


@pytest.mark.asyncio
async def test_outbound_call_dispatches_agent_then_dials_mocked_sip() -> None:
    client = _LiveKitClient()
    config = OutboundCallConfig(
        "url", "key", "secret", "ST_test", answer_timeout_seconds=10
    )

    result = await make_outbound_call(
        "+919876543210", config=config, livekit_api=client
    )

    assert result["success"] is True
    assert result["outcome"] == "answered"
    metadata = parse_call_metadata(client.agent_dispatch.request.metadata)
    assert metadata["destination"] == "+919876543210"


# ---------------------------------------------------------------------------
# Mocked outbound calls — SIP URI (Linphone)
# ---------------------------------------------------------------------------


class _SIPServiceForURI:
    async def create_sip_participant(self, request, *, trunk_id, timeout):
        self.request = request
        assert request.sip_call_to == "testuser"
        assert trunk_id == "ST_linphone"
        return SimpleNamespace(participant_identity=request.participant_identity)


@pytest.mark.asyncio
async def test_outbound_sip_call_uses_correct_uri_and_trunk() -> None:
    client = _LiveKitClient()
    client.sip = _SIPServiceForURI()
    config = OutboundCallConfig(
        "url", "key", "secret", "ST_linphone", answer_timeout_seconds=10
    )

    result = await make_outbound_call("testuser", config=config, livekit_api=client)

    assert result["success"] is True
    assert result["outcome"] == "answered"
    metadata = parse_call_metadata(client.agent_dispatch.request.metadata)
    assert metadata["destination"] == "sip:testuser@sip.linphone.org"


@pytest.mark.asyncio
async def test_outbound_full_sip_uri_passed_correctly() -> None:
    """A full SIP URI should extract the user for sip_call_to while preserving destination in metadata."""

    class VerifySIP:
        async def create_sip_participant(self, request, *, trunk_id, timeout):
            assert request.sip_call_to == "alice"
            return SimpleNamespace(participant_identity="sip-test")

    client = _LiveKitClient()
    client.sip = VerifySIP()
    config = OutboundCallConfig(
        "url", "key", "secret", "ST_test", answer_timeout_seconds=10
    )

    result = await make_outbound_call(
        "sip:alice@sip.linphone.org", config=config, livekit_api=client
    )
    assert result["success"] is True


# ---------------------------------------------------------------------------
# Failure handling
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_rejected_call_cleans_up_agent_dispatch() -> None:
    class RejectingSIPService:
        async def create_sip_participant(self, *args, **kwargs):
            raise RuntimeError("call rejected")

    client = _LiveKitClient()
    client.sip = RejectingSIPService()
    config = OutboundCallConfig(
        "url", "key", "secret", "ST_test", answer_timeout_seconds=10
    )

    result = await make_outbound_call(
        "+919876543210", config=config, livekit_api=client
    )

    assert result["success"] is False
    assert result["outcome"] == "declined"
    assert client.agent_dispatch.deleted is True


@pytest.mark.asyncio
async def test_busy_sip_call_returns_busy() -> None:
    class BusySIPService:
        async def create_sip_participant(self, *args, **kwargs):
            raise RuntimeError("SIP 486 busy here")

    client = _LiveKitClient()
    client.sip = BusySIPService()
    config = OutboundCallConfig(
        "url", "key", "secret", "ST_test", answer_timeout_seconds=10
    )

    result = await make_outbound_call(
        "sip:user@sip.linphone.org", config=config, livekit_api=client
    )

    assert result["success"] is False
    assert result["outcome"] == "busy"


@pytest.mark.asyncio
async def test_unavailable_sip_call_returns_no_answer() -> None:
    class TimeoutSIPService:
        async def create_sip_participant(self, *args, **kwargs):
            raise RuntimeError("no answer from user")

    client = _LiveKitClient()
    client.sip = TimeoutSIPService()
    config = OutboundCallConfig(
        "url", "key", "secret", "ST_test", answer_timeout_seconds=10
    )

    result = await make_outbound_call("testuser", config=config, livekit_api=client)

    assert result["success"] is False
    assert result["outcome"] == "no_answer"


# ---------------------------------------------------------------------------
# Agent default mode
# ---------------------------------------------------------------------------


def test_browser_agent_mode_remains_default() -> None:
    from agent import Assistant

    agent = Assistant()
    assert agent.outbound_call is False


# ---------------------------------------------------------------------------
# Secrets safety
# ---------------------------------------------------------------------------


def test_secrets_not_in_logs(caplog: pytest.LogCaptureFixture) -> None:
    """Verify that log messages from classify/mask never contain raw secrets."""
    secret_phone = "+919876543210"
    secret_sip = "sip:secretuser@sip.linphone.org"

    with caplog.at_level(logging.WARNING, logger="outbound"):
        # Trigger warning-level logging path
        classify_call_failure(RuntimeError("some failure"))

    for record in caplog.records:
        assert secret_phone not in record.getMessage()
        assert "secretuser" not in record.getMessage()

    # Direct mask checks
    assert "9876543210" not in mask_sip_destination(secret_phone)
    assert "secretuser" not in mask_sip_destination(secret_sip)

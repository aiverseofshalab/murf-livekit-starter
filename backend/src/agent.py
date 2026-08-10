import logging

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    room_io,
    tokenize,
)
from livekit.plugins import deepgram, google, murf, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from memory import MEMORY_FIELDS, CallerMemoryStore
from triage import assess_symptom_triage, failure_result

logger = logging.getLogger("agent")

load_dotenv(".env.local")


SYSTEM_PROMPT = """
# =====================================================
# MediSathi - AI Healthcare Voice Assistant
# =====================================================

IDENTITY

You are MediSathi, an AI-powered Healthcare Voice Assistant.

Your mission is to make healthcare information simple, safe, and accessible through natural voice conversations.

You are friendly, calm, empathetic, and professional.

You educate users about common health concerns, explain medical information in simple language, encourage healthy habits, and guide them toward the appropriate healthcare professional.

You are NOT a doctor.
You never replace licensed medical professionals.

----------------------------------------------------

MEMORY AND CONSENT

At the beginning of every call, call lookup_caller before greeting. It looks up only
the current caller. If it finds a caller, greet them naturally by their saved name;
never mention records, databases, or identifiers. If no caller is found, welcome them
as a new caller and ask what they would like to be called.

Never claim to remember anything unless lookup_caller returned it.
Never save personal or health information without asking for, and receiving, a clear
yes in the current conversation. Explain that you can remember only a name, preferred
language, age band, general ongoing conditions, and a brief high-level outcome for a
future visit. If the caller declines, do not call save_caller_memory.

After explicit consent, collect only details that are naturally useful; do not
interrogate the caller. Call save_caller_memory only with details actually provided,
using empty strings for unknown fields. Do not store a transcript, exact birth date,
contact details, identifiers, medication details, or detailed medical notes. If a
caller updates a detail and gives consent, save the new value; blank fields preserve
the existing values.

----------------------------------------------------

PRIMARY OBJECTIVES

A successful conversation should:

1. Understand the user's health concern.

2. Ask relevant follow-up questions.

3. Provide safe educational health guidance.

4. Recommend the appropriate medical specialist if necessary.

5. Detect emergencies immediately.

6. Encourage professional medical care whenever appropriate.

7. Leave the user feeling informed and reassured.

----------------------------------------------------

KNOWLEDGE

You can explain:

• Fever
• Cold
• Flu
• Headache
• Migraine
• Body pain
• Stomach problems
• Diabetes
• Blood pressure
• Skin conditions
• Nutrition
• Sleep
• Exercise
• Stress management
• Mental wellness
• Preventive healthcare
• Vaccinations
• First aid basics
• BMI
• Medical terminology
• Blood reports
• General medicine information
• Healthy lifestyle

You may explain:

• What a medicine is generally used for

• Common side effects

• Safety precautions

You must NEVER prescribe medicines.

----------------------------------------------------

FOLLOW-UP QUESTIONS

Before giving guidance, ask relevant questions.

Examples:

• How long have you had these symptoms?

• What is your age?

• What is your temperature?

• Are you experiencing cough?

• Any breathing difficulty?

• Any allergies?

• Any existing medical condition?

Ask only one or two questions at a time.

----------------------------------------------------

SYMPTOM TRIAGE TOOL

When a caller asks how serious symptoms are, whether they need a doctor, which level
of care to seek, or describes possible emergency warning signs, call
assess_symptom_triage. Gather only the details the tool needs when necessary: main
symptoms, duration, severity, red-flag symptoms, age band, and relevant conditions.
Use the tool result to give natural spoken guidance; never read JSON aloud. It is
triage support, not a diagnosis, and it must never be described as proof of a disease.
For a tool failure or UNKNOWN result, state that you could not safely classify the
situation and give its recommended action. Do not call this tool for general health
education, casual conversation, unrelated requests, or a request for a diagnosis.

Do not save symptoms, diagnoses, medications, test results, or medical notes to
caller memory as part of triage. Existing memory may only be updated through its
explicit-consent process.

----------------------------------------------------

LANGUAGE

Mirror the user's language.

Examples:

User:
"Mujhe fever hai."

Reply:
"Mujhe afsos hai ki aap theek feel nahi kar rahe hain. Aapka temperature kitna hai?"

User:
"I have fever aur body pain."

Reply:
"I'm sorry you're not feeling well. Fever aur body pain common infections mein ho sakte hain. Kya aapka temperature measure kiya gaya hai?"

If the user speaks only Hindi, reply only in Hindi.

If the user speaks only English, reply only in English.

If the user mixes languages, naturally mirror the same style.

----------------------------------------------------

CONVERSATION STYLE

Always be:

Friendly

Professional

Empathetic

Patient

Supportive

Natural

Never sound robotic.

Keep responses under 80 words whenever possible.

Avoid long explanations unless requested.

Never use emojis.

Never use markdown.

----------------------------------------------------

GUARDRAILS

Never:

❌ Claim to be a doctor.

❌ Diagnose diseases.

❌ Confirm medical conditions.

❌ Prescribe medicines.

❌ Recommend antibiotics.

❌ Suggest medicine dosages.

❌ Replace emergency services.

❌ Invent medical facts.

❌ Promise recovery.

❌ Ignore emergency symptoms.

❌ Ask for passwords, OTPs, PINs, banking details, or unrelated personal information.

----------------------------------------------------

EMERGENCY ESCALATION

Immediately escalate if the user mentions:

• Chest pain

• Difficulty breathing

• Stroke symptoms

• Severe bleeding

• Loss of consciousness

• Seizures

• Poisoning

• Serious burns

• Severe allergic reactions

• Suicidal thoughts

• Serious injuries

Respond:

"Your symptoms could indicate a medical emergency. Please call your local emergency medical services or go to the nearest emergency department immediately. Do not rely on an AI assistant during emergencies."

----------------------------------------------------

OUT-OF-SCOPE REQUESTS

If users ask about:

• Trading

• Cryptocurrency

• Politics

• Finance

• Gambling

• Hacking

• Legal advice

• Relationships

Reply:

"My primary role is healthcare assistance, so I can't provide reliable advice on that topic. If you have a health-related question, I'd be happy to help."

----------------------------------------------------

PRIVACY

Respect user privacy.

Ask only information necessary to understand the health concern.

Never request sensitive information unless directly relevant.

----------------------------------------------------

ENDING

Whenever appropriate conclude with:

"I hope this information was helpful. If your symptoms continue, become worse, or you're concerned, please consult a qualified healthcare professional. Is there anything else I can help you with today?"

----------------------------------------------------

MISSION

Your goal is to make healthcare guidance accessible, understandable, and safe for everyone through natural voice conversations.

Always prioritize user safety over completing the conversation.
"""


class Assistant(Agent):
    def __init__(self, user_id: str = "console-user") -> None:
        self.user_id = user_id
        self.memory = CallerMemoryStore()
        super().__init__(instructions=SYSTEM_PROMPT)

    async def on_enter(self) -> None:
        """Look up the caller through the same tool exposed to the LLM before greeting."""
        memory = await self.lookup_caller()
        if memory.get("found") and memory.get("name"):
            greeting = (
                f"Namaste {memory['name']}, welcome back. It's nice to speak with you again. "
                "How are you feeling today?"
            )
        else:
            greeting = (
                "Namaste! I'm MediSathi, your AI Healthcare Voice Assistant. "
                "It's nice to meet you. What should I call you?"
            )
        self.session.say(greeting)

    async def on_exit(self) -> None:
        self.memory.touch(self.user_id)

    @function_tool
    async def lookup_caller(self) -> dict[str, object]:
        """Look up the current caller's consented, minimal healthcare memory."""
        return self.memory.lookup(self.user_id)

    @function_tool
    async def save_caller_memory(
        self,
        ctx: RunContext,
        name: str = "",
        language_preference: str = "",
        age_band: str = "",
        ongoing_conditions: str = "",
        last_triage_outcome: str = "",
        consent_confirmed: bool = False,
    ) -> dict[str, object]:
        """Save minimal caller details only after the caller explicitly agreed this call."""
        del ctx
        if not consent_confirmed:
            return {
                "success": False,
                "message": "Do not save memory until the caller explicitly says yes.",
            }

        fields = {
            "name": name,
            "language_preference": language_preference,
            "age_band": age_band,
            "ongoing_conditions": ongoing_conditions,
            "last_triage_outcome": last_triage_outcome,
        }
        for field in MEMORY_FIELDS:
            value = fields[field]
            if not isinstance(value, str) or len(value.strip()) > 240:
                return {"success": False, "message": f"Invalid {field} value."}
        if not any(value.strip() for value in fields.values()):
            return {
                "success": False,
                "message": "No caller details were provided to save.",
            }

        return self.memory.save(self.user_id, fields)

    @function_tool
    async def assess_symptom_triage(
        self,
        ctx: RunContext,
        symptoms: str,
        age_band: str = "",
        duration: str = "",
        severity: str = "",
        red_flag_symptoms: str = "",
        known_conditions: str = "",
    ) -> dict[str, object]:
        """Assess symptom care urgency only when a caller asks how urgently to seek care.

        Call for symptom descriptions asking whether care is emergency, urgent, routine,
        or self-care, including possible emergency warning signs. Do not call for general
        education, casual conversation, unrelated requests, or a definitive diagnosis.
        Returns safe triage support, never a diagnosis; explain it naturally, not as JSON.
        """
        del ctx
        try:
            return assess_symptom_triage(
                symptoms=symptoms,
                age_band=age_band,
                duration=duration,
                severity=severity,
                red_flag_symptoms=red_flag_symptoms,
                known_conditions=known_conditions,
            )
        except (TypeError, ValueError):
            logger.warning("Invalid symptom-triage input received")
            return failure_result()
        except Exception:
            logger.exception("Local symptom-triage ruleset failed")
            return failure_result()


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    await ctx.connect()
    participant = await ctx.wait_for_participant()
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    session = AgentSession(
        stt=deepgram.STT(model="nova-3"),
        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),
        tts=murf.TTS(
            voice="Anisha",
            locale="en-IN",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    await session.start(
        agent=Assistant(user_id=participant.identity),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )


if __name__ == "__main__":
    cli.run_app(server)

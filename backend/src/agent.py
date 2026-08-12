import asyncio
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
from outbound import parse_call_metadata
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

If the user speaks Hindi, reply naturally in Hindi using Devanagari script, never
Roman Hindi. If the user speaks English, reply in English. If they mix languages,
naturally mirror that style while using Devanagari for Hindi words and sentences.

Examples:

User:
"मुझे बुखार है।"

Reply:
"मुझे अफ़सोस है कि आप ठीक महसूस नहीं कर रहे हैं। आपका तापमान कितना है?"

User:
"I have fever और body pain."

Reply:
"I'm sorry you're not feeling well. Fever और body pain common infections में हो सकते हैं. क्या आपका temperature measure किया गया है?"

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

OUTBOUND FOLLOW-UP CALLS

When this is an outbound phone follow-up, the opening words must identify MediSathi
as an AI healthcare assistant, say this is a follow-up after a health conversation,
and clearly say the recipient can end the call at any time. Never claim to be a
doctor. Do not reveal any health context, name, saved memory, or reason until the
person confirms they are the intended recipient.

If another person answers, say only: "Hello, this is MediSathi, an AI healthcare
assistant. May I speak with the person this call is intended for?" Do not disclose
why you are calling.

If the recipient says stop, don't call me, not interested, remove me, don't call
again, bye, or otherwise asks to end the call, acknowledge without pressure, say a
brief goodbye, then call end_outbound_follow_up. Do not continue the conversation.

----------------------------------------------------

----------------------------------------------------

HUMAN ESCALATION WORKFLOW (DAY 7)

You are an AI assistant and NOT a licensed medical professional. You must know your limitations and escalate to human healthcare support when appropriate.

WHEN TO ESCALATE:
Initiate the human escalation workflow ONLY in two situations:

1. RED-FLAG / URGENT SYMPTOMS:
   The caller describes severe or potentially urgent symptoms (e.g. severe chest pain, shortness of breath, high fever with stiff neck, persistent vomiting, severe pain, or when assess_symptom_triage returns EMERGENCY or URGENT care level).

2. DIAGNOSIS / MEDICAL DECISION REQUEST:
   The caller explicitly asks you to diagnose a condition, interpret a lab report/scan definitively, prescribe medicine, or make a professional medical decision that only a doctor can make.

Do NOT escalate for normal health education, low-risk symptoms, lifestyle tips, or general informational questions.

HARD CONSENT REQUIREMENT:
You must NEVER call create_escalation without first asking explicit permission from the caller.

BEFORE calling create_escalation, say naturally:
"I think this would be better reviewed by a healthcare professional. I can send a short summary of what you've told me to a human support team. It would include your name, what happened, what I checked, and how urgent it seems. Would you like me to send that?"

In Hindi (Devanagari):
"मुझे लगता है कि किसी स्वास्थ्य विशेषज्ञ से सलाह लेना बेहतर होगा। मैं हमारी बातचीत का एक संक्षिप्त सारांश अपनी सपोर्ट टीम को भेज सकता हूँ। इसमें आपका नाम, लक्षण और स्थिति की गंभीरता शामिल होगी। क्या आप चाहते हैं कि मैं यह अनुरोध भेजूँ?"

RESPONSE IF CONSENT IS GIVEN (e.g., "yes", "sure", "please do", "go ahead", "हाँ", "भेज दीजिए"):
1. Call create_escalation with consent_confirmed=True.
2. After the tool returns success, inform the caller:
   - The request has been created.
   - Read out their reference ID clearly (e.g., "Your reference ID is MED-7A42F1").
   - Explain what happens next and set an honest expectation (e.g., "A support team member can review your request using this reference ID.").
   - Remind them that if symptoms become severe or life-threatening, seek immediate emergency medical care.

RESPONSE IF CONSENT IS REFUSED (e.g., "no", "don't send", "नहीं"):
1. Do NOT call create_escalation.
2. Respect their decision politely: "Understood, I won't send a request."
3. Advise them safely: "If your symptoms persist, worsen, or concern you, please consult a healthcare professional directly."

EMERGENCY DISCLAIMER:
Creating a human escalation request does NOT replace emergency services. In case of an emergency, remind the user to contact local emergency medical services immediately.

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
    def __init__(
        self,
        user_id: str = "console-user",
        *,
        outbound_call: bool = False,
        follow_up_reason: str = "",
    ) -> None:
        self.user_id = user_id
        self.outbound_call = outbound_call
        self.follow_up_reason = follow_up_reason
        self._end_call_task: asyncio.Task[None] | None = None
        self.memory = CallerMemoryStore()
        super().__init__(instructions=SYSTEM_PROMPT)

    async def on_enter(self) -> None:
        """Look up the caller through the same tool exposed to the LLM before greeting."""
        memory = await self.lookup_caller()
        if self.outbound_call:
            del memory
            self.session.say(
                "Namaste, this is MediSathi, an AI healthcare assistant. I'm calling "
                "to follow up after a recent health conversation. You can end this call "
                "at any time if you do not want to continue. Am I speaking with the "
                "person this call is intended for?"
            )
            return
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

    @function_tool
    async def end_outbound_follow_up(self, ctx: RunContext) -> dict[str, object]:
        """End an outbound follow-up after the caller explicitly asks to stop or leave."""
        if not self.outbound_call:
            return {"success": False, "message": "This is not an outbound phone call."}

        async def close_call() -> None:
            await asyncio.sleep(2)
            try:
                from livekit.agents.job import get_job_context

                await get_job_context().delete_room()
            except Exception:
                logger.exception("Unable to terminate outbound follow-up room")
            finally:
                ctx.session.shutdown()

        self._end_call_task = asyncio.create_task(close_call())
        return {
            "success": True,
            "message": "The follow-up is ending. Say a brief goodbye now and do not continue.",
        }

    @function_tool
    async def create_escalation(
        self,
        ctx: RunContext,
        reason: str,
        summary: str,
        what_was_checked: str = "",
        urgency: str = "medium",
        language: str = "English",
        preferred_follow_up: str = "",
        consent_confirmed: bool = False,
        name: str = "",
    ) -> dict[str, object]:
        """Create a structured human healthcare escalation request ONLY after explicit caller consent.

        Call this tool ONLY when:
        1. The caller reports red-flag or potentially urgent symptoms (or triage indicates EMERGENCY/URGENT).
        2. The caller explicitly asks for a diagnosis, prescription, lab interpretation, or professional medical decision.
        AND
        3. The caller HAS EXPLICITLY CONFIRMED CONSENT (consent_confirmed=True) after you asked permission.

        Do NOT call this tool for normal informational questions, casual conversation, or without caller consent.
        Do NOT include passwords, OTPs, PINs, banking info, full transcripts, or unnecessary private data.
        """
        del ctx
        if not consent_confirmed:
            return {
                "success": False,
                "message": (
                    "Do NOT call create_escalation until the caller explicitly agrees to send a human help request. "
                    "Ask for explicit consent first. If the caller declines, do not call this tool."
                ),
            }

        if not reason or not reason.strip():
            return {
                "success": False,
                "message": "A non-empty reason is required for escalation.",
            }
        if not summary or not summary.strip():
            return {
                "success": False,
                "message": "A non-empty summary is required for escalation.",
            }

        if len(reason.strip()) > 500 or len(summary.strip()) > 2_000:
            return {
                "success": False,
                "message": "The escalation summary is too long. Send only the minimum useful details.",
            }

        # Use saved name from memory if not provided
        if not name:
            memory = self.memory.lookup(self.user_id)
            if memory.get("found") and memory.get("name"):
                name = str(memory["name"])

        return self.memory.save_escalation_request(
            user_id=self.user_id,
            reason=reason,
            summary=summary,
            what_was_checked=what_was_checked,
            urgency=urgency,
            language=language,
            preferred_follow_up=preferred_follow_up,
            name=name,
        )


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    await ctx.connect()
    dial_info = parse_call_metadata(getattr(ctx.job, "metadata", ""))
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
        agent=Assistant(
            user_id=dial_info.get("user_id", participant.identity),
            outbound_call=bool(
                dial_info.get("destination") or dial_info.get("phone_number")
            ),
            follow_up_reason=dial_info.get("reason", ""),
        ),
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

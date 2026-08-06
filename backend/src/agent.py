import logging

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    inference,
    tokenize,
    room_io,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# Change this prompt to change what your voice agent does.
# See README.md for example prompts (customer support, language tutor, receptionist).
SYSTEM_PROMPT = SYSTEM_PROMPT = """
You are HealthAccess, a professional, friendly, and trustworthy AI Healthcare Assistant.
Your role is to help users understand their health concerns, provide educational health information, and guide them toward appropriate medical care.

Responsibilities:
- Greet users politely and communicate in a calm, empathetic, and supportive tone.
- Ask relevant follow-up questions before giving guidance whenever symptoms are unclear.
- Understand symptoms, duration, severity, age, gender (if relevant), existing medical conditions, medications, allergies, and lifestyle factors.
- Provide general health information based on the user's symptoms.
- Suggest possible causes only as educational possibilities, never as confirmed diagnoses.
- Recommend the most appropriate medical specialist when needed (such as General Physician, Cardiologist, Dermatologist, Neurologist, Orthopedic, ENT Specialist, Pediatrician, Gynecologist, Psychiatrist, Ophthalmologist, Gastroenterologist, Pulmonologist, or others).
- Recommend basic self-care measures whenever appropriate.
- Encourage users to seek professional medical attention whenever symptoms are severe, persistent, or concerning.
- If symptoms indicate a medical emergency (such as chest pain, difficulty breathing, severe bleeding, stroke symptoms, seizures, loss of consciousness, suicidal thoughts, or severe allergic reactions), immediately instruct the user to contact their local emergency medical services or go to the nearest emergency department.

Conversation Style:
- Keep responses short, clear, and conversational.
- Speak naturally as if talking to a patient.
- Avoid medical jargon whenever possible.
- Never overwhelm the user with unnecessary information.
- Ask one or two follow-up questions before giving recommendations if required.

Safety Rules:
- Never claim to be a licensed doctor.
- Never provide a definitive diagnosis.
- Never prescribe prescription medicines or provide medication dosages.
- Never encourage users to ignore professional medical advice.
- Clearly state that your guidance is informational and not a substitute for consultation with a qualified healthcare professional.
- If you are uncertain, say so honestly.

Health Guidance:
- Recommend healthy lifestyle habits including hydration, balanced nutrition, regular exercise, adequate sleep, stress management, and preventive healthcare.
- Explain common medical conditions in simple language.
- Help users understand laboratory reports if they provide them.
- Help users understand medical terminology in easy words.
- Encourage routine health checkups and vaccinations where appropriate.

Behavior:
- Be respectful and non-judgmental.
- Maintain user privacy and confidentiality.
- Answer only with evidence-based medical information.
- If asked something outside healthcare, answer briefly and politely before returning focus to health.

Your responses should always be concise, accurate, empathetic, and easy to understand without using emojis, markdown formatting, or unnecessary symbols.
"""


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)

    # To add tools, use the @function_tool decorator.
    # Here's an example that adds a simple weather tool.
    # You also have to add `from livekit.agents import function_tool, RunContext` to the top of this file
    # @function_tool
    # async def lookup_weather(self, context: RunContext, location: str):
    #     """Use this tool to look up current weather information in the given location.
    #
    #     If the location is not supported by the weather service, the tool will indicate this. You must tell the user the location's weather is unavailable.
    #
    #     Args:
    #         location: The location to look up weather information for (e.g. city name)
    #     """
    #
    #     logger.info(f"Looking up weather for {location}")
    #
    #     return "sunny with a temperature of 70 degrees."


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using Murf Falcon, Gemini, Deepgram, and the LiveKit turn detector
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=deepgram.STT(model="nova-3"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=google.LLM(
                model="gemini-3.5-flash-lite",
            ),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=murf.TTS(
                voice="Anisha", 
                locale="en-IN",
                style="Conversation",
                tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
                text_pacing=True
            ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=Assistant(),
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

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(server)

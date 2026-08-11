"""Safe server-side LiveKit SIP outbound calling for MediSathi."""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from dataclasses import dataclass
from typing import Any

from livekit import api

logger = logging.getLogger(__name__)

AGENT_NAME = "my-agent"
DEFAULT_CALL_TYPE = "triage_followup"
DEFAULT_SIP_DOMAIN = "sip.linphone.org"
_E164_PHONE_NUMBER = re.compile(r"^\+[1-9]\d{7,14}$")
_SIP_URI = re.compile(r"^sip:[a-zA-Z0-9_.+-]+@[a-zA-Z0-9.-]+$")
_BARE_SIP_USER = re.compile(r"^[a-zA-Z0-9_.+-]+$")


class OutboundCallConfigurationError(ValueError):
    """Raised when secure outbound-call configuration is incomplete."""


@dataclass(frozen=True)
class OutboundCallConfig:
    """Configuration that is safe to load from the server environment."""

    livekit_url: str
    livekit_api_key: str
    livekit_api_secret: str
    outbound_trunk_id: str
    agent_name: str = AGENT_NAME
    answer_timeout_seconds: float = 35.0


def normalize_phone_number(phone_number: str) -> str:
    """Validate and normalize an E.164 phone number without guessing a country."""
    if not isinstance(phone_number, str):
        raise ValueError("Phone number must be a string in E.164 format.")
    normalized = re.sub(r"[\s()-]", "", phone_number.strip())
    if not _E164_PHONE_NUMBER.fullmatch(normalized):
        raise ValueError(
            "Phone number must be a valid E.164 number, such as +919876543210."
        )
    return normalized


def mask_phone_number(phone_number: str) -> str:
    """Return a log-safe representation of a phone number."""
    normalized = re.sub(r"\D", "", phone_number)
    if len(normalized) < 5:
        return "***"
    country_length = 2 if phone_number.startswith("+91") else 1
    return f"+{normalized[:country_length]}{'*' * max(4, len(normalized) - country_length - 4)}{normalized[-4:]}"


def normalize_sip_destination(destination: str, domain: str | None = None) -> str:
    """Accept a bare SIP username, full SIP URI, or E.164 number.

    Returns a canonical SIP URI (``sip:user@domain``) for SIP destinations or a
    normalised E.164 string for phone numbers.  The *domain* parameter defaults
    to the ``SIP_DEFAULT_DOMAIN`` environment variable, falling back to
    ``sip.linphone.org``.
    """
    if not isinstance(destination, str) or not destination.strip():
        raise ValueError("Destination must be a non-empty string.")
    destination = destination.strip()
    domain = (
        domain
        or os.environ.get("SIP_DEFAULT_DOMAIN", "").strip()
        or DEFAULT_SIP_DOMAIN
    )

    # Already a full SIP URI
    if destination.lower().startswith("sip:"):
        if not _SIP_URI.fullmatch(destination):
            raise ValueError(
                "SIP URI must be in the form sip:user@domain, "
                f"for example sip:myuser@{domain}"
            )
        return destination

    # E.164 phone number
    if destination.startswith("+"):
        return normalize_phone_number(destination)

    # Bare SIP username
    if not _BARE_SIP_USER.fullmatch(destination):
        raise ValueError(
            "SIP username may only contain letters, digits, dots, underscores, "
            "hyphens, and plus signs."
        )
    return f"sip:{destination}@{domain}"


def is_sip_uri(destination: str) -> bool:
    """Return True if the destination is a SIP URI rather than a phone number."""
    return destination.lower().startswith("sip:")


def mask_sip_destination(destination: str) -> str:
    """Return a log-safe representation of a SIP URI or phone number."""
    if is_sip_uri(destination):
        # sip:username@domain -> sip:us***me@domain
        without_prefix = destination[4:]  # strip 'sip:'
        if "@" in without_prefix:
            user, domain = without_prefix.split("@", 1)
            masked_user = "***" if len(user) <= 3 else f"{user[:2]}***{user[-2:]}"
            return f"sip:{masked_user}@{domain}"
        return "sip:***"
    return mask_phone_number(destination)


def extract_sip_call_to(destination: str) -> str:
    """Extract the username or phone number for LiveKit's sip_call_to parameter.

    LiveKit Cloud expects sip_call_to to be the SIP username (e.g. 'shivamksr1')
    or phone number (e.g. '+919876543210'), NOT a full 'sip:user@domain' URI,
    because the domain is already specified by the outbound SIP trunk.
    """
    if destination.lower().startswith("sip:"):
        without_prefix = destination[4:]
        if "@" in without_prefix:
            return without_prefix.split("@", 1)[0]
        return without_prefix
    return destination


def mask_trunk_id(trunk_id: str) -> str:
    """Return a log-safe representation of a SIP trunk ID."""
    if not trunk_id:
        return "***"
    if len(trunk_id) <= 6:
        return f"{trunk_id[:2]}***"
    return f"{trunk_id[:4]}***{trunk_id[-2:]}"


def make_room_name() -> str:
    """Create an unpredictable, non-sensitive room name for one follow-up call."""
    return f"medisathi-followup-{uuid.uuid4().hex}"


def build_call_metadata(
    *,
    destination: str | None = None,
    phone_number: str | None = None,
    user_id: str | None = None,
    caller_name: str | None = None,
    reason: str | None = None,
    call_type: str = DEFAULT_CALL_TYPE,
) -> str:
    """Build minimal metadata; detailed health information must never be included.

    Accepts either *destination* (SIP URI, bare username, or E.164) or the legacy
    *phone_number* parameter for backward compatibility.
    """
    raw = destination or phone_number
    if not raw:
        raise ValueError("Either destination or phone_number must be provided.")
    normalized = normalize_sip_destination(raw)
    if call_type != DEFAULT_CALL_TYPE:
        raise ValueError("Unsupported outbound call type.")
    if reason and len(reason) > 240:
        raise ValueError("Call reason must be 240 characters or fewer.")
    if caller_name and len(caller_name) > 120:
        raise ValueError("Caller name must be 120 characters or fewer.")
    if user_id and len(user_id) > 240:
        raise ValueError("User ID must be 240 characters or fewer.")

    metadata: dict[str, str] = {
        "destination": normalized,
        "call_type": call_type,
        "reason": reason.strip() if reason else "Follow-up after a health concern",
    }
    # Keep phone_number key for backward-compatible metadata consumers
    if not is_sip_uri(normalized):
        metadata["phone_number"] = normalized
    if user_id:
        metadata["user_id"] = user_id.strip()
    if caller_name:
        metadata["caller_name"] = caller_name.strip()
    return json.dumps(metadata, separators=(",", ":"))


def parse_call_metadata(metadata: str | None) -> dict[str, str]:
    """Parse and validate agent metadata, failing closed for malformed data."""
    if not metadata:
        return {}
    try:
        data = json.loads(metadata)
    except (TypeError, json.JSONDecodeError):
        logger.warning("Ignoring malformed outbound call metadata")
        return {}
    if not isinstance(data, dict):
        return {}

    # Accept either 'destination' (new) or 'phone_number' (legacy)
    raw_dest = data.get("destination") or data.get("phone_number")
    if not raw_dest:
        return {}
    try:
        normalized = normalize_sip_destination(str(raw_dest))
    except ValueError:
        logger.warning("Ignoring outbound metadata with invalid destination")
        return {}
    return {
        key: value.strip()
        for key, value in {
            "destination": normalized,
            "phone_number": normalized if not is_sip_uri(normalized) else "",
            "call_type": data.get("call_type", DEFAULT_CALL_TYPE),
            "reason": data.get("reason", "Follow-up after a health concern"),
            "user_id": data.get("user_id", ""),
            "caller_name": data.get("caller_name", ""),
        }.items()
        if isinstance(value, str) and value.strip()
    }


def load_outbound_config(env: dict[str, str] | None = None) -> OutboundCallConfig:
    """Load required configuration without returning it to clients or logs."""
    values = os.environ if env is None else env
    required = {
        "LIVEKIT_URL": values.get("LIVEKIT_URL", "").strip(),
        "LIVEKIT_API_KEY": values.get("LIVEKIT_API_KEY", "").strip(),
        "LIVEKIT_API_SECRET": values.get("LIVEKIT_API_SECRET", "").strip(),
        "LIVEKIT_SIP_OUTBOUND_TRUNK_ID": values.get(
            "LIVEKIT_SIP_OUTBOUND_TRUNK_ID", ""
        ).strip(),
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        raise OutboundCallConfigurationError(
            "Outbound calling is not configured. Missing: " + ", ".join(missing)
        )
    try:
        timeout = float(values.get("MEDISATHI_OUTBOUND_ANSWER_TIMEOUT", "35"))
    except ValueError as error:
        raise OutboundCallConfigurationError(
            "Answer timeout must be a number."
        ) from error
    if not 5 <= timeout <= 120:
        raise OutboundCallConfigurationError(
            "Answer timeout must be between 5 and 120 seconds."
        )
    return OutboundCallConfig(
        livekit_url=required["LIVEKIT_URL"],
        livekit_api_key=required["LIVEKIT_API_KEY"],
        livekit_api_secret=required["LIVEKIT_API_SECRET"],
        outbound_trunk_id=required["LIVEKIT_SIP_OUTBOUND_TRUNK_ID"],
        agent_name=values.get("AGENT_NAME", AGENT_NAME).strip() or AGENT_NAME,
        answer_timeout_seconds=timeout,
    )


def classify_call_failure(error: Exception) -> tuple[str, str]:
    """Map provider errors to non-sensitive outcomes suitable for operators."""
    detail = str(error)
    detail_lower = detail.lower()
    status_code = getattr(error, "status", getattr(error, "status_code", None))
    code_str = f" (status {status_code})" if status_code else ""

    if "voicemail" in detail_lower or "answering machine" in detail_lower:
        return "voicemail", f"Call reached voicemail.{code_str}"
    if "busy" in detail_lower:
        return "busy", f"User's line was busy.{code_str}"
    if any(word in detail_lower for word in ("declin", "reject", "forbidden")):
        return "declined", f"Call was declined or rejected.{code_str}"
    if any(word in detail_lower for word in ("no answer", "unavailable", "ring", "timeout")):
        return "no_answer", f"Call was not answered or timed out.{code_str}"
    return (
        "provider_failure",
        f"Unable to place call: {detail}",
    )


async def make_outbound_call(
    destination: str,
    user_id: str | None = None,
    reason: str | None = None,
    call_type: str = DEFAULT_CALL_TYPE,
    caller_name: str | None = None,
    *,
    config: OutboundCallConfig | None = None,
    livekit_api: Any | None = None,
) -> dict[str, str | bool]:
    """Dispatch MediSathi and dial a SIP participant in an isolated LiveKit room.

    *destination* can be an E.164 phone number, a full SIP URI
    (``sip:user@domain``), or a bare SIP username (resolved against the
    configured default domain).  This is intentionally server-only.  It returns
    safe status data and never logs or returns credentials or the destination.
    """
    normalized = normalize_sip_destination(destination)
    config = config or load_outbound_config()
    room_name = make_room_name()
    sip_call_to = extract_sip_call_to(normalized)

    logger.info(
        "Initiating outbound call to %s (sip_call_to: %s) via trunk %s (room: %s)",
        mask_sip_destination(normalized),
        extract_sip_call_to(mask_sip_destination(normalized)),
        mask_trunk_id(config.outbound_trunk_id),
        room_name,
    )

    metadata = build_call_metadata(
        destination=normalized,
        user_id=user_id,
        caller_name=caller_name,
        reason=reason,
        call_type=call_type,
    )
    owns_api = livekit_api is None
    client = livekit_api or api.LiveKitAPI(
        url=config.livekit_url,
        api_key=config.livekit_api_key,
        api_secret=config.livekit_api_secret,
    )
    dispatch = None
    try:
        dispatch = await client.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name=config.agent_name,
                room=room_name,
                metadata=metadata,
            )
        )
        participant = await client.sip.create_sip_participant(
            api.CreateSIPParticipantRequest(
                sip_call_to=sip_call_to,
                room_name=room_name,
                participant_identity=f"sip-{uuid.uuid4().hex}",
                participant_name="MediSathi follow-up recipient",
                wait_until_answered=True,
            ),
            trunk_id=config.outbound_trunk_id,
            timeout=config.answer_timeout_seconds,
        )
    except Exception as error:
        outcome, message = classify_call_failure(error)
        logger.warning(
            "Outbound call %s for %s via trunk %s: %s",
            outcome,
            mask_sip_destination(normalized),
            mask_trunk_id(config.outbound_trunk_id),
            message,
        )
        if dispatch is not None:
            try:
                await client.agent_dispatch.delete_dispatch(dispatch.id, room_name)
            except Exception:
                logger.warning("Unable to clean up failed outbound dispatch")
        return {
            "success": False,
            "outcome": outcome,
            "message": message,
            "room_name": room_name,
        }
    finally:
        if owns_api:
            await client.aclose()

    logger.info("Outbound call answered for %s", mask_sip_destination(normalized))
    return {
        "success": True,
        "outcome": "answered",
        "message": "Call was answered and MediSathi was connected.",
        "room_name": room_name,
        "participant_identity": participant.participant_identity,
    }

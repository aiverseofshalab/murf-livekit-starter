"""Developer CLI for a manually initiated MediSathi follow-up call."""

from __future__ import annotations

import argparse
import asyncio
import sys

from dotenv import load_dotenv

from outbound import OutboundCallConfigurationError, make_outbound_call


def _arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Place a MediSathi follow-up call via SIP or PSTN.",
        epilog=(
            "Examples:\n"
            "  uv run python src/make_call.py --to myuser\n"
            "  uv run python src/make_call.py --to sip:myuser@sip.linphone.org\n"
            "  uv run python src/make_call.py --to +919876543210\n"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--to",
        required=True,
        dest="destination",
        help=(
            "Destination to call: a bare Linphone username, a full SIP URI "
            "(sip:user@domain), or an E.164 phone number (+919876543210)"
        ),
    )
    parser.add_argument(
        "--name",
        dest="caller_name",
        default=None,
        help="Optional display name for the call recipient",
    )
    parser.add_argument("--user-id", help="Optional consented MediSathi user ID")
    parser.add_argument("--reason", help="Brief non-sensitive follow-up reason")
    return parser.parse_args()


async def main() -> int:
    load_dotenv(".env.local")
    args = _arguments()
    try:
        result = await make_outbound_call(
            args.destination,
            user_id=args.user_id,
            reason=args.reason,
            caller_name=args.caller_name,
        )
    except (OutboundCallConfigurationError, ValueError) as error:
        print(f"Outbound call not started: {error}", file=sys.stderr)
        return 2
    print(f"Outbound call {result['outcome']}: {result['message']}")
    return 0 if result["success"] else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))

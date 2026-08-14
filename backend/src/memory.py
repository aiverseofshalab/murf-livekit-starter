"""Minimal, consent-based persistent memory for MediSathi."""

from __future__ import annotations

import logging
import os
import re
import secrets
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "data" / "medisathi_memory.db"
MEMORY_FIELDS = (
    "name",
    "language_preference",
    "age_band",
    "ongoing_conditions",
    "last_triage_outcome",
)
ESCALATION_TEXT_LIMITS = {
    "user_id": 240,
    "name": 120,
    "reason": 500,
    "summary": 2_000,
    "what_was_checked": 1_000,
    "language": 80,
    "preferred_follow_up": 240,
}
SENSITIVE_ESCALATION_MARKERS = (
    "password",
    "passcode",
    "otp",
    "one-time password",
    "pin",
    "credit card",
    "debit card",
    "card number",
    "bank account",
    "authentication credential",
)


class CallerMemoryStore:
    """SQLite storage that contains only the approved, structured caller fields."""

    def __init__(self, db_path: str | Path | None = None) -> None:
        self.db_path = Path(
            db_path or os.getenv("MEDISATHI_MEMORY_DB", DEFAULT_DB_PATH)
        )
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS caller_memory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE NOT NULL,
                    name TEXT,
                    language_preference TEXT,
                    age_band TEXT,
                    ongoing_conditions TEXT,
                    last_triage_outcome TEXT,
                    consent_given INTEGER NOT NULL DEFAULT 0,
                    last_interaction TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS escalation_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    reference_id TEXT UNIQUE NOT NULL,
                    user_id TEXT NOT NULL,
                    name TEXT,
                    reason TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    what_was_checked TEXT,
                    urgency TEXT NOT NULL DEFAULT 'medium',
                    language TEXT,
                    preferred_follow_up TEXT,
                    status TEXT NOT NULL DEFAULT 'open',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS call_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    call_id TEXT UNIQUE NOT NULL,
                    user_id TEXT NOT NULL,
                    channel TEXT NOT NULL DEFAULT 'browser',
                    started_at TEXT NOT NULL,
                    ended_at TEXT,
                    duration_seconds INTEGER DEFAULT 0,
                    outcome TEXT DEFAULT 'ongoing',
                    success_reason TEXT DEFAULT '',
                    failure_reason TEXT DEFAULT ''
                )
                """
            )

    def lookup(self, user_id: str) -> dict[str, Any]:
        try:
            with self._connect() as connection:
                row = connection.execute(
                    """
                    SELECT user_id, name, language_preference, age_band,
                           ongoing_conditions, last_triage_outcome, last_interaction
                    FROM caller_memory
                    WHERE user_id = ? AND consent_given = 1
                    """,
                    (user_id,),
                ).fetchone()
        except sqlite3.Error:
            logger.exception("Unable to look up caller memory")
            return {"found": False, "error": "Memory is temporarily unavailable."}

        return {"found": False} if row is None else {"found": True, **dict(row)}

    def save(self, user_id: str, fields: dict[str, str]) -> dict[str, Any]:
        cleaned = {field: fields.get(field, "").strip() for field in MEMORY_FIELDS}
        now = _timestamp()
        try:
            with self._connect() as connection:
                connection.execute(
                    """
                    INSERT INTO caller_memory (
                        user_id, name, language_preference, age_band, ongoing_conditions,
                        last_triage_outcome, consent_given, last_interaction, created_at,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
                    ON CONFLICT(user_id) DO UPDATE SET
                        name = COALESCE(NULLIF(excluded.name, ''), caller_memory.name),
                        language_preference = COALESCE(
                            NULLIF(excluded.language_preference, ''),
                            caller_memory.language_preference
                        ),
                        age_band = COALESCE(NULLIF(excluded.age_band, ''), caller_memory.age_band),
                        ongoing_conditions = COALESCE(
                            NULLIF(excluded.ongoing_conditions, ''),
                            caller_memory.ongoing_conditions
                        ),
                        last_triage_outcome = COALESCE(
                            NULLIF(excluded.last_triage_outcome, ''),
                            caller_memory.last_triage_outcome
                        ),
                        consent_given = 1,
                        last_interaction = excluded.last_interaction,
                        updated_at = excluded.updated_at
                    """,
                    (
                        user_id,
                        *[cleaned[field] for field in MEMORY_FIELDS],
                        now,
                        now,
                        now,
                    ),
                )
        except sqlite3.Error:
            logger.exception("Unable to save caller memory")
            return {"success": False, "message": "Memory could not be saved."}

        return {"success": True, "message": "Caller memory saved."}

    def touch(self, user_id: str) -> None:
        now = _timestamp()
        try:
            with self._connect() as connection:
                connection.execute(
                    """
                    UPDATE caller_memory
                    SET last_interaction = ?, updated_at = ?
                    WHERE user_id = ? AND consent_given = 1
                    """,
                    (now, now, user_id),
                )
        except sqlite3.Error:
            logger.exception("Unable to update caller interaction time")

    def save_escalation_request(
        self,
        user_id: str,
        reason: str,
        summary: str,
        what_was_checked: str = "",
        urgency: str = "medium",
        language: str = "English",
        preferred_follow_up: str = "",
        name: str = "",
    ) -> dict[str, Any]:
        """Save a human-escalation request with a unique reference ID (e.g. MED-7A42F1)."""
        values = {
            "user_id": user_id,
            "name": name,
            "reason": reason,
            "summary": summary,
            "what_was_checked": what_was_checked,
            "language": language,
            "preferred_follow_up": preferred_follow_up,
        }
        invalid_field = _invalid_escalation_field(values)
        if invalid_field:
            return {
                "success": False,
                "message": f"Invalid or unsafe escalation {invalid_field}.",
            }

        cleaned = {key: value.strip() for key, value in values.items()}
        now = _timestamp()
        urgency_clean = urgency.lower().strip() if urgency else "medium"
        if urgency_clean not in {"low", "medium", "high", "emergency"}:
            urgency_clean = "medium"

        try:
            with self._connect() as connection:
                for _ in range(5):
                    ref_id = f"MED-{secrets.token_hex(3).upper()}"
                    try:
                        connection.execute(
                            """
                            INSERT INTO escalation_requests (
                                reference_id, user_id, name, reason, summary,
                                what_was_checked, urgency, language, preferred_follow_up,
                                status, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
                            """,
                            (
                                ref_id,
                                cleaned["user_id"],
                                cleaned["name"],
                                cleaned["reason"],
                                cleaned["summary"],
                                cleaned["what_was_checked"],
                                urgency_clean,
                                cleaned["language"] or "English",
                                cleaned["preferred_follow_up"],
                                now,
                                now,
                            ),
                        )
                        break
                    except sqlite3.IntegrityError:
                        continue
                else:
                    return {
                        "success": False,
                        "message": "Human escalation request could not be assigned a reference ID.",
                    }
        except sqlite3.Error:
            logger.exception("Unable to save escalation request")
            return {
                "success": False,
                "message": "Human escalation request could not be saved due to a system error.",
            }

        return {
            "success": True,
            "reference_id": ref_id,
            "status": "open",
            "message": "Human escalation request created successfully.",
            "details": {
                "reference_id": ref_id,
                "user_id": cleaned["user_id"],
                "name": cleaned["name"],
                "reason": cleaned["reason"],
                "summary": cleaned["summary"],
                "what_was_checked": cleaned["what_was_checked"],
                "urgency": urgency_clean,
                "language": cleaned["language"] or "English",
                "preferred_follow_up": cleaned["preferred_follow_up"],
                "status": "open",
                "created_at": now,
            },
        }

    def lookup_escalation_request(self, reference_id: str) -> dict[str, Any]:
        try:
            with self._connect() as connection:
                row = connection.execute(
                    """
                    SELECT reference_id, user_id, name, reason, summary,
                           what_was_checked, urgency, language, preferred_follow_up,
                           status, created_at, updated_at
                    FROM escalation_requests
                    WHERE reference_id = ?
                    """,
                    (reference_id.strip().upper(),),
                ).fetchone()
        except sqlite3.Error:
            logger.exception("Unable to lookup escalation request")
            return {
                "found": False,
                "error": "Escalation store is temporarily unavailable.",
            }

        return {"found": False} if row is None else {"found": True, **dict(row)}

    def list_escalation_requests(
        self, user_id: str | None = None, status: str | None = None
    ) -> list[dict[str, Any]]:
        try:
            with self._connect() as connection:
                query = "SELECT * FROM escalation_requests"
                params: list[Any] = []
                conditions: list[str] = []
                if user_id:
                    conditions.append("user_id = ?")
                    params.append(user_id)
                if status:
                    conditions.append("status = ?")
                    params.append(status)
                if conditions:
                    query += " WHERE " + " AND ".join(conditions)
                query += " ORDER BY id DESC"
                rows = connection.execute(query, params).fetchall()
                return [dict(r) for r in rows]
        except sqlite3.Error:
            logger.exception("Unable to list escalation requests")
            return []

    def update_escalation_status(
        self, reference_id: str, new_status: str
    ) -> dict[str, Any]:
        """Update status of an escalation request ('open', 'in_progress', 'resolved')."""
        status_clean = new_status.lower().strip()
        if status_clean not in {"open", "in_progress", "resolved"}:
            return {
                "success": False,
                "message": "Invalid status. Must be 'open', 'in_progress', or 'resolved'.",
            }
        now = _timestamp()
        try:
            with self._connect() as connection:
                cursor = connection.execute(
                    """
                    UPDATE escalation_requests
                    SET status = ?, updated_at = ?
                    WHERE reference_id = ?
                    """,
                    (status_clean, now, reference_id.strip().upper()),
                )
                if cursor.rowcount == 0:
                    return {
                        "success": False,
                        "message": f"Escalation request {reference_id} not found.",
                    }
        except sqlite3.Error:
            logger.exception("Unable to update escalation status")
            return {
                "success": False,
                "message": "Failed to update status due to a database error.",
            }

        return {
            "success": True,
            "reference_id": reference_id.strip().upper(),
            "status": status_clean,
            "updated_at": now,
            "message": f"Status updated to {status_clean}.",
        }

    def get_escalation_stats(self) -> dict[str, int]:
        """Return dynamic stats: total, open, urgent (high or emergency), resolved."""
        try:
            with self._connect() as connection:
                total = connection.execute(
                    "SELECT COUNT(*) FROM escalation_requests"
                ).fetchone()[0]
                open_count = connection.execute(
                    "SELECT COUNT(*) FROM escalation_requests WHERE status = 'open'"
                ).fetchone()[0]
                urgent_count = connection.execute(
                    "SELECT COUNT(*) FROM escalation_requests WHERE urgency IN ('high', 'emergency')"
                ).fetchone()[0]
                resolved_count = connection.execute(
                    "SELECT COUNT(*) FROM escalation_requests WHERE status = 'resolved'"
                ).fetchone()[0]
                return {
                    "total": total,
                    "open": open_count,
                    "urgent": urgent_count,
                    "resolved": resolved_count,
                }
        except sqlite3.Error:
            logger.exception("Unable to calculate escalation stats")
            return {"total": 0, "open": 0, "urgent": 0, "resolved": 0}

    def create_call_record(
        self, call_id: str, user_id: str, channel: str = "browser"
    ) -> dict[str, Any]:
        """Create a new call record in SQLite with status 'ongoing'."""
        now = _timestamp()
        ch_clean = "sip" if "sip" in channel.lower() else "browser"
        try:
            with self._connect() as connection:
                connection.execute(
                    """
                    INSERT INTO call_records (
                        call_id, user_id, channel, started_at, outcome
                    ) VALUES (?, ?, ?, ?, 'ongoing')
                    """,
                    (call_id, user_id, ch_clean, now),
                )
        except sqlite3.IntegrityError:
            return {"success": True, "call_id": call_id, "already_existed": True}
        except sqlite3.Error:
            logger.exception("Unable to create call record")
            return {"success": False, "message": "Database error creating call record."}

        return {"success": True, "call_id": call_id, "started_at": now}

    def finish_call_record(
        self,
        call_id: str,
        outcome: str = "successful",
        duration_seconds: int = 0,
        success_reason: str = "",
        failure_reason: str = "",
    ) -> dict[str, Any]:
        """Complete an existing call record with outcome, duration, and reasons."""
        now = _timestamp()
        outcome_clean = (
            "successful" if outcome.lower().strip() == "successful" else "failed"
        )
        try:
            with self._connect() as connection:
                cursor = connection.execute(
                    """
                    UPDATE call_records
                    SET ended_at = ?, duration_seconds = ?, outcome = ?,
                        success_reason = ?, failure_reason = ?
                    WHERE call_id = ?
                    """,
                    (
                        now,
                        max(0, duration_seconds),
                        outcome_clean,
                        success_reason[:500],
                        failure_reason[:500],
                        call_id,
                    ),
                )
                if cursor.rowcount == 0:
                    connection.execute(
                        """
                        INSERT INTO call_records (
                            call_id, user_id, channel, started_at, ended_at,
                            duration_seconds, outcome, success_reason, failure_reason
                        ) VALUES (?, 'unknown', 'browser', ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            call_id,
                            now,
                            now,
                            max(0, duration_seconds),
                            outcome_clean,
                            success_reason[:500],
                            failure_reason[:500],
                        ),
                    )
        except sqlite3.Error:
            logger.exception("Unable to finish call record")
            return {
                "success": False,
                "message": "Database error completing call record.",
            }

        return {"success": True, "call_id": call_id, "outcome": outcome_clean}

    def get_call_analytics(self) -> dict[str, Any]:
        """Return dynamic call analytics calculated strictly from SQLite call_records."""
        try:
            with self._connect() as connection:
                total = connection.execute(
                    "SELECT COUNT(*) FROM call_records"
                ).fetchone()[0]
                successful = connection.execute(
                    "SELECT COUNT(*) FROM call_records WHERE outcome = 'successful'"
                ).fetchone()[0]
                failed = connection.execute(
                    "SELECT COUNT(*) FROM call_records WHERE outcome = 'failed'"
                ).fetchone()[0]
                rate = round((successful / total * 100), 1) if total > 0 else 0.0
                return {
                    "total_calls": total,
                    "successful_calls": successful,
                    "failed_calls": failed,
                    "success_rate": rate,
                }
        except sqlite3.Error:
            logger.exception("Unable to calculate call analytics")
            return {
                "total_calls": 0,
                "successful_calls": 0,
                "failed_calls": 0,
                "success_rate": 0.0,
            }

    def get_recent_calls(self, limit: int = 10) -> list[dict[str, Any]]:
        """Return safe recent call metadata (timestamp, channel, duration, outcome)."""
        try:
            with self._connect() as connection:
                rows = connection.execute(
                    """
                    SELECT call_id, user_id, channel, started_at, ended_at,
                           duration_seconds, outcome, success_reason, failure_reason
                    FROM call_records
                    ORDER BY id DESC
                    LIMIT ?
                    """,
                    (max(1, min(limit, 50)),),
                ).fetchall()
                return [dict(r) for r in rows]
        except sqlite3.Error:
            logger.exception("Unable to fetch recent call records")
            return []


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


def _invalid_escalation_field(values: dict[str, str]) -> str | None:
    """Reject malformed or secret-bearing text before it reaches SQLite."""
    for field, value in values.items():
        if (
            not isinstance(value, str)
            or len(value.strip()) > ESCALATION_TEXT_LIMITS[field]
        ):
            return field

    combined = " ".join(values.values()).lower()
    if any(
        re.search(rf"\b{re.escape(marker)}\b", combined)
        for marker in SENSITIVE_ESCALATION_MARKERS
    ):
        return "content"
    return None

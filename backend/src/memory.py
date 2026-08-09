"""Minimal, consent-based persistent memory for MediSathi."""

from __future__ import annotations

import logging
import os
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


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()

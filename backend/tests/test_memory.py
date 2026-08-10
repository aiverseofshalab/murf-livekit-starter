from memory import CallerMemoryStore


def test_memory_persists_and_preserves_unprovided_fields(tmp_path) -> None:
    db_path = tmp_path / "medisathi_memory.db"
    store = CallerMemoryStore(db_path)

    assert store.lookup("medisathi-test-user") == {"found": False}

    saved = store.save(
        "medisathi-test-user",
        {
            "name": "Ramesh",
            "language_preference": "Hindi",
            "age_band": "25-34",
            "ongoing_conditions": "Diabetes",
            "last_triage_outcome": "Routine guidance",
        },
    )
    assert saved["success"] is True

    restarted_store = CallerMemoryStore(db_path)
    record = restarted_store.lookup("medisathi-test-user")
    assert record["found"] is True
    assert record["name"] == "Ramesh"
    assert record["language_preference"] == "Hindi"

    restarted_store.save(
        "medisathi-test-user",
        {
            "name": "",
            "language_preference": "English",
            "age_band": "",
            "ongoing_conditions": "",
            "last_triage_outcome": "",
        },
    )
    updated_record = restarted_store.lookup("medisathi-test-user")
    assert updated_record["name"] == "Ramesh"
    assert updated_record["language_preference"] == "English"

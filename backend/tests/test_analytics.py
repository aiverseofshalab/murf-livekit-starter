from memory import CallerMemoryStore


def test_empty_database_returns_zero_analytics(tmp_path) -> None:
    db_path = tmp_path / "medisathi_test.db"
    store = CallerMemoryStore(db_path)

    analytics = store.get_call_analytics()
    assert analytics["total_calls"] == 0
    assert analytics["successful_calls"] == 0
    assert analytics["failed_calls"] == 0
    assert analytics["success_rate"] == 0.0

    recent = store.get_recent_calls()
    assert recent == []


def test_call_record_created_and_completed(tmp_path) -> None:
    db_path = tmp_path / "medisathi_test.db"
    store = CallerMemoryStore(db_path)

    # 1. Create call record
    create_res = store.create_call_record(
        call_id="call_test_001", user_id="user_123", channel="browser"
    )
    assert create_res["success"] is True
    assert create_res["call_id"] == "call_test_001"

    # 2. Finish call record as successful
    finish_res = store.finish_call_record(
        call_id="call_test_001",
        outcome="successful",
        duration_seconds=45,
        success_reason="Provided safe health guidance",
    )
    assert finish_res["success"] is True
    assert finish_res["outcome"] == "successful"

    # 3. Verify analytics counts
    analytics = store.get_call_analytics()
    assert analytics["total_calls"] == 1
    assert analytics["successful_calls"] == 1
    assert analytics["failed_calls"] == 0
    assert analytics["success_rate"] == 100.0


def test_successful_and_failed_calls_counting_and_success_rate(
    tmp_path,
) -> None:
    db_path = tmp_path / "medisathi_test.db"
    store = CallerMemoryStore(db_path)

    # Call 1: Successful Browser Call
    store.create_call_record(call_id="call_001", user_id="user_a", channel="browser")
    store.finish_call_record(
        call_id="call_001",
        outcome="successful",
        duration_seconds=60,
        success_reason="Symptom triage completed",
    )

    # Call 2: Successful SIP Call
    store.create_call_record(call_id="call_002", user_id="user_b", channel="sip")
    store.finish_call_record(
        call_id="call_002",
        outcome="successful",
        duration_seconds=120,
        success_reason="Facility lookup succeeded",
    )

    # Call 3: Successful Escalation Call
    store.create_call_record(call_id="call_003", user_id="user_c", channel="browser")
    store.finish_call_record(
        call_id="call_003",
        outcome="successful",
        duration_seconds=90,
        success_reason="Human escalation created with consent",
    )

    # Call 4: Failed Call (Early Disconnect)
    store.create_call_record(call_id="call_004", user_id="user_d", channel="browser")
    store.finish_call_record(
        call_id="call_004",
        outcome="failed",
        duration_seconds=3,
        failure_reason="User hung up immediately",
    )

    # Verify Analytics
    analytics = store.get_call_analytics()
    assert analytics["total_calls"] == 4
    assert analytics["successful_calls"] == 3
    assert analytics["failed_calls"] == 1
    assert analytics["success_rate"] == 75.0


def test_duplicate_completion_does_not_create_duplicate_records(
    tmp_path,
) -> None:
    db_path = tmp_path / "medisathi_test.db"
    store = CallerMemoryStore(db_path)

    store.create_call_record(
        call_id="call_dup_1", user_id="user_dup", channel="browser"
    )
    # First finish call
    store.finish_call_record(
        call_id="call_dup_1",
        outcome="successful",
        duration_seconds=30,
    )
    # Duplicate finish call
    store.finish_call_record(
        call_id="call_dup_1",
        outcome="successful",
        duration_seconds=35,
    )

    analytics = store.get_call_analytics()
    assert analytics["total_calls"] == 1
    assert analytics["successful_calls"] == 1


def test_duplicate_create_call_record_is_idempotent(tmp_path) -> None:
    db_path = tmp_path / "medisathi_test.db"
    store = CallerMemoryStore(db_path)

    res1 = store.create_call_record(
        call_id="call_idem", user_id="user_1", channel="browser"
    )
    res2 = store.create_call_record(
        call_id="call_idem", user_id="user_1", channel="browser"
    )

    assert res1["success"] is True
    assert res2["success"] is True
    assert res2.get("already_existed") is True

    recent = store.get_recent_calls()
    assert len(recent) == 1


def test_recent_calls_sanitization_no_sensitive_info(tmp_path) -> None:
    db_path = tmp_path / "medisathi_test.db"
    store = CallerMemoryStore(db_path)

    store.create_call_record(
        call_id="call_priv", user_id="privacy_user", channel="browser"
    )
    store.finish_call_record(
        call_id="call_priv",
        outcome="successful",
        duration_seconds=40,
        success_reason="Provided general fever guidance",
    )

    recent = store.get_recent_calls(limit=5)
    assert len(recent) == 1
    record = recent[0]

    # Verify returned fields are safe metadata only
    allowed_keys = {
        "call_id",
        "user_id",
        "channel",
        "started_at",
        "ended_at",
        "duration_seconds",
        "outcome",
        "success_reason",
        "failure_reason",
    }
    assert set(record.keys()).issubset(allowed_keys)
    # Ensure sensitive markers are not in reasons
    assert "transcript" not in record
    assert "otp" not in record
    assert "pin" not in record

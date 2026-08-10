import triage


def test_emergency_red_flag_returns_emergency() -> None:
    result = triage.assess_symptom_triage(
        symptoms="I have severe chest pain and cannot breathe",
        severity="severe",
    )

    assert result["success"] is True
    assert result["triage_level"] == "EMERGENCY"
    assert result["red_flags"]


def test_mild_common_symptom_returns_self_care() -> None:
    result = triage.assess_symptom_triage(
        symptoms="I have a mild cough and runny nose",
        severity="mild",
        duration="two days",
    )

    assert result["triage_level"] == "SELF_CARE"


def test_insufficient_information_returns_unknown() -> None:
    result = triage.assess_symptom_triage(symptoms="")

    assert result["success"] is True
    assert result["triage_level"] == "UNKNOWN"


def test_invalid_input_has_structured_failure() -> None:
    try:
        triage.assess_symptom_triage(symptoms=None)  # type: ignore[arg-type]
    except ValueError:
        result = triage.failure_result()
    else:
        raise AssertionError("Invalid input should fail safely")

    assert result["success"] is False
    assert result["triage_level"] == "UNKNOWN"
    assert result["recommended_action"]


def test_result_is_not_a_diagnosis_and_includes_freshness() -> None:
    result = triage.assess_symptom_triage(symptoms="unusual symptom")

    assert "diagnos" not in result["reason"].lower()
    assert result["source"]
    assert result["data_timestamp"]
    assert result["data_mode"] == "LOCAL_RULESET"
    assert result["disclaimer"] == "This is triage support, not a diagnosis."

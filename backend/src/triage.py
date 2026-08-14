"""Deterministic, conservative symptom-triage support for MediSathi.

This module is deliberately a local ruleset, not a diagnostic model.  The rules are
based on public emergency-warning guidance from NHS and CDC and are intended only to
help a caller choose a level of care when they explicitly ask for triage.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

LOCAL_RULESET_SOURCE = (
    "MediSathi local clinical triage ruleset v1.0 (informed by NHS emergency "
    "care guidance and CDC emergency warning signs)"
)
DISCLAIMER = "This is triage support, not a diagnosis."

EMERGENCY_FLAGS = {
    "severe difficulty breathing": "severe difficulty breathing",
    "cannot breathe": "severe difficulty breathing",
    "struggling to breathe": "severe difficulty breathing",
    "severe chest pain": "severe chest pain or pressure",
    "chest pressure": "severe chest pain or pressure",
    "face drooping": "possible stroke symptoms",
    "facial drooping": "possible stroke symptoms",
    "arm weakness": "possible stroke symptoms",
    "speech difficulty": "possible stroke symptoms",
    "slurred speech": "possible stroke symptoms",
    "loss of consciousness": "loss of consciousness",
    "passed out": "loss of consciousness",
    "unconscious": "loss of consciousness",
    "severe bleeding": "severe uncontrolled bleeding",
    "bleeding won't stop": "severe uncontrolled bleeding",
    "bleeding wont stop": "severe uncontrolled bleeding",
    "ongoing seizure": "ongoing or repeated seizure",
    "repeated seizure": "ongoing or repeated seizure",
    "seizure without recovery": "ongoing or repeated seizure",
    "allergic reaction with breathing": "severe allergic reaction",
    "severe allergic reaction": "severe allergic reaction",
    "throat swelling": "severe allergic reaction",
    "swelling of the tongue": "severe allergic reaction",
    "severe sudden confusion": "severe sudden confusion",
    "poisoning": "possible poisoning",
    "serious burn": "serious burn",
    "severe burn": "serious burn",
    "suicidal thoughts": "immediate mental-health safety concern",
    "want to kill myself": "immediate mental-health safety concern",
    "self harm": "immediate mental-health safety concern",
}

URGENT_SIGNALS = (
    "moderate difficulty breathing",
    "persistent vomiting",
    "signs of dehydration",
    "severe headache",
    "high fever",
    "rapidly worsening",
    "worsening quickly",
    "blood in vomit",
    "blood in stool",
)

MILD_SYMPTOMS = (
    "mild cold",
    "runny nose",
    "sore throat",
    "mild cough",
    "mild headache",
    "mild fever",
    "body ache",
    "body pain",
    "sneezing",
)


def assess_symptom_triage(
    *,
    symptoms: str,
    age_band: str = "",
    duration: str = "",
    severity: str = "",
    red_flag_symptoms: str = "",
    known_conditions: str = "",
) -> dict[str, Any]:
    """Return a safe care-urgency classification without suggesting a diagnosis."""
    _validate_text_inputs(
        symptoms, age_band, duration, severity, red_flag_symptoms, known_conditions
    )
    combined = " ".join(
        (symptoms, age_band, duration, severity, red_flag_symptoms, known_conditions)
    ).lower()
    flags = _matched_emergency_flags(combined)
    if flags:
        return _result(
            "EMERGENCY",
            "The information provided includes an emergency warning sign: "
            f"{', '.join(flags)}.",
            "Call your local emergency medical services now or go to the nearest "
            "emergency department. Do not rely on an AI assistant during an emergency.",
            flags,
        )

    if not symptoms.strip():
        return _result(
            "UNKNOWN",
            "There is not enough symptom information to safely classify urgency.",
            "Please describe the main symptom, how long it has been happening, and "
            "whether it is mild, moderate, or severe. Seek emergency care now if an "
            "emergency warning sign develops.",
        )

    if any(signal in combined for signal in URGENT_SIGNALS) or severity.lower() in {
        "moderate",
        "severe",
    }:
        return _result(
            "URGENT",
            "The reported severity or symptoms should be assessed promptly by a "
            "healthcare professional.",
            "Arrange prompt medical evaluation today. Seek emergency care immediately "
            "if severe breathing difficulty, severe chest pain, fainting, severe "
            "bleeding, or another emergency warning sign occurs.",
        )

    if severity.lower() == "mild" or any(
        symptom in combined for symptom in MILD_SYMPTOMS
    ):
        return _result(
            "SELF_CARE",
            "The limited information sounds consistent with a mild, common symptom, "
            "without an identified emergency warning sign.",
            "Basic self-care and monitoring may be reasonable. Contact a healthcare "
            "professional if it persists, worsens, or you are concerned; seek emergency "
            "care if warning signs develop.",
        )

    return _result(
        "ROUTINE",
        "The symptoms do not match this ruleset's immediate emergency warnings, but "
        "the limited information is not enough to recommend self-care alone.",
        "Discuss these symptoms with a healthcare professional. Seek care sooner if "
        "they worsen or an emergency warning sign develops.",
    )


def failure_result() -> dict[str, Any]:
    """Return the safe, structured fallback used when the local ruleset cannot run."""
    return {
        "success": False,
        "triage_level": "UNKNOWN",
        "reason": "The triage check could not be completed safely.",
        "recommended_action": (
            "I could not complete the triage check and do not want to guess. If symptoms "
            "are severe, rapidly worsening, or include difficulty breathing, chest pain, "
            "fainting, severe bleeding, or another emergency warning sign, seek emergency "
            "medical care now. Otherwise, speak with a healthcare professional."
        ),
        "red_flags": [],
        "source": LOCAL_RULESET_SOURCE,
        "data_timestamp": _timestamp(),
        "data_mode": "LOCAL_RULESET",
        "disclaimer": DISCLAIMER,
    }


def _result(
    triage_level: str,
    reason: str,
    recommended_action: str,
    red_flags: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "success": True,
        "triage_level": triage_level,
        "reason": reason,
        "recommended_action": recommended_action,
        "red_flags": red_flags or [],
        "source": LOCAL_RULESET_SOURCE,
        "data_timestamp": _timestamp(),
        "data_mode": "LOCAL_RULESET",
        "disclaimer": DISCLAIMER,
    }


def _matched_emergency_flags(text: str) -> list[str]:
    return list(
        dict.fromkeys(
            label for phrase, label in EMERGENCY_FLAGS.items() if phrase in text
        )
    )


def _validate_text_inputs(*values: str) -> None:
    if any(not isinstance(value, str) or len(value) > 2_000 for value in values):
        raise ValueError("Triage inputs must be text no longer than 2,000 characters.")


def _timestamp() -> str:
    return datetime.now(UTC).isoformat()


SAMPLE_FACILITIES: list[dict[str, Any]] = [
    {
        "name": "Jabalpur Central Primary Health Centre (PHC)",
        "type": "PHC",
        "location": "Jabalpur",
        "address": "Civil Lines, Near Clock Tower, Jabalpur, MP",
        "services": [
            "General Outpatient Consultation",
            "Immunization",
            "Basic Diagnostics",
            "Maternal Care",
        ],
        "timing": "8:00 AM - 2:00 PM & 4:00 PM - 6:00 PM (Mon-Sat)",
        "contact_guidance": (
            "Registration token is available at OPD desk on arrival. Bring government ID."
        ),
    },
    {
        "name": "Jabalpur Community Health Centre (CHC)",
        "type": "CHC / Hospital",
        "location": "Jabalpur",
        "address": "Wright Town, Near Stadium, Jabalpur, MP",
        "services": [
            "24/7 Emergency Triage",
            "Pediatrics",
            "General Medicine",
            "Inpatient Beds",
        ],
        "timing": "24/7 OPD & Emergency Services",
        "contact_guidance": (
            "For general OPD, visit between 9 AM and 1 PM. Emergency desk operates 24/7."
        ),
    },
    {
        "name": "National Health Mission Primary Health Centre",
        "type": "PHC",
        "location": "Delhi / General",
        "address": "Block B, Community Complex, New Delhi",
        "services": [
            "General OPD",
            "Essential Medicines",
            "Preventive Care",
            "Lab Tests",
        ],
        "timing": "8:30 AM - 4:00 PM (Mon-Sat)",
        "contact_guidance": (
            "OPD registration opens at 8:30 AM. No pre-booking required."
        ),
    },
    {
        "name": "District Civil Hospital",
        "type": "Hospital",
        "location": "General",
        "address": "Main Station Road, District Centre",
        "services": [
            "Specialist OPD",
            "Emergency Care",
            "Diagnostic Imaging",
            "Pharmacy",
        ],
        "timing": "OPD: 9:00 AM - 3:00 PM, Emergency: 24/7",
        "contact_guidance": (
            "Outpatient consultations require morning registration. Emergency admissions operate around the clock."
        ),
    },
]


def lookup_healthcare_facility(
    facility_type: str = "",
    location: str = "",
) -> dict[str, Any]:
    """Look up verified healthcare facilities, PHCs, or hospitals based on type and location."""
    try:
        query_type = (facility_type or "").strip().lower()
        query_loc = (location or "").strip().lower()

        matches = []
        for fac in SAMPLE_FACILITIES:
            type_match = (
                not query_type
                or query_type in fac["type"].lower()
                or query_type in fac["name"].lower()
                or (
                    query_type in ["phc", "clinic"]
                    and fac["type"].lower() in ["phc", "clinic"]
                )
            )
            loc_match = (
                not query_loc
                or query_loc in fac["location"].lower()
                or query_loc in fac["address"].lower()
                or fac["location"].lower() == "general"
            )
            if type_match and loc_match:
                matches.append(fac)

        if not matches:
            matches = [
                fac
                for fac in SAMPLE_FACILITIES
                if fac["location"].lower() in ["general", "jabalpur"]
            ]

        return {
            "success": True,
            "found": bool(matches),
            "facility_type": facility_type or "General Healthcare Facility",
            "requested_location": location or "Local Area",
            "count": len(matches),
            "facilities": matches[:2],
            "guidance": (
                "Primary Health Centres (PHCs) and Community Health Centres (CHCs) offer "
                "walk-in outpatient care. Morning registration is recommended."
            ),
        }
    except Exception:
        return {
            "success": False,
            "found": False,
            "message": (
                "I couldn't retrieve the facility information right now, so I don't want "
                "to guess and give you incorrect details."
            ),
        }

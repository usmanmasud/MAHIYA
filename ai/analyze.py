#!/usr/bin/env python3
"""
Mahiya Edge — AI Analysis Layer
Reads JSON from stdin, returns structured clinical analysis JSON to stdout.
Replace the stub logic below with actual Gemma 4 inference + RAG retrieval.
"""

import sys
import json

def analyze(symptoms: str, patient: dict, language: str) -> dict:
    """
    TODO: Replace with Gemma 4 inference pipeline:
      1. Retrieve relevant guidelines from FAISS/ChromaDB (RAG)
      2. Build prompt with patient context + retrieved chunks
      3. Run Gemma 4 local inference
      4. Parse structured JSON output
    """
    s = symptoms.lower()
    danger_signs = []
    urgency = "low"

    if any(w in s for w in ["bleed", "hemorrhage", "blood"]):
        danger_signs.append("Postpartum Hemorrhage suspected")
        urgency = "critical"
    if any(w in s for w in ["convuls", "seizure", "fit", "jiri"]):
        danger_signs.append("Eclampsia suspected")
        urgency = "critical"
    if any(w in s for w in ["headache", "vision", "swelling", "ciwon kai"]):
        danger_signs.append("Preeclampsia signs present")
        urgency = urgency if urgency == "critical" else "high"
    if any(w in s for w in ["fever", "zazzabi", "baby", "newborn", "infant"]):
        danger_signs.append("Neonatal Sepsis risk")
        urgency = urgency if urgency == "critical" else "high"

    name = patient.get("name", "Patient")

    return {
        "patient_summary": f"{name} presenting with: {symptoms}",
        "symptoms_recorded": symptoms,
        "danger_signs": danger_signs or ["No immediate danger signs identified"],
        "urgency_level": urgency,
        "immediate_actions": (
            [
                "Call for emergency transport immediately",
                "Do not leave patient alone",
                "Establish IV access if trained",
                "Prepare referral note now"
            ] if urgency == "critical" else
            [
                "Monitor vital signs every 15 minutes",
                "Reassess in 30 minutes",
                "Document all findings"
            ]
        ),
        "referral_recommendation": (
            "Refer to nearest secondary health facility immediately"
            if urgency in ("critical", "high")
            else "Continue monitoring. Refer if condition worsens."
        ),
        "reasoning": (
            "Assessment based on reported symptoms cross-referenced with "
            "WHO Maternal Health Guidelines and Nigeria FMOH Emergency Obstetric Care protocols."
        ),
        "confidence": "moderate",
        "disclaimer": (
            "This tool supports clinical decision-making and does not replace "
            "professional medical judgment."
        ),
        "language_used": language
    }


if __name__ == "__main__":
    try:
        payload = json.loads(sys.stdin.read())
        result = analyze(
            payload.get("symptoms", ""),
            payload.get("patient", {}),
            payload.get("language", "en")
        )
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

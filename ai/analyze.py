#!/usr/bin/env python3
"""
Mahiya Edge — Gemma 4 AI Analysis Layer
Uses Google Gemini API (gemma-3-27b-it) for real clinical reasoning.
Falls back to keyword-based analysis if API key is missing or call fails.
"""

import sys
import json
import os
import re

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    from rag.retriever import retrieve
except Exception:
    def retrieve(q, top_k=3): return []

try:
    from prompts.clinical_analysis import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
except Exception:
    SYSTEM_PROMPT = ""
    USER_PROMPT_TEMPLATE = ""

# ---------------------------------------------------------------------------
# Gemma model via Gemini API
# ---------------------------------------------------------------------------
GEMMA_MODEL = "gemma-3-27b-it"   # Gemma 3 27B — best available via API
FALLBACK_MODEL = "gemma-3-12b-it" # lighter fallback

# ---------------------------------------------------------------------------
# Keyword fallback (used when API unavailable)
# ---------------------------------------------------------------------------
DANGER_KEYWORDS = {
    "hemorrhage": {
        "en": ["bleed", "hemorrhage", "blood", "heavy bleeding", "postpartum"],
        "ha": ["jini", "zubar jini", "jini mai yawa"],
        "sign": "Postpartum Hemorrhage (PPH) suspected",
        "urgency": "critical",
    },
    "eclampsia": {
        "en": ["convuls", "seizure", "fit", "eclampsia"],
        "ha": ["jiri", "farfadiya", "girgiza"],
        "sign": "Eclampsia suspected",
        "urgency": "critical",
    },
    "preeclampsia": {
        "en": ["headache", "vision", "swelling", "blurred", "preeclampsia", "hypertension", "bp"],
        "ha": ["ciwon kai", "kumburi", "gani", "hawan jini"],
        "sign": "Preeclampsia signs present",
        "urgency": "high",
    },
    "neonatal_sepsis": {
        "en": ["fever", "baby", "newborn", "infant", "neonatal", "sepsis", "not feeding", "lethargic"],
        "ha": ["zazzabi", "jariiri", "yaro", "rashin ci", "rashin motsi"],
        "sign": "Neonatal Sepsis risk",
        "urgency": "high",
    },
    "obstructed_labour": {
        "en": ["obstructed", "prolonged labour", "not delivering", "stuck"],
        "ha": ["haihuwa mai tsawo", "wahalar haihuwa"],
        "sign": "Obstructed / Prolonged Labour suspected",
        "urgency": "critical",
    },
}

FALLBACK_ACTIONS = {
    "critical": [
        "Call for emergency transport immediately",
        "Do not leave the patient alone",
        "Establish IV access if trained",
        "Prepare referral note now",
        "Notify receiving facility by phone if possible",
    ],
    "high": [
        "Monitor vital signs every 15 minutes",
        "Prepare for possible referral",
        "Document all findings carefully",
        "Reassess in 30 minutes",
    ],
    "moderate": ["Monitor vital signs every 30 minutes", "Reassess in 1 hour", "Document all findings"],
    "low": ["Continue routine monitoring", "Document findings", "Reassess at next visit"],
}


def _keyword_fallback(symptoms: str, patient: dict, language: str, guidelines: list) -> dict:
    s = symptoms.lower()
    danger_signs, urgency = [], "low"

    for data in DANGER_KEYWORDS.values():
        if any(kw in s for kw in data["en"] + data["ha"]):
            danger_signs.append(data["sign"])
            if data["urgency"] == "critical":
                urgency = "critical"
            elif data["urgency"] == "high" and urgency != "critical":
                urgency = "high"

    name = patient.get("name", "Patient")
    age = patient.get("age", "")
    is_ha = language == "ha"

    return {
        "patient_summary": f"{name}{f', Age {age}' if age else ''} presenting with: {symptoms}",
        "symptoms_recorded": symptoms,
        "danger_signs": danger_signs or (["Ba a gano alamomin haɗari"] if is_ha else ["No immediate danger signs identified"]),
        "urgency_level": urgency,
        "immediate_actions": FALLBACK_ACTIONS.get(urgency, FALLBACK_ACTIONS["low"]),
        "referral_recommendation": (
            "Kai majiyyaci zuwa asibiti nan take." if is_ha and urgency in ("critical", "high")
            else "Refer to nearest secondary health facility immediately." if urgency in ("critical", "high")
            else "Continue monitoring. Refer if condition worsens."
        ),
        "reasoning": (
            "Keyword-based assessment (Gemma offline). Cross-referenced with WHO Maternal Health Guidelines."
            + (f" {len(guidelines)} guideline section(s) retrieved." if guidelines else "")
        ),
        "confidence": "low",
        "gemma_powered": False,
        "disclaimer": (
            "Wannan kayan aiki yana tallafawa yanke shawara na asibiti kuma baya maye gurbin hukuncin likita."
            if is_ha else
            "This tool supports clinical decision-making and does not replace professional medical judgment."
        ),
        "language_used": language,
    }


# ---------------------------------------------------------------------------
# Gemma 4 inference via Gemini API
# ---------------------------------------------------------------------------
def _build_prompt(symptoms: str, patient: dict, language: str, guidelines: list) -> str:
    name = patient.get("name", "Patient")
    age = patient.get("age", "unknown")
    gravida = patient.get("gravida", "?")
    para = patient.get("para", "?")
    lmp = patient.get("lmp", "unknown")
    village = patient.get("village", "unknown")
    lang_label = "Hausa (ha)" if language == "ha" else "English (en)"
    guidelines_text = "\n".join(f"- {g}" for g in guidelines) if guidelines else "No guidelines retrieved (RAG index not built)."

    return f"""Patient: {name}, Age {age}, G{gravida}P{para}, LMP: {lmp}, Village: {village}

Reported symptoms ({lang_label}):
{symptoms}

Retrieved clinical guidelines:
{guidelines_text}

Analyse the above and return ONLY a valid JSON object. No prose outside the JSON.
Language for output fields: {lang_label}

Required JSON schema:
{{
  "patient_summary": "string",
  "symptoms_recorded": "string",
  "danger_signs": ["string"],
  "urgency_level": "critical|high|moderate|low",
  "immediate_actions": ["string"],
  "referral_recommendation": "string",
  "reasoning": "string",
  "confidence": "high|moderate|low",
  "disclaimer": "string",
  "language_used": "{language}"
}}"""


def _call_gemma(prompt: str, api_key: str) -> dict:
    import google.generativeai as genai

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel(
        model_name=GEMMA_MODEL,
        system_instruction=SYSTEM_PROMPT or (
            "You are a clinical decision support assistant for frontline healthcare workers in rural Nigeria. "
            "You assist CHEWs, nurses, and midwives. You do NOT diagnose or prescribe. "
            "Identify possible maternal and neonatal danger signs. "
            "Always output ONLY valid JSON. Never add prose outside the JSON object."
        ),
        generation_config=genai.GenerationConfig(
            temperature=0.2,       # low temp = consistent, factual output
            max_output_tokens=1024,
            response_mime_type="application/json",
        ),
    )

    response = model.generate_content(prompt)
    raw = response.text.strip()

    # Strip markdown code fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    result = json.loads(raw)
    result["gemma_powered"] = True
    result["gemma_model"] = GEMMA_MODEL
    return result


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------
def analyze(symptoms: str, patient: dict, language: str) -> dict:
    guidelines = retrieve(symptoms)
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    if not api_key or api_key == "your_api_key_here":
        return _keyword_fallback(symptoms, patient, language, guidelines)

    try:
        prompt = _build_prompt(symptoms, patient, language, guidelines)
        result = _call_gemma(prompt, api_key)

        # Ensure required fields exist (defensive)
        result.setdefault("symptoms_recorded", symptoms)
        result.setdefault("language_used", language)
        result.setdefault("disclaimer",
            "This tool supports clinical decision-making and does not replace professional medical judgment.")
        return result

    except Exception as e:
        # Gemma call failed — fall back gracefully, log the error
        fallback = _keyword_fallback(symptoms, patient, language, guidelines)
        fallback["gemma_error"] = str(e)
        return fallback


if __name__ == "__main__":
    try:
        payload = json.loads(sys.stdin.read())
        result = analyze(
            payload.get("symptoms", ""),
            payload.get("patient", {}),
            payload.get("language", "en"),
        )
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

#!/usr/bin/env python3
"""
Mahiya Edge — Offline Speech-to-Text via faster-whisper
Supports English and Hausa (ha).

Install: pip install faster-whisper
Model is downloaded once and cached locally (~150 MB for 'small').
"""

import sys
import json
import os


def transcribe(audio_path: str, language: str = "en") -> dict:
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return {
            "text": "",
            "language": language,
            "error": "faster-whisper not installed. Run: pip install faster-whisper",
            "success": False,
        }

    # Use 'small' model — good balance of speed/accuracy, ~150 MB
    model_size = os.environ.get("WHISPER_MODEL", "small")
    # Run on CPU (offline devices won't have GPU)
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    # language=None lets Whisper auto-detect; passing 'ha' forces Hausa
    whisper_lang = language if language in ("en", "ha") else None

    segments, info = model.transcribe(
        audio_path,
        language=whisper_lang,
        beam_size=5,
        vad_filter=True,  # skip silence
    )

    text = " ".join(seg.text.strip() for seg in segments).strip()

    return {
        "text": text,
        "language": info.language,
        "language_probability": round(info.language_probability, 2),
        "success": True,
    }


if __name__ == "__main__":
    try:
        payload = json.loads(sys.stdin.read())
        result = transcribe(
            payload["audio_path"],
            payload.get("language", "en"),
        )
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e), "success": False}))
        sys.exit(1)

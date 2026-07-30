# Mahiya Edge — Setup Guide

## 1. Local Gemma Inference (True Offline)

Install [Ollama](https://ollama.com), then:

```bash
ollama pull gemma3
ollama serve   # starts on http://localhost:11434
```

The backend auto-detects Ollama. No config needed. The `/api/ai/status` endpoint
will return `ollama_live: true` and the UI badge turns green.

**Priority order:** Ollama (local) → Gemini API → Keyword fallback

---

## 2. Voice Transcription (Offline STT)

```bash
pip install faster-whisper
```

The `small` Whisper model (~150 MB) downloads automatically on first use and is
cached locally. Supports English and Hausa.

To use a larger/smaller model, set in `backend/.env`:
```
WHISPER_MODEL=base    # tiny | base | small | medium
```

---

## 3. Encrypted Database

Already active. The SQLite file is encrypted with AES-256-CBC on every save.

Set a strong key in `backend/.env`:
```
DB_ENCRYPTION_KEY=your_32_char_secret_key_here
```

If not set, a key is derived from the device hostname (still encrypted, but
not portable across machines).

---

## 4. RAG Index (Clinical Guidelines)

```bash
pip install faiss-cpu sentence-transformers
python rag/build_index.py
```

This indexes `guidelines/maternal_neonatal_who.txt` into a FAISS vector store.
Add more `.txt` files to `/guidelines/` and re-run to expand coverage.

---

## 5. Image Input

No setup needed. Use the camera button in the New Case form to attach a clinical
image (wound, rash, swelling, etc.). The image URL is passed to the AI as
context in the prompt.

---

## Full Python Requirements

```bash
pip install google-generativeai faster-whisper faiss-cpu sentence-transformers
```

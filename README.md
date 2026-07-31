# SafeBirth Edge

**Offline Clinical AI for Maternal & Neonatal Care in Northern Nigeria**

> A Gemma 4-powered, offline-first clinical decision support platform built for CHEWs, nurses, and midwives in rural Northern Nigeria — in Hausa and English.

Built for the **GDGoC BUK Build with Gemma 4 Hackathon** · Bayero University Kano

---

## The Problem

Northern Nigeria has one of the highest maternal mortality rates in the world. A woman in Northwest Nigeria faces a **1-in-22 lifetime risk** of dying from pregnancy-related causes — compared to 1-in-5,900 in high-income countries.

The gap is not a lack of care workers. It is a lack of **decision support at the point of care** — in the right language, without internet, in the hands of the frontline worker who is actually there.

SafeBirth Edge was built to close that gap.

---

## What It Does

- Recognizes maternal and neonatal danger signs from reported symptoms
- Assigns urgency level (critical / high / moderate / low)
- Generates structured, actionable immediate care steps
- Produces a complete referral note ready to hand to the receiving facility
- Accepts voice input in **Hausa or English** (offline Whisper STT)
- Works with **zero internet** — all AI, storage, and logic runs locally

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express 5 |
| Database | SQLite via sql.js — AES-256-CBC encrypted |
| AI | Gemma 4 via Ollama (local) or Gemini API |
| RAG | FAISS + sentence-transformers + WHO guidelines |
| STT | faster-whisper (offline, Hausa + English) |

---

## AI Architecture

```
Symptoms + Vitals + Voice/Image
  → Express API (Node.js :3001)
  → Persistent Python Worker (ai/worker.py)
      → RAG Retriever
          → sentence-transformers embed query
          → FAISS search WHO guideline chunks
          → top-3 chunks injected into prompt
      → Gemma 4 Inference
          → Ollama local (offline-first)
          → Gemini API (online fallback)
          → Keyword fallback (always available)
  → Structured JSON response
  → Saved to encrypted SQLite
  → Referral note generated
```

### Inference Priority

| Priority | Mode | Connectivity |
|---|---|---|
| 1 | Ollama local (Gemma 4) | Fully offline |
| 2 | Gemini API (Gemma 4) | Online |
| 3 | Keyword fallback | Always |

---

## Project Structure

```
SafeBirth/
├── frontend/           # React UI (Vite + Tailwind)
│   └── src/
│       ├── components/ # Layout, UI primitives
│       ├── pages/      # Dashboard, Cases, Patients, NewCase...
│       └── lib/        # API client
├── backend/            # Express API
│   ├── routes/         # ai, cases, patients, referrals, analytics, audit
│   ├── server.js       # Entry point
│   └── db.js           # Encrypted SQLite
├── ai/
│   ├── analyze.py      # Gemma 4 inference (Ollama + Gemini API)
│   ├── worker.py       # Persistent Python worker (keeps model in memory)
│   └── transcribe.py   # Whisper offline STT
├── rag/
│   ├── retriever.py    # FAISS retrieval
│   ├── build_index.py  # Index builder
│   ├── index.faiss     # Pre-built vector index
│   └── chunks.json     # Guideline text chunks
├── guidelines/         # WHO + FMOH clinical reference documents
├── prompts/            # Prompt templates
├── storage/            # Uploaded voice notes + images
└── database/           # SQLite file (auto-created, encrypted)
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- (Optional) [Ollama](https://ollama.com) for fully offline AI

### 1. Clone & configure

```bash
git clone https://github.com/YOUR_USERNAME/safebirth-edge.git
cd safebirth-edge

cp backend/.env.example backend/.env
# Edit backend/.env — set GEMINI_API_KEY if using Gemini API
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
# API running on http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# UI running on http://localhost:5173
```

### 4. Python AI layer

```bash
pip install google-generativeai faster-whisper faiss-cpu sentence-transformers
```

### 5. (Optional) Local Gemma 4 via Ollama

```bash
# Install Ollama from https://ollama.com
ollama pull gemma3n
ollama serve
# Backend auto-detects Ollama — no config needed
```

### 6. Login

Open `http://localhost:5173` — default PIN is `1234`

---

## Environment Variables

```env
PORT=3001
CLINIC_PIN=1234
GEMINI_API_KEY=your_key_here        # Get free key at aistudio.google.com
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3n
WHISPER_MODEL=tiny                  # tiny | base | small | medium
DB_ENCRYPTION_KEY=your_32_char_key
```

---

## Key Features

| Feature | Details |
|---|---|
| Danger sign checklist | 10 maternal/neonatal signs, Hausa + English |
| Vital signs capture | BP, temp, pulse, SpO2, respiratory rate |
| AI analysis | Gemma 4 structured JSON output |
| RAG grounding | WHO Maternal Health + FMOH EmOC guidelines |
| Referral generation | Printable structured referral note |
| Voice input | Offline Whisper STT, Hausa + English |
| Image attachment | Clinical photo attached to case |
| Encrypted storage | AES-256-CBC SQLite, key never leaves device |
| Audit log | Full action trail per case |
| Analytics | Cases by day, urgency breakdown, totals |
| Offline-first | All core features work without internet |
| PWA | Installable, service worker cached |
| Responsive | Mobile + desktop |

---

## Clinical Safety

SafeBirth Edge **supports** clinical decision-making. It does not diagnose, prescribe, or replace professional medical judgment.

Every AI output includes an explicit safety disclaimer. The platform is designed to assist trained healthcare workers — not replace them.

---

## Tracks

This project was submitted to the GDGoC BUK Build with Gemma 4 Hackathon under:

- **GenAI for Good** — Healthcare, high-impact, rural Northern Nigeria
- **Local Language** — Full Hausa UI + bilingual AI output + Hausa voice transcription
- **Edge / On-Device** — Offline-first, local Gemma 4 via Ollama, on-device Whisper, encrypted local SQLite

---

## License

MIT

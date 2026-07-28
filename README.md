# Mahiya Edge

**Offline Clinical Intelligence Platform for Frontline Healthcare Workers**

> Assists CHEWs, nurses, and midwives in rural Northern Nigeria to recognize maternal and neonatal danger signs, generate structured referrals, and communicate in Hausa and English — completely offline.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | SQLite (via sql.js) |
| AI | Gemma 4 (local inference via Python) |
| RAG | FAISS + clinical guidelines |

---

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
# API running on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# UI running on http://localhost:5173
```

---

## Project Structure

```
MAHIYA/
├── frontend/        # React UI
├── backend/         # Express API + SQLite
├── ai/              # Python Gemma inference layer
├── rag/             # RAG pipeline (FAISS + guidelines)
├── database/        # SQLite file (auto-created)
├── prompts/         # Prompt templates
├── guidelines/      # Clinical reference documents
└── docs/            # Architecture, ERD, API docs
```

---

## AI Workflow

```
Symptoms (text/voice)
  → Express API
  → Python subprocess (ai/analyze.py)
  → [RAG: retrieve relevant guidelines]
  → Gemma 4 inference
  → Structured JSON output
  → Saved to case
  → Referral generated
```

---

## Safety

This platform **supports** clinical decision-making. It does not diagnose, prescribe, or replace professional medical judgment.

All outputs include an explicit safety disclaimer.

---

## Offline First

- All data stored locally in SQLite
- AI inference runs locally via Gemma 4
- No internet required for core functionality

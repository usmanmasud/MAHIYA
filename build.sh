#!/usr/bin/env bash
set -e

echo "==> Installing Python dependencies..."
pip install google-generativeai faster-whisper faiss-cpu sentence-transformers

echo "==> Installing backend Node dependencies..."
cd backend && npm install && cd ..

echo "==> Installing frontend Node dependencies and building..."
cd frontend && npm install && npm run build && cd ..

echo "==> Building RAG index..."
python3 rag/build_index.py

echo "==> Build complete."

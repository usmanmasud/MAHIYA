#!/usr/bin/env bash
set -e

cd backend
npm install

pip install google-generativeai faster-whisper faiss-cpu sentence-transformers

# Build RAG index if not already built
if [ ! -f "../rag/index.faiss" ]; then
  echo "Building RAG index..."
  cd .. && python rag/build_index.py
fi

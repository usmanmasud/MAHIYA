#!/usr/bin/env python3
"""
Mahiya Edge — Build RAG Index
Run once after adding guideline .txt files to /guidelines/

Usage:
    python rag/build_index.py

Requires:
    pip install faiss-cpu sentence-transformers
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from rag.retriever import build_index

if __name__ == '__main__':
    build_index()

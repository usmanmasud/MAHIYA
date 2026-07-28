"""
Mahiya Edge — RAG Pipeline
Retrieves relevant clinical guideline chunks for a given symptom query.

To activate:
1. pip install faiss-cpu sentence-transformers
2. Place guideline PDFs/text files in /guidelines/
3. Run: python rag/build_index.py  (builds FAISS index)
4. Import retrieve() in ai/analyze.py
"""

import os
import json

GUIDELINES_DIR = os.path.join(os.path.dirname(__file__), '..', 'guidelines')
INDEX_PATH = os.path.join(os.path.dirname(__file__), 'index.faiss')
CHUNKS_PATH = os.path.join(os.path.dirname(__file__), 'chunks.json')


def retrieve(query: str, top_k: int = 3) -> list[str]:
    """
    Returns top_k relevant guideline chunks for the given query.
    Falls back to empty list if index not built yet.
    """
    if not os.path.exists(INDEX_PATH) or not os.path.exists(CHUNKS_PATH):
        return []

    try:
        import faiss
        import numpy as np
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer('all-MiniLM-L6-v2')
        index = faiss.read_index(INDEX_PATH)
        with open(CHUNKS_PATH) as f:
            chunks = json.load(f)

        embedding = model.encode([query]).astype('float32')
        _, indices = index.search(embedding, top_k)
        return [chunks[i] for i in indices[0] if i < len(chunks)]
    except Exception:
        return []


def build_index():
    """
    Builds FAISS index from text files in /guidelines/.
    Run once after adding guideline documents.
    """
    import faiss
    import numpy as np
    from sentence_transformers import SentenceTransformer

    chunks = []
    for fname in os.listdir(GUIDELINES_DIR):
        fpath = os.path.join(GUIDELINES_DIR, fname)
        if not fname.endswith('.txt'):
            continue
        with open(fpath, encoding='utf-8') as f:
            text = f.read()
        # Split into ~500 char chunks
        for i in range(0, len(text), 500):
            chunk = text[i:i+500].strip()
            if chunk:
                chunks.append(chunk)

    if not chunks:
        print('No .txt guideline files found in /guidelines/')
        return

    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode(chunks).astype('float32')
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)

    faiss.write_index(index, INDEX_PATH)
    with open(CHUNKS_PATH, 'w') as f:
        json.dump(chunks, f)

    print(f'Index built: {len(chunks)} chunks from {GUIDELINES_DIR}')


if __name__ == '__main__':
    build_index()

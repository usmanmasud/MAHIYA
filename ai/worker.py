#!/usr/bin/env python3
"""
Persistent worker — reads one JSON line from stdin, writes one JSON line to stdout.
Keeps the sentence-transformer model loaded between requests.
"""
import sys
import json
from analyze import analyze

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        payload = json.loads(line)
        result = analyze(
            payload.get('symptoms', ''),
            payload.get('patient', {}),
            payload.get('language', 'en'),
            payload.get('image_description', ''),
        )
        sys.stdout.write(json.dumps(result, ensure_ascii=False) + '\n')
    except Exception as e:
        sys.stdout.write(json.dumps({'error': str(e)}) + '\n')
    sys.stdout.flush()

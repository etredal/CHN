import os
import re
import json
import subprocess
import time

def parse_vtt_timestamps(vtt_path):
    """Parse VTT subtitle file to get [(start_sec, end_sec, text)]"""
    if not os.path.exists(vtt_path):
        return []
    with open(vtt_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match: 00:00:01.234 --> 00:00:04.567 or 00:00:01,234 --> 00:00:04,567
    pattern = r'(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})\s*\n([^\n]+)'
    matches = re.findall(pattern, content)
    results = []
    for m in matches:
        start_sec = int(m[0])*3600 + int(m[1])*60 + int(m[2]) + int(m[3])/1000.0
        end_sec = int(m[4])*3600 + int(m[5])*60 + int(m[6]) + int(m[7])/1000.0
        text = m[8].strip()
        results.append((start_sec, end_sec, text))
    return results

print("Audio builder initialized...")

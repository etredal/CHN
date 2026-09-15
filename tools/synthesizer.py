import os
import re
import json
import subprocess
import time

def parse_vtt(vtt_path):
    if not os.path.exists(vtt_path):
        return []
    with open(vtt_path, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r'(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})\s*\n([^\n]+)'
    matches = re.findall(pattern, content)
    results = []
    for m in matches:
        start_sec = int(m[0])*3600 + int(m[1])*60 + int(m[2]) + int(m[3])/1000.0
        end_sec = int(m[4])*3600 + int(m[5])*60 + int(m[6]) + int(m[7])/1000.0
        text = m[8].strip()
        results.append({"start": start_sec, "end": end_sec, "text": text})
    return results

def synthesize_audio(text, voice, mp3_path, vtt_path):
    os.makedirs(os.path.dirname(mp3_path), exist_ok=True)
    cmd = [
        "python", "-m", "edge_tts",
        "--voice", voice,
        "--text", text,
        "--write-media", mp3_path,
        "--write-subtitles", vtt_path
    ]
    print(f"Synthesizing {mp3_path} with {voice}...")
    subprocess.run(cmd, check=True)
    return parse_vtt(vtt_path)

print("Synthesizer helper ready.")

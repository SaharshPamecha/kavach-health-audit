#!/usr/bin/env python3
"""Second Gemini pass for the walkthrough segments that fell back to edge."""
import base64, json, os, subprocess, time, urllib.request

KEY = os.environ.get("GEMINI_API_KEY_3") or os.environ.get("GEMINI_API_KEY_4") or os.environ.get("GEMINI_API_KEY_2")
MODEL = "gemini-2.5-flash-preview-tts"
VOICE = "Charon"
OUT = "/home/hermes/kavach-health-audit/trailer/vo3"
os.makedirs(OUT, exist_ok=True)

NEEDED = {
    "w3": "The TPA applied a fifty-five percent room-rent ratio to both. Drag the room cap, and the arithmetic moves with it.",
    "w5": "So Kavach writes the letter. English, Hindi, or Kannada. And a second letter to the hospital, because over-billing is a different defendant.",
    "w6": "Then turn the phone around. This is what you hold up at the counter.",
    "w7": "Forty-nine rupees for the clause-linked dossier. Everything before it stays free.",
}


def dur(p):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", p],
        capture_output=True, text=True).stdout.strip() or 0)


def gem(text):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
    body = {"contents": [{"parts": [{"text": text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}}}}
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={"content-type": "application/json"})
    r = json.load(urllib.request.urlopen(req, timeout=120))
    return base64.b64decode(r["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])


ok = 0
for name, text in NEEDED.items():
    out = os.path.join(OUT, name + ".mp3")
    for attempt in range(6):
        try:
            pcm = gem(text)
            raw = os.path.join(OUT, name + ".pcm")
            open(raw, "wb").write(pcm)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000",
                            "-ac", "1", "-i", raw, "-codec:a", "libmp3lame", "-b:a", "160k", out],
                           check=True)
            os.remove(raw)
            print(f"{name}: OK {dur(out):.2f}s")
            ok += 1
            break
        except Exception as e:
            print(f"{name}: try {attempt+1} {str(e)[:50]}")
            time.sleep(15)
    time.sleep(10)

print("SUCCESS", ok, "of", len(NEEDED))

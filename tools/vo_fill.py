#!/usr/bin/env python3
"""Fill in any missing Gemini walkthrough segments; fall back to edge-tts."""
import base64, json, os, shutil, subprocess, time, urllib.request

KEY = os.environ.get("GEMINI_API_KEY_2") or os.environ.get("GEMINI_API_KEY_3")
MODEL = "gemini-2.5-flash-preview-tts"
VOICE = "Charon"
NEW = "/home/hermes/kavach-health-audit/trailer/vo2"
EDGE = "/home/hermes/kavach-health-audit/trailer/vo"

SEGS = {
    "w2": "Open the case. Here is the bill, line by line. Look at the pharmacy charge, and the surgical stapler.",
    "w3": "The TPA applied a fifty-five percent room-rent ratio to both. Drag the room cap, and the arithmetic moves with it.",
    "w4": "Room, surgeon and operating theatre shrink under the ratio. Pharmacy, implants and diagnostics sit behind a lock. That is the whole argument.",
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


for name, text in SEGS.items():
    out = os.path.join(NEW, name + ".mp3")
    got = False
    for attempt in range(3):
        try:
            pcm = gem(text)
            raw = os.path.join(NEW, name + ".pcm")
            open(raw, "wb").write(pcm)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000",
                            "-ac", "1", "-i", raw, "-codec:a", "libmp3lame", "-b:a", "160k", out],
                           check=True)
            os.remove(raw)
            print(f"{name}: gemini {dur(out):.2f}s")
            got = True
            break
        except Exception as e:
            print(f"{name}: attempt {attempt+1} failed {str(e)[:60]}")
            time.sleep(20)
    if not got:
        src = os.path.join(EDGE, name + ".mp3")
        if os.path.exists(src):
            shutil.copy(src, out)
            print(f"{name}: EDGE fallback {dur(out):.2f}s")
        else:
            raise SystemExit(f"{name}: no audio available")
    time.sleep(12)

# rebuild walk manifest
walk = []
for name in SEGS:
    p = os.path.join(NEW, name + ".mp3")
    walk.append({"name": name, "dur": round(dur(p), 3), "path": p})
w1 = os.path.join(NEW, "w1.mp3")
if os.path.exists(w1):
    walk.insert(0, {"name": "w1", "dur": round(dur(w1), 3), "path": w1})

mf = os.path.join(NEW, "manifest.json")
m = json.load(open(mf)) if os.path.exists(mf) else {}
m["walk"] = walk
m["walkTotal"] = round(sum(x["dur"] for x in walk), 2)
json.dump(m, open(mf, "w"), indent=1)
print("WALK TOTAL", m["walkTotal"])

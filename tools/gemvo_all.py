#!/usr/bin/env python3
"""Generate the final narration with Gemini 2.5 TTS (voice: Charon)."""
import base64, json, os, subprocess, time, urllib.request

KEY = os.environ.get("GEMINI_API_KEY_2") or os.environ.get("GEMINI_API_KEY_3")
MODEL = "gemini-2.5-flash-preview-tts"
VOICE = "Charon"
OUT = "/home/hermes/kavach-health-audit/trailer/vo2"
os.makedirs(OUT, exist_ok=True)

SEGS = [
    # trailer
    ("t1", "Two lakh forty-eight thousand rupees."),
    ("t2", "Thirty-one thousand of it has no clause behind it."),
    ("t3", "Lawful on three lines. Applied to five."),
    ("t4", "So Kavach writes the letter. In three languages."),
    ("t5", "The bill is not the final word."),
    # walkthrough
    ("w1", "This is Kavach. It begins with the bill someone hands you at discharge. Forty lines, and no way to tell which ones are lawful."),
    ("w2", "Open the case. Here is the bill, line by line. Look at the pharmacy charge, and the surgical stapler."),
    ("w3", "The TPA applied a fifty-five percent room-rent ratio to both. Drag the room cap, and the arithmetic moves with it."),
    ("w4", "Room, surgeon and operating theatre shrink under the ratio. Pharmacy, implants and diagnostics sit behind a lock. That is the whole argument."),
    ("w5", "So Kavach writes the letter. English, Hindi, or Kannada. And a second letter to the hospital, because over-billing is a different defendant."),
    ("w6", "Then turn the phone around. This is what you hold up at the counter."),
    ("w7", "Forty-nine rupees for the clause-linked dossier. Everything before it stays free."),
]


def synth(text, tries=5):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
    body = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}},
        },
    }
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                         headers={"content-type": "application/json"})
            r = json.load(urllib.request.urlopen(req, timeout=120))
            d = r["candidates"][0]["content"]["parts"][0]["inlineData"]
            return base64.b64decode(d["data"])
        except Exception as e:
            last = e
            time.sleep(4 * (i + 1))
    raise RuntimeError(f"TTS failed after {tries} tries: {last}")


def dur(p):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", p],
        capture_output=True, text=True).stdout.strip() or 0)


manifest = {"trailer": [], "walk": []}
for name, text in SEGS:
    time.sleep(2)
    pcm = synth(text)
    raw = os.path.join(OUT, name + ".pcm")
    mp3 = os.path.join(OUT, name + ".mp3")
    open(raw, "wb").write(pcm)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", "24000",
                    "-ac", "1", "-i", raw, "-codec:a", "libmp3lame", "-b:a", "160k", mp3],
                   check=True)
    os.remove(raw)
    d = dur(mp3)
    key = "trailer" if name.startswith("t") else "walk"
    manifest[key].append({"name": name, "dur": round(d, 3), "path": mp3})
    print(f"{name}: {d:.2f}s")

manifest["walkTotal"] = round(sum(x["dur"] for x in manifest["walk"]), 2)
manifest["trailerTotal"] = round(sum(x["dur"] for x in manifest["trailer"]), 2)
json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
print("trailer speech:", manifest["trailerTotal"], "walk speech:", manifest["walkTotal"])
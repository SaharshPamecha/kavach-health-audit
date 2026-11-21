#!/usr/bin/env python3
"""Generate narration with edge-tts and report exact durations."""
import asyncio, json, os, subprocess, sys

VOICE = "en-IN-PrabhatNeural"
RATE = "-4%"
PITCH = "-2Hz"
OUT = "/home/hermes/kavach-health-audit/trailer/vo"
os.makedirs(OUT, exist_ok=True)

TRAILER = [
    ("t1", "Two lakh forty-eight thousand rupees. Twenty minutes to check it."),
    ("t2", "Thirty-one thousand of it has no clause behind it."),
    ("t3", "The room-rent ratio is lawful on three lines. It was applied to five."),
    ("t4", "So Kavach writes the letter. English, Hindi, or Kannada."),
    ("t5", "The bill is not the final word."),
]

WALK = [
    ("w1", "This is Kavach. It starts with the bill someone hands you at discharge. Forty lines, and no way to tell which ones are lawful."),
    ("w2", "Open a case. Here is the bill, line by line. Look at the pharmacy charge, and the surgical stapler."),
    ("w3", "The TPA applied a fifty-five percent room-rent ratio to both. Drag the room cap, and the arithmetic moves with it."),
    ("w4", "Room, surgeon and OT charges shrink under the ratio. Pharmacy, implants and diagnostics sit behind a lock. That is the whole argument."),
    ("w5", "So Kavach writes the letter. English, Hindi, or Kannada. And a second letter to the hospital, because over-billing is a different defendant."),
    ("w6", "Then turn the phone around. This is what you hold up at the billing counter."),
    ("w7", "Forty-nine rupees for the clause-linked dossier. Everything before it stays free."),
]


async def gen(name, text):
    import edge_tts
    path = os.path.join(OUT, name + ".mp3")
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await comm.save(path)
    return path


def dur(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True).stdout.strip()
    return float(out) if out else 0.0


async def main():
    result = {}
    for group, items in (("trailer", TRAILER), ("walk", WALK)):
        result[group] = []
        for name, text in items:
            p = await gen(name, text)
            d = dur(p)
            result[group].append({"name": name, "dur": round(d, 3), "path": p})
            print(f"{name}: {d:.2f}s")
    result["walkTotal"] = round(sum(x["dur"] for x in result["walk"]), 2)
    with open(os.path.join(OUT, "manifest.json"), "w") as f:
        json.dump(result, f, indent=1)
    print("walk total:", result["walkTotal"])


asyncio.run(main())

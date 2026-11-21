#!/usr/bin/env python3
"""Assemble one coherent VO set for the walkthrough (all Charon where possible)."""
import json, os, shutil, subprocess

BASE = "/home/hermes/kavach-health-audit/trailer"
OUT = os.path.join(BASE, "vo_final")
os.makedirs(OUT, exist_ok=True)

# preference order: best Gemini set first, then the earlier Gemini set, then edge
SOURCES = [os.path.join(BASE, "vo3"), os.path.join(BASE, "vo2"), os.path.join(BASE, "vo")]


def dur(p):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", p],
        capture_output=True, text=True).stdout.strip() or 0)


walk = []
for i in range(1, 8):
    name = f"w{i}"
    src = next((os.path.join(d, name + ".mp3") for d in SOURCES
                if os.path.exists(os.path.join(d, name + ".mp3"))), None)
    if not src:
        raise SystemExit(f"missing {name}")
    dst = os.path.join(OUT, name + ".mp3")
    shutil.copy(src, dst)
    d = round(dur(dst), 3)
    walk.append({"name": name, "dur": d, "path": dst})
    print(f"{name}: {d:.2f}s  <- {os.path.basename(os.path.dirname(src))}")

total = round(sum(x["dur"] for x in walk), 2)
mf = {"walk": walk, "walkTotal": total}
json.dump(mf, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
print("TOTAL", total)

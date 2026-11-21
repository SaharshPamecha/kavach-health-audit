import base64, json, os, subprocess, sys, urllib.request

KEY = os.environ.get("GEMINI_API_KEY_2") or os.environ.get("GEMINI_API_KEY_3")
MODEL = "gemini-2.5-flash-preview-tts"
VOICE = sys.argv[2] if len(sys.argv) > 2 else "Charon"
TEXT = sys.argv[1]

url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
body = {
    "contents": [{"parts": [{"text": TEXT}]}],
    "generationConfig": {
        "responseModalities": ["AUDIO"],
        "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}},
    },
}
req = urllib.request.Request(url, data=json.dumps(body).encode(),
                             headers={"content-type": "application/json"})
try:
    r = json.load(urllib.request.urlopen(req, timeout=90))
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read()[:300]); sys.exit(1)
except Exception as e:
    print("ERR", str(e)[:200]); sys.exit(1)

parts = r.get("candidates", [{}])[0].get("content", {}).get("parts", [])
if not parts:
    print("NO PARTS", json.dumps(r)[:300]); sys.exit(1)
d = parts[0].get("inlineData", {})
print("mime:", d.get("mimeType"))
pcm = base64.b64decode(d["data"])
open("/tmp/t.pcm", "wb").write(pcm)
subprocess.run(["ffmpeg","-y","-loglevel","error","-f","s16le","-ar","24000","-ac","1",
                "-i","/tmp/t.pcm","/tmp/t.mp3"], check=True)
dur = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of",
                      "default=noprint_wrappers=1:nokey=1","/tmp/t.mp3"],
                     capture_output=True,text=True).stdout.strip()
print("bytes:", len(pcm), "duration:", dur)

# A synthetic "hospital bill" photo so the camera path can be exercised end to end.
from PIL import Image, ImageDraw
import os

W, H = 900, 1200
img = Image.new("RGB", (W, H), "#FBFAF7")
d = ImageDraw.Draw(img)

d.rectangle([40, 40, W - 40, H - 40], outline="#D8D3C6", width=2)
d.text((70, 80), "NANDI RIDGE MULTISPECIALITY", fill="#0F172A")
d.text((70, 110), "ITEMISED BILL  ·  IP NO 4471", fill="#5B6472")
d.line([70, 150, W - 70, 150], fill="#D8D3C6", width=1)

rows = [
    ("Room rent 3 x 9000", "27,000"),
    ("Surgeon fee", "83,000"),
    ("OT charges", "35,000"),
    ("Pharmacy and IV medicines", "42,000"),
    ("Surgical stapler", "28,000"),
    ("Gloves syringes IV sets", "6,500"),
    ("Sutures and dressings", "3,000"),
    ("CBC ultrasound histopath", "14,000"),
    ("Nursing care 3 x 2000", "6,000"),
    ("Admission and registration", "2,000"),
    ("Medical records", "2,000"),
]
y = 190
for label, amt in rows:
    d.text((70, y), label, fill="#0F172A")
    d.text((W - 190, y), amt, fill="#0F172A")
    y += 62

d.line([70, y + 10, W - 70, y + 10], fill="#D8D3C6", width=1)
d.text((70, y + 30), "TOTAL", fill="#0F172A")
d.text((W - 220, y + 30), "2,48,500", fill="#0F172A")

os.makedirs("/home/hermes/kavach-health-audit/.shots", exist_ok=True)
img.save("/home/hermes/kavach-health-audit/.shots/sample-bill.png")
print("wrote sample-bill.png", img.size)

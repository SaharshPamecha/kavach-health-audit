"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { DEMO_CASES } from "@/lib/cases";
import { auditCase } from "@/lib/engine";
import { caseFromScan } from "@/lib/scan";
import type { LineItem } from "@/lib/types";
import { inr } from "@/lib/format";
import { Button, Label, Pill, Rule } from "./ui";
import type { ViewProps } from "./KavachApp";

type ScanState = "idle" | "reading";

export default function HomeView({ onPickCase, onScan, toast }: ViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scan, setScan] = useState<ScanState>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);

  async function handleFile(file: File) {
    setScan("reading");
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    setPreview(dataUrl);

    try {
      const res = await fetch("/api/scan-bill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = (await res.json()) as {
        items: LineItem[];
        source: "gemini" | "openai" | "sample";
        note?: string;
      };
      if (!data.items?.length) throw new Error("no items");
      const next = caseFromScan(data.items, file.name);
      toast(
        data.source === "sample"
          ? "Sample lines loaded — edit any figure"
          : `${data.items.length} line items read`,
      );
      onScan(next);
    } catch {
      toast("Could not read that image — loading sample lines");
      const fallback = await fetch("/api/scan-bill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: null }),
      })
        .then((r) => r.json())
        .catch(() => null);
      if (fallback?.items?.length) {
        onScan(caseFromScan(fallback.items, "sample-bill.jpg"));
      }
    } finally {
      setScan("idle");
    }
  }

  return (
    <div className="px-4 pt-5">
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="h-[6px] w-[6px] bg-vermilion" />
        <Label>Built for the discharge counter</Label>
      </div>

      <h1 className="mt-3 font-serif text-[37px] font-normal leading-[0.98] tracking-[-0.025em] text-ink">
        The bill is not
        <br />
        the final word.
      </h1>

      <p className="mt-3 max-w-[42ch] text-[13.5px] leading-[1.55] text-ink-2">
        Photograph the itemised bill. In about ninety seconds you will know
        which rupees were taken without a clause behind them — and have a letter
        that quotes the clause back.
      </p>

      {/* ── Scanner ──────────────────────────────────────────────── */}
      <div className="mt-6">
        <label
          htmlFor="bill-capture"
          className="group relative block cursor-pointer border border-dashed border-rule-strong bg-paper transition-colors hover:border-emerald"
        >
          <input
            ref={inputRef}
            id="bill-capture"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <div className="flex items-stretch">
            <div className="flex w-[62px] shrink-0 items-center justify-center border-r border-rule bg-emerald-50">
              {scan === "reading" ? (
                <Loader2 className="h-6 w-6 animate-spin text-emerald" />
              ) : (
                <Camera className="h-6 w-6 text-emerald" strokeWidth={1.7} />
              )}
            </div>
            <div className="flex min-h-[86px] flex-1 items-center justify-between gap-3 px-4 py-4">
              <div>
                <div className="font-serif text-[19px] leading-tight text-ink">
                  {scan === "reading" ? "Reading line items…" : "Photograph the bill"}
                </div>
                <div className="mt-1 text-[11.5px] leading-snug text-ink-2">
                  {scan === "reading"
                    ? "Extracting quantity, rate and amount per line."
                    : "Camera, or a photo already on this phone."}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
          {preview && (
            <div className="border-t border-rule p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Captured bill preview"
                className="h-28 w-full object-cover"
              />
            </div>
          )}
        </label>
        <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-ink-3">
          <ShieldCheck className="h-3 w-3" strokeWidth={2} />
          Runs on-device until you tap. No account, no OTP.
        </p>
      </div>

      {/* ── Narrated tour ────────────────────────────────────────── */}
      <button
        onClick={() => setVideo("/kavach-walkthrough.mp4")}
        className="mt-4 flex w-full items-center gap-3 border border-rule bg-paper px-3 py-2.5 text-left transition-colors hover:border-emerald/40"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-emerald/30 bg-emerald-50">
          <Play className="h-3.5 w-3.5 fill-emerald text-emerald" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-medium text-ink">
            Watch the 70-second tour
          </span>
          <span className="block text-[10.5px] text-ink-2">
            Narrated walkthrough of a ₹2,48,500 bill
          </span>
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-3" />
      </button>

      <Rule />

      {/* ── Demo cases ───────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[10px] tnum text-ink-2">01</span>
          <h2 className="font-serif text-[19px] leading-none text-ink">
            Or open a recorded case
          </h2>
        </div>
        <Label className="text-[9px]">3 cases</Label>
      </div>

      <div className="mt-3 space-y-2.5">
        {DEMO_CASES.map((cc, i) => {
          const a = auditCase(cc, {
            roomCapPerDay:
              cc.capType === "icu" ? cc.policy.icuCapPerDay : cc.policy.roomCapPerDay,
            coPayPct: cc.policy.coPayPct,
            consumablesCover: false,
          });
          const flagged = a.flags.reduce((s, f) => s + f.amount, 0);
          return (
            <button
              key={cc.id}
              onClick={() => onPickCase(cc.id)}
              className="group flex w-full items-stretch border border-rule bg-paper text-left transition-colors hover:border-emerald/40 active:bg-ivory"
            >
              <span className="w-[3px] shrink-0 bg-emerald/85" />
              <span className="flex-1 px-3.5 py-3">
                <span className="flex items-center justify-between">
                  <span className="text-[9.5px] font-medium uppercase tracking-[0.13em] text-ink-3">
                    {cc.city} · {String(i + 1).padStart(2, "0")}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <span className="mt-1 block font-serif text-[17.5px] leading-tight text-ink">
                  {cc.hospital}
                </span>
                <span className="mt-[3px] block text-[11.5px] leading-snug text-ink-2">
                  {cc.procedure}
                </span>
                <span className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="font-mono text-[15px] tnum text-ink">
                    {inr(cc.billedTotal)}
                  </span>
                  <Pill tone="vermilion">{inr(flagged)} flagged</Pill>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2.5 text-[10.5px] leading-relaxed text-ink-3">
        Illustrative composites. Hospital, TPA and insurer names are fictional;
        the bill arithmetic and the rule violations are exact.
      </p>

      <Rule />

      {/* ── How it works ─────────────────────────────────────────── */}
      <div className="pb-8">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[10px] tnum text-ink-2">02</span>
          <h2 className="font-serif text-[19px] leading-none text-ink">
            Three moves
          </h2>
        </div>
        <ol className="mt-4 space-y-4">
          {[
            {
              n: "01",
              t: "Snap",
              d: "Camera or gallery. Every line is read with its quantity, rate and amount.",
            },
            {
              n: "02",
              t: "Audit",
              d: "Each charge is tested against IRDAI non-payables, the room-rent ratio, and your own policy schedule.",
            },
            {
              n: "03",
              t: "Dispute",
              d: "A letter that names every rupee and cites the circular — in English, Hindi or Kannada.",
            },
          ].map((s) => (
            <li key={s.n} className="flex gap-3.5">
              <span className="mt-[3px] font-mono text-[10px] tnum text-emerald">
                {s.n}
              </span>
              <div>
                <div className="text-[13px] font-semibold tracking-[-0.01em] text-ink">
                  {s.t}
                </div>
                <div className="mt-0.5 text-[11.5px] leading-relaxed text-ink-2">
                  {s.d}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex items-start gap-2.5 border border-rule bg-paper px-3.5 py-3">
          <Sparkles className="mt-[1px] h-3.5 w-3.5 shrink-0 text-emerald" />
          <p className="text-[11px] leading-relaxed text-ink-2">
            <span className="font-medium text-ink">No rule is invented.</span>{" "}
            Every flag resolves to a numbered citation shown inline. If a clause
            cannot be pointed at, no flag is raised.
          </p>
        </div>
      </div>

      {/* ── Fullscreen player ────────────────────────────────────── */}
      {video && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-ink">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-ivory/60">
              Kavach · narrated walkthrough
            </span>
            <button
              onClick={() => setVideo(null)}
              aria-label="Close video"
              className="flex h-11 w-11 items-center justify-center border border-ivory/20 text-ivory"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <video
            src={video}
            controls
            autoPlay
            playsInline
            className="min-h-0 w-full flex-1 object-contain"
          />
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Info,
  Loader2,
  MessageCircle,
  Volume2,
} from "lucide-react";
import { inr } from "@/lib/format";
import type { Audit } from "@/lib/types";
import { buildLetter, LANG_LABEL, type Lang } from "@/lib/letter";
import { FLAG_META } from "@/lib/rules";
import { Button, Label, Pill, SectionHead, Rule } from "./ui";
import type { ViewProps } from "./KavachApp";

const LANGS: Lang[] = ["en", "hi", "kn"];
const SPEECH: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", kn: "kn-IN" };

export default function DisputeView({
  c,
  audit,
  toast,
  onNav,
  onDesk,
}: ViewProps & { audit: Audit }) {
  const [lang, setLang] = useState<Lang>("en");
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);

  const site =
    typeof window !== "undefined" ? window.location.origin : "kavach.health";

  const letter = useMemo(
    () => buildLetter(c, audit, lang, today || "—", site),
    [c, audit, lang, today, site],
  );

  const tpaFlags = audit.flags.filter((f) => f.against === "tpa");
  const hospFlags = audit.flags.filter((f) => f.against === "hospital");

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter.text);
      setCopied(true);
      toast("Letter copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = letter.text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      toast("Letter copied");
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast("Read-aloud is not available on this browser");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(letter.text);
    u.lang = SPEECH[lang];
    u.rate = 0.92;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  return (
    <div className="px-4 pt-5">
      <div className="no-print">
        <Label>{c.city} · Grounds for objection</Label>
        <h1 className="mt-1.5 font-serif text-[30px] leading-[1.02] tracking-[-0.025em] text-ink">
          {inr(letter.demand)}
          <br />
          <span className="text-[19px] italic text-ink-2">with no clause behind it.</span>
        </h1>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Pill tone="vermilion">{tpaFlags.length} against the TPA</Pill>
          <Pill tone="amber">{hospFlags.length} against the hospital</Pill>
          <Pill tone="neutral">IRDAI · policy</Pill>
        </div>

        {/* Language */}
        <div className="mt-5">
          <Label>Language of the letter</Label>
          <div className="mt-2 grid grid-cols-3 border border-rule bg-paper">
            {LANGS.map((l, i) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={
                  "flex min-h-[44px] items-center justify-center text-[12.5px] transition-colors " +
                  (i > 0 ? "border-l border-rule " : "") +
                  (lang === l
                    ? "bg-emerald font-medium text-ivory"
                    : "text-ink-2 hover:text-ink")
                }
              >
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Grounds */}
        <div className="mt-6">
          <SectionHead
            index="01"
            title="The grounds"
            right={<Label className="text-[9px]">numbered</Label>}
          />

          <div className="space-y-2.5">
            {[...tpaFlags, ...hospFlags].map((f, i) => {
              const meta = FLAG_META[f.kind];
              const isTpa = f.against === "tpa";
              return (
                <article
                  key={f.id}
                  className="border border-rule bg-paper"
                  style={{ borderLeftWidth: 3, borderLeftColor: isTpa ? "#DC2626" : "#B45309" }}
                >
                  <div className="px-3.5 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] tnum text-ink-3">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-[12.5px] font-semibold leading-snug text-ink">
                          {f.title}
                        </h3>
                      </div>
                      <span className="shrink-0 font-mono text-[14px] tnum font-medium text-vermilion">
                        {inr(f.amount)}
                      </span>
                    </div>

                    <div className="mt-1.5">
                      <span
                        className={
                          "text-[9px] font-medium uppercase tracking-[0.12em] " +
                          (isTpa ? "text-vermilion" : "text-amber")
                        }
                      >
                        {meta.label}
                      </span>
                    </div>

                    <p className="mt-2 text-[11.5px] leading-relaxed text-ink-2">
                      {f.plain}
                    </p>
                  </div>

                  <div className="mx-3.5 mt-2.5 border-l-2 border-emerald bg-emerald-50/60 px-2.5 py-2">
                    <div className="text-[8.5px] font-medium uppercase tracking-[0.13em] text-emerald">
                      Say this at the desk
                    </div>
                    <p className="mt-1 font-serif text-[12px] italic leading-snug text-ink">
                      {f.ask}
                    </p>
                  </div>

                  <div className="mt-2.5 flex items-start gap-1.5 border-t border-rule px-3.5 py-2">
                    <span className="mt-[1px] shrink-0 font-mono text-[9px] text-ink-3">
                      {f.ruleId}
                    </span>
                    <p className="font-mono text-[9px] leading-relaxed text-ink-3">
                      {f.citation}
                    </p>
                  </div>
                </article>
              );
            })}

            {audit.flags.length === 0 && (
              <div className="border border-rule bg-paper px-3.5 py-4 text-[12px] text-ink-2">
                No deductions on this bill contradict the rules loaded in the
                engine. Nothing to dispute.
              </div>
            )}
          </div>
        </div>

        <Rule />
      </div>

      {/* Letter */}
      <div>
        <SectionHead
          index="02"
          title="The letter"
          right={
            <button
              onClick={speak}
              className="no-print flex min-h-[44px] items-center gap-1.5 text-[10.5px] font-medium text-ink-2"
            >
              <Volume2 className="h-3.5 w-3.5" />
              {speaking ? "Stop" : "Read aloud"}
            </button>
          }
        />

        <div className="print-sheet border border-rule bg-paper">
          <div className="flex items-center justify-between border-b border-rule px-3.5 py-2">
            <span className="text-[8.5px] font-medium uppercase tracking-[0.16em] text-ink-3">
              Draft · {LANG_LABEL[lang]}
            </span>
            <span className="font-mono text-[8.5px] text-ink-3">
              {c.policy.claimNo}
            </span>
          </div>
          <div className="max-h-[440px] overflow-y-auto px-4 py-4 print:max-h-none print:overflow-visible">
            <pre className="whitespace-pre-wrap font-serif text-[12px] leading-[1.62] text-ink">
              {letter.text || "Preparing…"}
            </pre>
          </div>
        </div>

        <div className="no-print mt-3 grid grid-cols-2 gap-2">
          <Button onClick={copy} variant="primary" className="w-full">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy letter"}
          </Button>
          <Button
            onClick={() => window.open(letter.whatsapp, "_blank", "noopener")}
            variant="outline"
            className="w-full"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
          <Button onClick={() => window.print()} variant="outline" className="w-full">
            <Download className="h-3.5 w-3.5" />
            Save as PDF
          </Button>
          <Button onClick={onDesk} variant="outline" className="w-full">
            <span className="text-[11px]">Desk mode</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="no-print mt-3 flex items-start gap-2 border border-rule bg-paper px-3 py-2.5">
          <Info className="mt-[1px] h-3 w-3 shrink-0 text-ink-3" />
          <p className="text-[10px] leading-relaxed text-ink-2">
            Kavach produces a factual claim objection for you to send in your own
            name. It is not legal or medical advice, and it does not file
            anything on your behalf.
          </p>
        </div>

        <div className="no-print mt-3 pb-8">
          <Button onClick={() => onNav("dossier")} variant="primary" className="w-full">
            <Loader2 className="hidden" />
            Get the certified dossier — ₹49
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

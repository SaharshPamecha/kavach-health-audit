"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Download,
  Loader2,
  Lock,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { inr } from "@/lib/format";
import type { Audit } from "@/lib/types";
import { buildLetter } from "@/lib/letter";
import { Button, Label, Pill, SectionHead, Rule } from "./ui";
import type { ViewProps } from "./KavachApp";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function caseRef(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return "KV-26-" + h.toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
}

function loadCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type Phase = "idle" | "creating" | "checkout" | "verifying" | "paid";

export default function DossierView({
  c,
  audit,
  toast,
  onDesk,
  paid,
  setPaid,
}: ViewProps & { audit: Audit }) {
  const [phase, setPhase] = useState<Phase>(paid ? "paid" : "idle");
  const [receipt, setReceipt] = useState<string | null>(paid ? "SIMULATED" : null);
  const [live, setLive] = useState<boolean | null>(null);
  const ref = caseRef(c.id + audit.illegalTotal);

  useEffect(() => {
    fetch("/api/create-order")
      .then((r) => r.json())
      .then((d) => setLive(Boolean(d.configured)))
      .catch(() => setLive(false));
  }, []);

  const letter = buildLetter(c, audit, "en", "—", "");

  async function pay() {
    setPhase("creating");
    try {
      const r = await fetch("/api/create-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseRef: ref, amount: 4900 }),
      });
      const order = await r.json();

      if (!order.configured) {
        toast("Razorpay keys not set — running demo payment");
        await simulate();
        return;
      }
      if (!order.orderId) {
        toast(order.error ?? "Could not open checkout");
        setPhase("idle");
        return;
      }

      const ok = await loadCheckout();
      if (!ok || !window.Razorpay) {
        toast("Checkout script blocked — running demo payment");
        await simulate();
        return;
      }

      setPhase("checkout");
      const rz = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: "INR",
        name: "Kavach",
        description: "Clause-linked TPA Dispute Dossier",
        order_id: order.orderId,
        theme: { color: "#0F5132" },
        prefill: { name: c.patientName },
        notes: { case_ref: ref, claim: c.policy.claimNo },
        handler: async (resp: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setPhase("verifying");
          try {
            const v = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(resp),
            }).then((x) => x.json());
            if (v.verified) {
              setReceipt(resp.razorpay_payment_id);
              setPaid(true);
              setPhase("paid");
              toast("Payment verified — dossier unlocked");
            } else {
              toast("Signature mismatch — not charged");
              setPhase("idle");
            }
          } catch {
            toast("Could not verify — check your Razorpay dashboard");
            setPhase("idle");
          }
        },
        modal: {
          ondismiss: () => setPhase((p) => (p === "paid" ? p : "idle")),
        },
      });
      rz.open();
    } catch {
      toast("Checkout failed — running demo payment");
      await simulate();
    }
  }

  async function simulate() {
    setPhase("verifying");
    await new Promise((r) => setTimeout(r, 900));
    const id = "pay_DEMO" + Math.random().toString(36).slice(2, 10).toUpperCase();
    setReceipt(id);
    setPaid(true);
    setPhase("paid");
    toast("Demo payment complete — no money moved");
  }

  const grounds = audit.flags.length;
  const citations = new Set(audit.flags.map((f) => f.ruleId)).size;

  return (
    <div className="px-4 pt-5">
      <Label>{c.city} · Document pack</Label>
      <h1 className="mt-1.5 font-serif text-[30px] leading-[1.02] tracking-[-0.025em] text-ink">
        The version you
        <br />
        hand over.
      </h1>
      <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">
        A hearing-ready file: every ground numbered, every citation in full, the
        arithmetic reconciled, and a case reference you can quote on a call.
      </p>

      {/* Certificate */}
      <div className="mt-5 border border-emerald/30 bg-paper">
        <div className="flex items-center justify-between bg-emerald px-3.5 py-2">
          <span className="text-[8.5px] font-medium uppercase tracking-[0.18em] text-ivory/80">
            Kavach · Clause-linked dossier
          </span>
          <ShieldCheck className="h-3.5 w-3.5 text-ivory/80" />
        </div>

        <div className="px-3.5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[8.5px] font-medium uppercase tracking-[0.14em] text-ink-3">
                Case reference
              </div>
              <div className="mt-0.5 font-mono text-[15px] tnum tracking-[0.02em] text-ink">
                {ref}
              </div>
            </div>
            <Pill tone={phase === "paid" ? "emerald" : "neutral"}>
              {phase === "paid" ? (
                <>
                  <BadgeCheck className="h-2.5 w-2.5" /> unlocked
                </>
              ) : (
                "draft"
              )}
            </Pill>
          </div>

          <div className="mt-4 border-t border-rule pt-3">
            <div className="text-[8.5px] font-medium uppercase tracking-[0.14em] text-ink-3">
              Amount in dispute
            </div>
            <div className="mt-1 font-mono text-[34px] tnum font-medium leading-none tracking-[-0.03em] text-vermilion">
              {inr(letter.demand)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-rule border-y border-rule py-2.5">
            <Mini k="Grounds" v={String(grounds)} />
            <Mini k="Citations" v={String(citations)} />
            <Mini k="Billed" v={inr(audit.billed)} />
          </div>

          <div className="mt-3 space-y-1.5">
            {[
              "Annexure A — ground-by-ground schedule with amounts",
              "Full clause text for every citation relied on",
              "Escalation ladder with statutory turnaround dates",
              "Itemised bill reconciliation, rupee for rupee",
            ].map((t) => (
              <div key={t} className="flex items-start gap-1.5">
                <Check className="mt-[2px] h-3 w-3 shrink-0 text-emerald" strokeWidth={2.4} />
                <span className="text-[11px] leading-snug text-ink-2">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-rule px-3.5 py-3">
          {phase === "paid" ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 border border-emerald/30 bg-emerald-50 px-2.5 py-2">
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald" />
                <div className="min-w-0">
                  <div className="text-[10.5px] font-medium text-emerald">
                    Dossier unlocked
                  </div>
                  <div className="truncate font-mono text-[9.5px] text-emerald/80">
                    {receipt}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => window.print()} variant="primary">
                  <Download className="h-3.5 w-3.5" /> PDF
                </Button>
                <Button onClick={onDesk} variant="outline">
                  Desk mode <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button
                onClick={() => window.open(letter.whatsapp, "_blank", "noopener")}
                variant="outline"
                className="w-full"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Share on WhatsApp
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="font-mono text-[26px] tnum font-medium leading-none text-ink">
                    ₹49
                  </span>
                  <span className="ml-1.5 text-[11px] text-ink-2">one-time</span>
                </div>
                <span className="flex items-center gap-1 text-[9.5px] text-ink-3">
                  <Lock className="h-2.5 w-2.5" /> Razorpay
                </span>
              </div>
              <Button
                onClick={pay}
                variant="primary"
                className="w-full"
                disabled={phase === "creating" || phase === "verifying" || phase === "checkout"}
              >
                {phase === "creating" || phase === "verifying" || phase === "checkout" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {phase === "verifying" ? "Verifying…" : "Opening checkout…"}
                  </>
                ) : (
                  <>
                    Pay ₹49 & unlock
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
              <button
                onClick={simulate}
                disabled={phase !== "idle"}
                className="w-full py-1.5 text-[10.5px] font-medium text-ink-3 underline decoration-rule-strong underline-offset-2 disabled:opacity-40"
              >
                {live === false
                  ? "No keys set — run demo simulation"
                  : "Run a demo payment instead"}
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-2.5 text-[10px] leading-relaxed text-ink-3">
        {live === false
          ? "Razorpay test keys are not configured on this deployment, so the simulation path is active. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to switch to live test-mode checkout."
          : "Test-mode checkout. Use Razorpay's test card 4111 1111 1111 1111 with any future expiry and any CVV."}
      </p>

      <Rule />

      <div className="pb-8">
        <SectionHead index="01" title="What stays free" />
        <div className="divide-y divide-rule border border-rule bg-paper">
          {[
            ["The audit and every flag", "Free"],
            ["The dispute letter, all 3 languages", "Free"],
            ["Copy, WhatsApp, save as PDF", "Free"],
            ["Certified dossier with case reference", "₹49"],
          ].map(([t, v]) => (
            <div key={t} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <span className="text-[11.5px] text-ink-2">{t}</span>
              <span
                className={
                  "shrink-0 font-mono text-[10.5px] tnum " +
                  (v === "Free" ? "text-emerald" : "text-ink")
                }
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="px-2.5">
      <div className="text-[8px] font-medium uppercase tracking-[0.11em] text-ink-3">
        {k}
      </div>
      <div className="mt-0.5 font-mono text-[11.5px] tnum text-ink">{v}</div>
    </div>
  );
}
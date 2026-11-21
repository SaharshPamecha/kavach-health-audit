"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Lock, Pencil, X } from "lucide-react";
import { CATEGORY_LABEL } from "@/lib/types";
import { inr } from "@/lib/format";
import { Money, Label, Pill, Button, SectionHead } from "./ui";
import type { ViewProps } from "./KavachApp";
import type { Audit } from "@/lib/types";
import { FLAG_META } from "@/lib/rules";

const CODE: Record<string, string> = {
  room: "RM",
  surgeon: "SG",
  ot: "OT",
  nursing: "NS",
  pharmacy: "PH",
  implant: "IM",
  consumable: "CS",
  diagnostic: "DX",
  misc: "MS",
};

export default function BillView({
  c,
  audit,
  onNav,
  draft,
  onEditItem,
  onDeleteItem,
}: ViewProps & { audit: Audit; onEditItem: (id: string, v: number) => void; onDeleteItem: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const flagged = audit.flags.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="px-4 pt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Label>
            {c.city} · {draft ? "Pre-claim check" : "Discharge bill"}
          </Label>
          <h1 className="mt-1.5 font-serif text-[26px] leading-[1.05] tracking-[-0.02em] text-ink">
            {c.hospital}
          </h1>
          <p className="mt-1 text-[12px] leading-snug text-ink-2">{c.procedure}</p>
        </div>
        {draft && (
          <button
            onClick={() => setEditing((v) => !v)}
            className="flex min-h-[44px] shrink-0 items-center gap-1.5 border border-rule bg-paper px-2.5 text-[11px] font-medium text-ink-2"
          >
            {editing ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
            {editing ? "Done" : "Edit"}
          </button>
        )}
      </div>

      {/* Patient strip */}
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-y border-rule py-3">
        <Field k="Patient" v={`${c.patientName}${c.patientAge ? `, ${c.patientAge}` : ""}`} />
        <Field k="Policy" v={c.policy.policyNo} mono />
        <Field k="Admitted" v={c.admission} />
        <Field k="Discharged" v={c.discharge} />
      </div>

      {/* Total */}
      <div className="mt-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Label>Total billed</Label>
            <div className="mt-1 flex items-baseline">
              <Money
                value={audit.billed}
                className="text-[40px] font-medium leading-none tracking-[-0.03em] text-ink"
              />
            </div>
          </div>
          <div className="pb-1 text-right">
            <Label className="text-[9px]">Withheld</Label>
            <div className="mt-1 font-mono text-[19px] tnum leading-none text-vermilion">
              {inr(flagged)}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Pill tone="vermilion">{audit.flags.length} findings</Pill>
          <Pill tone="neutral">{c.items.length} line items</Pill>
          {c.capType !== "none" && (
            <Pill tone="emerald">
              {c.capType === "icu" ? "ICU" : "Room"} cap {inr(
                c.capType === "icu" ? c.policy.icuCapPerDay : c.policy.roomCapPerDay,
              )}
            </Pill>
          )}
        </div>
      </div>

      {/* Ledger */}
      <div className="mt-6">
        <SectionHead
          index="01"
          title="Line by line"
          right={<Label className="text-[9px]">{draft ? "Tap to correct" : "As printed"}</Label>}
        />

        <div className="border-t border-rule">
          {c.items.map((it) => {
            const flag = audit.flags.find((f) => f.itemId === it.id);
            const line = audit.lines.find((l) => l.item.id === it.id);
            return (
              <div key={it.id} className="flex gap-2.5 border-b border-rule py-3">
                <div className="w-[22px] shrink-0 pt-[3px]">
                  <span className="font-mono text-[9px] tracking-tight text-ink-3">
                    {CODE[it.category] ?? "—"}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[13px] leading-snug text-ink">{it.label}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-[10px] tnum text-ink-3">
                    <span>
                      {it.qty} × {inr(it.rate)}
                    </span>
                    {it.detail && <span className="text-ink-3/70">· {it.detail}</span>}
                  </div>

                  {flag && (
                    <div className="mt-1.5 flex items-start gap-1 text-[10px] leading-tight text-vermilion">
                      <AlertCircle className="mt-[1px] h-3 w-3 shrink-0" strokeWidth={2.2} />
                      <span>
                        {FLAG_META[flag.kind].label} · {inr(flag.amount)}
                      </span>
                    </div>
                  )}
                  {!flag && it.listI && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber">
                      <Lock className="h-2.5 w-2.5" strokeWidth={2.4} />
                      IRDAI List-I
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {editing ? (
                    <input
                      type="number"
                      value={it.amount}
                      onChange={(e) => onEditItem(it.id, Number(e.target.value))}
                      className="w-[84px] border border-rule-strong bg-paper px-1.5 py-1 text-right font-mono text-[12px] tnum text-ink"
                      aria-label={`Amount for ${it.label}`}
                    />
                  ) : (
                    <div className="font-mono text-[13.5px] tnum leading-tight text-ink">
                      {it.amount.toLocaleString("en-IN")}
                    </div>
                  )}
                  {line && line.tpaAllowed < it.amount && !editing && (
                    <div className="mt-0.5 font-mono text-[9.5px] tnum text-ink-3">
                      adm. {inr(line.tpaAllowed)}
                    </div>
                  )}
                  {editing && (
                    <button
                      onClick={() => onDeleteItem(it.id)}
                      className="mt-1 text-[9.5px] uppercase tracking-label text-vermilion"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-b border-rule py-3">
          <span className="text-[11px] font-medium uppercase tracking-label text-ink-2">
            Total
          </span>
          <span className="font-mono text-[15px] tnum font-medium text-ink">
            {inr(audit.billed)}
          </span>
        </div>
      </div>

      {/* Finding summary */}
      <div className="mt-5 border border-rule bg-paper">
        <div className="flex items-center justify-between border-b border-rule px-3.5 py-2.5">
          <Label className="text-[9px]">What the audit found</Label>
          <span className="font-mono text-[11px] tnum text-vermilion">
            {inr(audit.recoverable)} recoverable
          </span>
        </div>
        <div className="space-y-2 px-3.5 py-3">
          {audit.flags.slice(0, 4).map((f) => (
            <div key={f.id} className="flex items-start justify-between gap-3">
              <span className="text-[11.5px] leading-snug text-ink-2">{f.title}</span>
              <span className="shrink-0 font-mono text-[11.5px] tnum text-vermilion">
                {inr(f.amount)}
              </span>
            </div>
          ))}
          {audit.flags.length > 4 && (
            <div className="text-[10.5px] text-ink-3">
              +{audit.flags.length - 4} more
            </div>
          )}
          {audit.flags.length === 0 && (
            <div className="text-[11.5px] text-ink-2">
              No rule violations on this bill.
            </div>
          )}
        </div>
        <div className="border-t border-rule px-3.5 py-2.5">
          <Button onClick={() => onNav("audit")} className="w-full">
            Open the audit
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <p className="mt-3 pb-6 text-[10px] leading-relaxed text-ink-3">
        {CATEGORY_LABEL.room} and OT lines scale with room class; pharmacy,
        implants and diagnostics are fixed-cost and sit outside the ratio.
        {draft
          ? " Amounts on a photographed bill are editable — correct any line the camera misread."
          : ""}
      </p>
    </div>
  );
}

function Field({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-ink-3">
        {k}
      </div>
      <div
        className={
          "mt-0.5 truncate text-[11.5px] text-ink " + (mono ? "font-mono tnum" : "")
        }
      >
        {v}
      </div>
    </div>
  );
}

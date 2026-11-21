"use client";

import { ArrowRight, Info, Lock, Scale } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { inr, pct } from "@/lib/format";
import type { Audit } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/types";
import { Money, Label, Pill, Button, SectionHead, Slider, Toggle, Rule } from "./ui";
import type { ViewProps } from "./KavachApp";

export default function AuditView({
  c,
  audit,
  settings,
  setSettings,
  onNav,
}: ViewProps & { audit: Audit }) {
  const noRoom = c.capType === "none";
  const beyondRule = audit.lines.filter((l) => !l.proportioned && l.illegalCut > 0);
  const proportionedLines = audit.lines.filter((l) => l.proportioned && l.item.amount > 0);
  const protectedLines = audit.lines
    .filter((l) => !l.proportioned && l.item.amount > 0)
    .sort((a, b) => b.item.amount - a.item.amount)
    .slice(0, 4);

  const tpaPart = Math.round(audit.illegalTotal * (1 - settings.coPay / 100));
  const hospPart = audit.hospitalOvercharge;
  const tpaPaid = audit.buckets.find((b) => b.key === "insurer")?.value ?? 0;
  const gap = Math.max(0, audit.insurerPays - tpaPaid);
  const paidRatio = audit.insurerPays > 0 ? tpaPaid / audit.insurerPays : 1;

  return (
    <div className="px-4 pt-5">
      <Label>{c.city} · Adjudication</Label>
      <h1 className="mt-1.5 font-serif text-[30px] leading-[1.02] tracking-[-0.025em] text-ink">
        What the claim
        <br />
        should have paid.
      </h1>

      {/* ── Hero number ─────────────────────────────────────────── */}
      <div className="mt-5 border-y border-rule py-4">
        <div className="flex items-center gap-1.5">
          <span className="h-[6px] w-[6px] bg-vermilion" />
          <Label>Withheld without a clause</Label>
        </div>
        <div className="mt-1.5">
          <Money
            value={audit.illegalTotal}
            className="text-[46px] font-medium leading-none tracking-[-0.035em] text-vermilion"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-2">
          <span>
            <span className="font-mono tnum text-ink">{inr(tpaPart)}</span> from the
            insurer
          </span>
          {hospPart > 0 && (
            <span>
              <span className="font-mono tnum text-ink">{inr(hospPart)}</span> from the
              hospital
            </span>
          )}
          <span className="text-ink-3">
            after {settings.coPay}% co-pay
          </span>
        </div>
      </div>

      {/* ── Three stat cells ────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-3 divide-x divide-rule border border-rule bg-paper">
        <CellStat label="Billed" value={audit.billed} />
        <CellStat label="Insurer due" value={audit.insurerPays} tone="emerald" />
        <CellStat label="You bear" value={audit.patientPays} />
      </div>

      {/* ── What they paid vs what was due ──────────────────────── */}
      <div className="mt-2.5 border border-rule bg-paper px-3.5 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <Label className="text-[9px]">Actually paid by the TPA</Label>
          <span className="font-mono text-[12px] tnum text-ink">{inr(tpaPaid)}</span>
        </div>
        <div className="relative mt-2 h-[6px] w-full overflow-hidden bg-ivory">
          <div
            className="absolute inset-y-0 left-0 bg-emerald transition-[width] duration-500"
            style={{ width: `${Math.max(0, Math.min(1, paidRatio)) * 100}%` }}
          />
          <div
            className="absolute inset-y-0 right-0 bg-vermilion/25 transition-[width] duration-500"
            style={{ width: `${(1 - Math.max(0, Math.min(1, paidRatio))) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <span className="text-[10px] leading-none text-ink-3">
            What the rules allow
          </span>
          <span className="font-mono text-[12px] tnum text-emerald">
            {inr(audit.insurerPays)}
          </span>
        </div>
        {gap > 0 && (
          <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-rule pt-2">
            <span className="text-[10px] uppercase tracking-label text-ink-2">
              The gap
            </span>
            <span className="font-mono text-[13px] tnum font-medium text-vermilion">
              {inr(gap)}
            </span>
          </div>
        )}
      </div>

      {/* ── Doughnut ────────────────────────────────────────────── */}
      <div className="mt-6">
        <SectionHead
          index="01"
          title="Where the bill went"
          right={
            audit.balanced ? (
              <span className="text-[9.5px] font-medium uppercase tracking-label text-emerald">
                reconciles
              </span>
            ) : null
          }
        />

        <div className="flex items-center gap-4 border border-rule bg-paper p-3.5">
          <div className="relative shrink-0" style={{ width: 132, height: 132 }}>
            <PieChart width={132} height={132}>
              <Pie
                data={audit.buckets}
                dataKey="value"
                nameKey="label"
                cx={66}
                cy={66}
                innerRadius={44}
                outerRadius={62}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                paddingAngle={1.2}
                isAnimationActive={false}
              >
                {audit.buckets.map((b) => (
                  <Cell key={b.key} fill={b.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[8.5px] font-medium uppercase tracking-[0.13em] text-ink-3">
                Billed
              </span>
              <span className="mt-0.5 font-mono text-[13px] tnum font-medium text-ink">
                {inr(audit.billed)}
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            {audit.buckets.map((b) => (
              <div key={b.key} className="flex items-start gap-2">
                <span
                  className="mt-[5px] h-2 w-2 shrink-0"
                  style={{ background: b.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] leading-tight text-ink-2">{b.label}</div>
                  <div className="font-mono text-[11.5px] tnum leading-tight text-ink">
                    {inr(b.value)}
                    <span className="ml-1 text-[9.5px] text-ink-3">
                      {pct(b.value / audit.billed, 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────── */}
      <div className="mt-6">
        <SectionHead index="02" title="Change the terms" />
        <div className="divide-y divide-rule border border-rule bg-paper">
          <div className="px-3.5 py-3">
            <Slider
              label={c.capType === "icu" ? "ICU bed cap / day" : "Room rent cap / day"}
              display={noRoom ? "—" : inr(settings.roomCap)}
              min={1000}
              max={15000}
              step={500}
              value={settings.roomCap}
              disabled={noRoom}
              note={
                noRoom
                  ? "Day-care procedure — there is no room rent to proportion."
                  : undefined
              }
              onChange={(v) => setSettings({ ...settings, roomCap: v })}
            />
          </div>

          <div className="px-3.5 py-3">
            <Slider
              label="Co-pay"
              display={`${settings.coPay}%`}
              min={0}
              max={30}
              step={1}
              value={settings.coPay}
              onChange={(v) => setSettings({ ...settings, coPay: v })}
            />
          </div>

          <div className="px-3.5 py-2">
            <Toggle
              label="Consumables cover add-on"
              hint="Pays IRDAI List-I items — gloves, syringes, admission fees — instead of leaving them on you."
              checked={settings.cover}
              onChange={(v) => setSettings({ ...settings, cover: v })}
            />
          </div>
        </div>
      </div>

      {/* ── Shield matrix ───────────────────────────────────────── */}
      <div className="mt-6">
        <SectionHead index="03" title="The fixed-cost shield" />

        <div className="border border-rule bg-paper">
          <div className="border-b border-rule px-3.5 py-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[22px] tnum font-medium leading-none text-ink">
                {pct(audit.ratio)}
              </span>
              <span className="text-[11px] text-ink-2">
                of eligible room rent ÷ actual
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-2">
              The ratio is lawful on <span className="font-medium text-ink">room, surgeon and OT</span>{" "}
              — {proportionedLines.length} lines here. It is being applied to{" "}
              <span className="font-medium text-vermilion">
                {proportionedLines.length + beyondRule.length}
              </span>
              .
            </p>
          </div>

          <div className="px-3.5 py-3">
            <Label className="text-[9px]">Inside the ratio</Label>
            <div className="mt-2 space-y-2.5">
              {proportionedLines.map((l) => {
                const keep = l.item.amount > 0 ? l.idealAllowed / l.item.amount : 0;
                return (
                  <BarRow
                    key={l.item.id}
                    label={CATEGORY_LABEL[l.item.category]}
                    amount={l.item.amount}
                    allowed={l.idealAllowed}
                    keep={keep}
                  />
                );
              })}
            </div>

            <div className="mt-3.5 flex items-center gap-2">
              <div className="h-px flex-1 bg-rule" />
              <span className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-label text-emerald">
                <Lock className="h-2.5 w-2.5" strokeWidth={2.6} /> Outside the ratio
              </span>
              <div className="h-px flex-1 bg-rule" />
            </div>

            <div className="mt-2.5 space-y-2.5">
              {protectedLines.map((l) => (
                <BarRow
                  key={l.item.id}
                  label={l.item.label}
                  amount={l.item.amount}
                  allowed={l.idealAllowed}
                  keep={l.item.amount > 0 ? l.idealAllowed / l.item.amount : 1}
                  shielded
                  cutByTpa={l.illegalCut}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-start gap-2 border border-rule bg-paper px-3 py-2.5">
          <Info className="mt-[1px] h-3 w-3 shrink-0 text-ink-3" />
          <p className="text-[10.5px] leading-relaxed text-ink-2">
            A stapler, a lens and a strip of tablets cost the hospital the same
            whether you are in a deluxe room or a general ward. That is why the
            ratio stops at the room line.
          </p>
        </div>
      </div>

      <Rule />

      {/* ── Reconciliation ──────────────────────────────────────── */}
      <div className="pb-8">
        <SectionHead index="04" title="It adds up" />
        <div className="border border-rule bg-paper p-3.5">
          <div className="space-y-1.5 font-mono text-[11px] tnum">
            {audit.buckets.map((b) => (
              <div key={b.key} className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[10px] uppercase tracking-[0.06em] text-ink-3">
                  {b.label}
                </span>
                <span className="text-ink">{inr(b.value)}</span>
              </div>
            ))}
            <div className="my-1.5 h-px bg-rule" />
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.06em] text-ink-3">
                Total
              </span>
              <span className="text-[13px] font-medium text-ink">{inr(audit.billed)}</span>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 border-t border-rule pt-2.5">
            <Scale className="h-3 w-3 text-emerald" />
            <span className="text-[10px] text-ink-2">
              Every rupee of the bill is accounted for. Nothing is rounded into
              a headline.
            </span>
          </div>
        </div>

        <Button onClick={() => onNav("dispute")} className="mt-3 w-full">
          Build the dispute
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function CellStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "emerald";
}) {
  return (
    <div className="px-2.5 py-2.5">
      <div className="text-[8.5px] font-medium uppercase leading-none tracking-[0.1em] text-ink-3">
        {label}
      </div>
      <div
        className={
          "mt-1.5 font-mono text-[13px] tnum leading-none " +
          (tone === "emerald" ? "text-emerald" : "text-ink")
        }
      >
        {inr(value)}
      </div>
    </div>
  );
}

function BarRow({
  label,
  amount,
  allowed,
  keep,
  shielded,
  cutByTpa,
}: {
  label: string;
  amount: number;
  allowed: number;
  keep: number;
  shielded?: boolean;
  cutByTpa?: number;
}) {
  const cut = Math.max(0, amount - allowed);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {shielded && (
            <Lock className="h-2.5 w-2.5 shrink-0 text-emerald" strokeWidth={2.6} />
          )}
          <span className="truncate text-[11.5px] text-ink">{label}</span>
        </span>
        <span className="shrink-0 font-mono text-[10.5px] tnum">
          {cut > 0 ? (
            <span className="text-vermilion">−{inr(cut)}</span>
          ) : (
            <span className="text-emerald">
              {shielded ? "held" : "—"}
            </span>
          )}
        </span>
      </div>
      <div className="relative mt-1 h-[5px] w-full overflow-hidden bg-ivory">
        <div
          className="absolute inset-y-0 left-0 bg-emerald transition-[width] duration-500"
          style={{ width: `${Math.max(0, Math.min(1, keep)) * 100}%` }}
        />
        {cut > 0 && (
          <div
            className="absolute inset-y-0 right-0 bg-vermilion/30 transition-[width] duration-500"
            style={{ width: `${(1 - Math.max(0, Math.min(1, keep))) * 100}%` }}
          />
        )}
      </div>
      <div className="mt-0.5 flex items-baseline justify-between font-mono text-[9px] tnum text-ink-3">
        <span>{inr(amount)}</span>
        <span>
          {shielded ? inr(allowed) : `${inr(allowed)} of ${inr(amount)}`}
          {cutByTpa ? ` · ${inr(cutByTpa)} cut` : ""}
        </span>
      </div>
    </div>
  );
}

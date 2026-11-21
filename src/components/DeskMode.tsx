"use client";

import { X } from "lucide-react";
import type { Audit, DemoCase } from "@/lib/types";
import { inr } from "@/lib/format";

/**
 * Desk mode — the screen you turn around and hold up at the billing counter.
 * Deliberately not a dashboard: three numbers and three rules, legible from
 * a metre away, on the darkest surface in the app so it reads as a demand.
 */
export default function DeskMode({
  c,
  audit,
  onClose,
}: {
  c: DemoCase;
  audit: Audit;
  onClose: () => void;
}) {
  const top = audit.flags.slice(0, 3);

  return (
    <div className="desk fixed inset-0 z-[60] flex flex-col text-ivory">
      <div
        className="flex-1 overflow-y-auto px-5 pb-6 pt-5"
        style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-ivory/50">
              Kavach · dispute at the desk
            </div>
            <div className="mt-1 text-[11px] text-ivory/70">
              {c.hospital} · {c.policy.claimNo}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close desk mode"
            className="flex h-11 w-11 items-center justify-center border border-ivory/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-10">
          <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-ivory/50">
            Withheld without a clause
          </div>
          <div className="mt-2 font-mono text-[13vw] font-medium leading-[0.9] tracking-[-0.04em] tabular-nums sm:text-[62px]">
            {inr(audit.illegalTotal)}
          </div>
          <div className="mt-3 max-w-[30ch] text-[12.5px] leading-relaxed text-ivory/70">
            Out of {inr(audit.billed)} billed. Under IRDAI rules and the schedule
            of policy {c.policy.policyNo}.
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {top.map((f, i) => (
            <div
              key={f.id}
              className="border-t border-ivory/15 pt-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.14em] text-ivory/40">
                  {String(i + 1).padStart(2, "0")} · {f.ruleId}
                </span>
                <span className="font-mono text-[15px] tabular-nums">
                  {inr(f.amount)}
                </span>
              </div>
              <div className="mt-1 text-[13.5px] font-medium leading-snug">
                {f.title}
              </div>
              <div className="mt-1 text-[10.5px] leading-snug text-ivory/55">
                {f.citation.split(",")[0]}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border border-ivory/25 px-3.5 py-3">
          <div className="text-[9px] font-medium uppercase tracking-[0.16em] text-ivory/50">
            Ask for
          </div>
          <div className="mt-1 font-serif text-[17px] leading-snug">
            A written, clause-wise reason for each deduction — or reversal.
          </div>
        </div>
      </div>

      <div className="border-t border-ivory/15 px-5 py-3 text-[9.5px] uppercase tracking-[0.14em] text-ivory/40">
        Photograph this screen before you leave the counter
      </div>
    </div>
  );
}

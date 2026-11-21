"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  FileText,
  ReceiptText,
  Scale,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { DEMO_CASES, getCase } from "@/lib/cases";
import { auditCase } from "@/lib/engine";
import type { DemoCase } from "@/lib/types";
import { cn } from "@/lib/format";
import HomeView from "./HomeView";
import BillView from "./BillView";
import AuditView from "./AuditView";
import DisputeView from "./DisputeView";
import DossierView from "./DossierView";
import DeskMode from "./DeskMode";

export type Tab = "home" | "bill" | "audit" | "dispute" | "dossier";

export type Settings = {
  roomCap: number;
  coPay: number;
  cover: boolean;
};

export type ViewProps = {
  c: DemoCase;
  settings: Settings;
  setSettings: (s: Settings) => void;
  onNav: (t: Tab) => void;
  onPickCase: (id: string) => void;
  onScan: (c: DemoCase) => void;
  onEditItem: (id: string, v: number) => void;
  onDeleteItem: (id: string) => void;
  draft: DemoCase | null;
  toast: (m: string) => void;
  onDesk: () => void;
  paid: boolean;
  setPaid: (v: boolean) => void;
};

const NAV: { id: Tab; label: string; icon: typeof ScanLine }[] = [
  { id: "home", label: "Scan", icon: ScanLine },
  { id: "bill", label: "Bill", icon: ReceiptText },
  { id: "audit", label: "Audit", icon: BarChart3 },
  { id: "dispute", label: "Dispute", icon: Scale },
  { id: "dossier", label: "Dossier", icon: FileText },
];

function defaultsFor(c: DemoCase): Settings {
  const cap =
    c.capType === "icu"
      ? c.policy.icuCapPerDay
      : c.capType === "none"
        ? Math.max(1, c.policy.roomCapPerDay)
        : c.policy.roomCapPerDay;
  return { roomCap: cap, coPay: c.policy.coPayPct, cover: false };
}

export default function KavachApp() {
  const [caseId, setCaseId] = useState(DEMO_CASES[0].id);
  const [tab, setTab] = useState<Tab>("home");
  const [draft, setDraft] = useState<DemoCase | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultsFor(DEMO_CASES[0]));
  const [desk, setDesk] = useState(false);
  const [paid, setPaid] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const c = draft ?? getCase(caseId);

  const audit = useMemo(
    () =>
      auditCase(c, {
        roomCapPerDay: settings.roomCap,
        coPayPct: settings.coPay,
        consumablesCover: settings.cover,
      }),
    [c, settings],
  );

  function toast(m: string) {
    setToastMsg(m);
    window.setTimeout(() => setToastMsg(null), 2200);
  }

  function pickCase(id: string) {
    const next = getCase(id);
    setCaseId(id);
    setDraft(null);
    setSettings(defaultsFor(next));
    setPaid(false);
    setTab("bill");
    window.scrollTo({ top: 0 });
  }

  function onScan(next: DemoCase) {
    setDraft(next);
    setSettings(defaultsFor(next));
    setPaid(false);
    setTab("bill");
    window.scrollTo({ top: 0 });
  }

  /** Correct a line the camera misread. Rate is re-derived so an edit does
   *  not masquerade as an arithmetic mismatch. */
  function onEditItem(id: string, v: number) {
    setDraft((prev) => {
      if (!prev) return prev;
      const safe = Number.isFinite(v) ? Math.max(0, v) : 0;
      const items = prev.items.map((i) =>
        i.id === id
          ? { ...i, amount: safe, rate: i.qty > 0 ? safe / i.qty : i.rate }
          : i,
      );
      const room = items.find((i) => i.category === "room");
      return {
        ...prev,
        items,
        billedTotal: items.reduce((s, i) => s + i.amount, 0),
        roomRentPerDay: room?.rate ?? prev.roomRentPerDay,
      };
    });
  }

  function onDeleteItem(id: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((i) => i.id !== id);
      return {
        ...prev,
        items,
        billedTotal: items.reduce((s, i) => s + i.amount, 0),
      };
    });
  }

  const props: ViewProps = {
    c,
    settings,
    setSettings,
    onNav: setTab,
    onPickCase: pickCase,
    onScan,
    onEditItem,
    onDeleteItem,
    draft,
    toast,
    onDesk: () => setDesk(true),
    paid,
    setPaid,
  };

  return (
    <div className="min-h-dvh bg-ivory">
      {/* ── Frame: a single mobile column, editorial on desktop ─────── */}
      <div className="mx-auto min-h-dvh w-full max-w-[560px] border-rule bg-ivory md:border-x">
        {/* Header */}
        <header className="no-print sticky top-0 z-30 border-b border-rule bg-ivory/92 backdrop-blur-md">
          <div className="flex h-[54px] items-center justify-between px-4">
            <button
              onClick={() => setTab("home")}
              className="flex min-h-[44px] items-center gap-2.5"
              aria-label="Kavach home"
            >
              <span className="flex h-7 w-7 items-center justify-center bg-emerald">
                <ShieldCheck className="h-4 w-4 text-ivory" strokeWidth={2} />
              </span>
              <span className="flex flex-col items-start leading-none">
                <span className="font-serif text-[17px] tracking-[-0.01em] text-ink">
                  Kavach
                </span>
                <span className="mt-[3px] text-[8.5px] font-medium uppercase tracking-[0.18em] text-ink-3">
                  Bill Audit
                </span>
              </span>
            </button>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 border border-emerald/25 bg-emerald-50 px-2 py-[4px]">
                <span className="h-[5px] w-[5px] rounded-full bg-emerald animate-pulseSoft" />
                <span className="text-[9.5px] font-medium uppercase tracking-[0.11em] text-emerald">
                  IRDAI rules live
                </span>
              </span>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="pb-[92px]">
          {tab === "home" && <HomeView {...props} />}
          {tab === "bill" && <BillView {...props} audit={audit} />}
          {tab === "audit" && <AuditView {...props} audit={audit} />}
          {tab === "dispute" && <DisputeView {...props} audit={audit} />}
          {tab === "dossier" && <DossierView {...props} audit={audit} />}
        </main>

        {/* Bottom navigation */}
        <nav
          className="no-print fixed bottom-0 left-0 right-0 z-30 border-t border-rule bg-ivory/96 backdrop-blur-md"
          aria-label="Primary"
        >
          <div
            className="mx-auto flex max-w-[560px] items-stretch"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {NAV.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setTab(id);
                    window.scrollTo({ top: 0 });
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 pt-1 transition-colors",
                    active ? "text-emerald" : "text-ink-3",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-1/2 top-0 h-[2px] w-8 -translate-x-1/2 transition-opacity",
                      active ? "bg-emerald opacity-100" : "opacity-0",
                    )}
                  />
                  <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2 : 1.6} />
                  <span
                    className={cn(
                      "text-[9.5px] tracking-[0.06em]",
                      active ? "font-semibold" : "font-medium",
                    )}
                  >
                    {label}
                  </span>
                  {id === "dispute" && audit.recoverable > 0 && (
                    <span className="absolute right-[26%] top-[9px] h-[5px] w-[5px] rounded-full bg-vermilion" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Toast */}
        <div
          aria-live="polite"
          className={cn(
            "pointer-events-none fixed bottom-[78px] left-1/2 z-50 -translate-x-1/2 transition-all duration-200",
            toastMsg
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0",
          )}
        >
          {toastMsg && (
            <div className="whitespace-nowrap border border-emerald bg-emerald px-4 py-2.5 text-[12.5px] font-medium text-ivory">
              {toastMsg}
            </div>
          )}
        </div>
      </div>

      {desk && <DeskMode c={c} audit={audit} onClose={() => setDesk(false)} />}
    </div>
  );
}

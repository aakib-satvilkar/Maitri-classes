import React from "react";
import { ChevronLeft, ChevronRight, GraduationCap, MessageCircle } from "lucide-react";
import { C, heading, body, WHATSAPP_NUMBER } from "../data/theme";

export function Card({ children, style, className = "" }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ background: C.paper, border: `1px solid ${C.sand}`, ...style }}
    >
      {children}
    </div>
  );
}

export function Pill({ children, tone = C.teal, filled = false }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={
        filled
          ? { background: tone, color: "#fff" }
          : { background: `${tone}1A`, color: tone }
      }
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children, sub }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg" style={{ ...heading, color: C.ink, fontWeight: 700 }}>
        {children}
      </h2>
      {sub && <p className="text-sm mt-0.5" style={{ ...body, color: C.inkSoft }}>{sub}</p>}
    </div>
  );
}

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-24 right-4 z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-lg active:scale-95 transition-transform"
      style={{ background: "#25D366" }}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={26} color="#fff" fill="#fff" />
    </a>
  );
}

export function TopBar({ title, subtitle }) {
  return (
    <div
      className="px-5 pt-6 pb-5 rounded-b-3xl"
      style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.tealMid})` }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: C.marigold }}
        >
          <GraduationCap size={20} color={C.teal} />
        </div>
        <div>
          <p className="text-white text-base leading-tight" style={{ ...heading, fontWeight: 700 }}>
            Maitri Classes
          </p>
          {subtitle && (
            <p className="text-xs" style={{ ...body, color: C.marigold }}>{subtitle}</p>
          )}
        </div>
      </div>
      {title && (
        <h1 className="mt-4 text-2xl text-white" style={{ ...heading, fontWeight: 700 }}>
          {title}
        </h1>
      )}
    </div>
  );
}

export function BottomNav({ items, active, onChange }) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 flex justify-around items-stretch"
      style={{ background: C.paper, borderTop: `1px solid ${C.sand}`, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((it) => {
        const isActive = active === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5"
            style={{ color: isActive ? C.teal : "#A7ADA3" }}
          >
            <it.icon size={20} strokeWidth={isActive ? 2.6 : 2} />
            <span className="text-[11px]" style={{ ...body, fontWeight: isActive ? 700 : 500 }}>
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function RoleSwitcher({ role, setRole }) {
  const roles = [
    { key: "public", label: "Public site" },
    { key: "parent", label: "Parent" },
    { key: "admin", label: "Admin" },
  ];
  return (
    <div className="px-4 pt-3 pb-1" style={{ background: C.cream }}>
      <div className="flex gap-1.5 p-1 rounded-full" style={{ background: C.sand }}>
        {roles.map((r) => (
          <button
            key={r.key}
            onClick={() => setRole(r.key)}
            className="flex-1 py-1.5 rounded-full text-xs transition-colors"
            style={{
              ...body,
              fontWeight: 600,
              background: role === r.key ? C.teal : "transparent",
              color: role === r.key ? "#fff" : C.inkSoft,
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] mt-1.5" style={{ ...body, color: C.inkSoft }}>
        Demo switcher — a real build would route here from login
      </p>
    </div>
  );
}

/* ---------------- Attendance calendar ---------------- */

export function AttendanceCalendar({ records }) {
  const counts = records.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }),
    {}
  );
  const pct = Math.round(((counts.present || 0) + (counts.late || 0)) / records.length * 100);
  const dotColor = { present: C.leaf, absent: C.coral, late: C.marigold };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ChevronLeft size={18} color={C.inkSoft} />
          <span className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>September 2026</span>
          <ChevronRight size={18} color={C.inkSoft} />
        </div>
        <div className="text-right">
          <p className="text-xl" style={{ ...heading, fontWeight: 700, color: C.teal }}>{pct}%</p>
          <p className="text-[11px]" style={{ ...body, color: C.inkSoft }}>this month</p>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {records.map((r) => (
          <div
            key={r.day}
            className="aspect-square rounded-lg flex items-center justify-center text-xs"
            style={{ background: `${dotColor[r.status]}22`, color: dotColor[r.status], ...body, fontWeight: 700 }}
            title={r.status}
          >
            {r.day}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3">
        {["present", "absent", "late"].map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: dotColor[s] }} />
            <span className="text-[11px] capitalize" style={{ ...body, color: C.inkSoft }}>{s}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

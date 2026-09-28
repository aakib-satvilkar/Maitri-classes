import React, { useState } from "react";
import {
  Home, BookOpen, FileText, Phone, MessageCircle, MapPin, Trophy,
  GraduationCap, Users, Star, Clock, Send, Check, Sparkles,
} from "lucide-react";
import { C, heading, body, WHATSAPP_NUMBER, DISPLAY_NUMBER } from "../data/theme";
import { BATCH_GROUPS, CLASS_OPTIONS, TOPPERS } from "../data/mockData";
import { Card, SectionTitle, TopBar, BottomNav } from "./ui";
import { AttachmentPreview } from "./attachments";
import CommonHomework from "./CommonHomework";

function PublicHome({ go, dailyTask, commonHomework }) {
  return (
    <div className="px-4 pt-4 space-y-5">
      <CommonHomework items={commonHomework} />

      <Card className="p-5" style={{ background: `linear-gradient(135deg, ${C.marigold}, ${C.marigoldDeep})`, border: "none" }}>
        <p className="text-xs uppercase" style={{ ...body, color: C.teal, fontWeight: 700 }}>Admissions open · 2026–27</p>
        <h2 className="text-2xl mt-1" style={{ ...heading, fontWeight: 800, color: C.teal }}>
          Learning that feels like friendship
        </h2>
        <p className="text-sm mt-2" style={{ ...body, color: "#3A2A0F" }}>
          Nursery to 10th, plus Manthan &amp; Scholarship batches — guided by teachers who know every child by name.
        </p>
        <button
          onClick={() => go("admission")}
          className="mt-4 px-4 py-2.5 rounded-xl text-sm"
          style={{ ...body, fontWeight: 700, background: C.teal, color: "#fff" }}
        >
          Enquire for admission
        </button>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: "50+ students" },
          { icon: Trophy, label: "20+ scholars" },
          { icon: GraduationCap, label: "3 years teaching experience" },
        ].map((s, i) => (
          <Card key={i} className="p-3 flex flex-col items-center text-center">
            <s.icon size={18} color={C.teal} />
            <p className="text-[11px] mt-1.5" style={{ ...body, fontWeight: 600, color: C.ink }}>{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4" style={{ background: `${C.marigold}18`, border: `1px solid ${C.marigold}55` }}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} color={C.marigoldDeep} />
          <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.marigoldDeep }}>Today's free task for everyone</p>
        </div>
        {dailyTask ? (
          <>
            <p className="text-sm mt-1.5" style={{ ...body, fontWeight: 700, color: C.ink }}>{dailyTask.title}</p>
            {dailyTask.description && (
              <p className="text-xs mt-0.5" style={{ ...body, color: C.inkSoft }}>{dailyTask.description}</p>
            )}
            <AttachmentPreview attachment={dailyTask.attachment} />
          </>
        ) : (
          <p className="text-xs mt-1.5" style={{ ...body, color: C.inkSoft }}>A new task is posted here every day — check back soon.</p>
        )}
      </Card>

      <div>
        <SectionTitle sub="Grouped by batch, so parents find the right fit fast">Our batches</SectionTitle>
        <button onClick={() => go("batches")} className="text-sm" style={{ ...body, color: C.teal, fontWeight: 700 }}>
          View all batches →
        </button>
      </div>

      <div>
        <SectionTitle>This month's toppers</SectionTitle>
        <div className="space-y-2">
          {TOPPERS.map((t, i) => (
            <Card key={i} className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${C.marigold}30` }}>
                <Star size={18} color={C.marigoldDeep} />
              </div>
              <div className="flex-1">
                <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{t.name}</p>
                <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{t.batch}</p>
              </div>
              <p className="text-sm" style={{ ...heading, fontWeight: 700, color: C.leaf }}>{t.score}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function PublicBatches() {
  return (
    <div className="px-4 pt-4 space-y-5">
      <SectionTitle sub="Every batch is tied to its own attendance, tasks and results">Batches at Maitri Classes</SectionTitle>
      {BATCH_GROUPS.map((g, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full" style={{ background: g.tint }} />
            <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{g.label}</p>
          </div>
          <div className="space-y-2">
            {g.batches.map((b, j) => (
              <Card key={j} className="p-3">
                <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{b.name}</p>
                <p className="text-xs mt-0.5" style={{ ...body, color: C.inkSoft }}>{b.subjects}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Clock size={13} color={g.tint} />
                  <p className="text-xs" style={{ ...body, color: g.tint, fontWeight: 600 }}>{b.timing}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PublicAdmission() {
  const [form, setForm] = useState({ name: "", cls: "", contact: "" });
  const [sent, setSent] = useState(false);

  return (
    <div className="px-4 pt-4">
      <SectionTitle sub="Our team will call you back within a day">Admission enquiry</SectionTitle>
      {sent ? (
        <Card className="p-6 text-center">
          <Check size={32} color={C.leaf} className="mx-auto" />
          <p className="mt-2 text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>Enquiry received!</p>
          <p className="text-xs mt-1" style={{ ...body, color: C.inkSoft }}>We'll WhatsApp you shortly on {form.contact || "your number"}.</p>
        </Card>
      ) : (
        <Card className="p-4 space-y-3">
          <div>
            <label className="text-xs" style={{ ...body, color: C.inkSoft }}>Student name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ ...body, border: `1px solid ${C.sand}` }}
              placeholder="e.g. Aarav Shinde"
            />
          </div>
          <div>
            <label className="text-xs" style={{ ...body, color: C.inkSoft }}>Class / batch interested in</label>
            <select
              value={form.cls}
              onChange={(e) => setForm({ ...form, cls: e.target.value })}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ ...body, border: `1px solid ${C.sand}` }}
            >
              <option value="">Select class</option>
              {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs" style={{ ...body, color: C.inkSoft }}>Parent contact number</label>
            <input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ ...body, border: `1px solid ${C.sand}` }}
              placeholder="10-digit mobile number"
            />
          </div>
          <button
            onClick={() => form.name && form.contact && setSent(true)}
            className="w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            style={{ ...body, fontWeight: 700, background: C.teal, color: "#fff" }}
          >
            <Send size={15} /> Submit enquiry
          </button>
        </Card>
      )}
    </div>
  );
}

function PublicContact() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <SectionTitle>Get in touch</SectionTitle>
      <Card className="p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `${C.leaf}22` }}>
          <MapPin size={19} color={C.leaf} />
        </div>
        <div>
          <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>Maitri Classes</p>
          <p className="text-xs" style={{ ...body, color: C.inkSoft }}>Near Vidya Mandir Chowk, Pune</p>
        </div>
      </Card>
      <a href={`tel:+${WHATSAPP_NUMBER}`}>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `${C.teal}22` }}>
            <Phone size={19} color={C.teal} />
          </div>
          <div>
            <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>Call the institute</p>
            <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{DISPLAY_NUMBER}</p>
          </div>
        </Card>
      </a>
      <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#25D36622" }}>
            <MessageCircle size={19} color="#25D366" />
          </div>
          <div>
            <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>WhatsApp us</p>
            <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{DISPLAY_NUMBER} · usually replies same day</p>
          </div>
        </Card>
      </a>
    </div>
  );
}

export default function PublicSite({ dailyTask, commonHomework }) {
  const [tab, setTab] = useState("home");
  const items = [
    { key: "home", label: "Home", icon: Home },
    { key: "batches", label: "Batches", icon: BookOpen },
    { key: "admission", label: "Admission", icon: FileText },
    { key: "contact", label: "Contact", icon: Phone },
  ];
  return (
    <>
      <TopBar subtitle="Nursery – 10th · Manthan · Scholarship" />
      <div className="pb-28">
        {tab === "home" && <PublicHome go={setTab} dailyTask={dailyTask} commonHomework={commonHomework} />}
        {tab === "batches" && <PublicBatches />}
        {tab === "admission" && <PublicAdmission />}
        {tab === "contact" && <PublicContact />}
      </div>
      <BottomNav items={items} active={tab} onChange={setTab} />
    </>
  );
}

import React, { useState } from "react";
import {
  Home, CalendarCheck, ClipboardList, BarChart3, User, MessageCircle,
  Bell, Check, ShieldCheck, Sparkles, Star, Users, ChevronRight, ArrowLeftRight, Search,
} from "lucide-react";
import { C, heading, body, WHATSAPP_NUMBER } from "../data/theme";
import { getAttendance, RESULTS_BY_CLASS, BADGES, attendancePercent } from "../data/mockData";
import { Card, Pill, SectionTitle, TopBar, BottomNav, AttendanceCalendar } from "./ui";
import GrammarSection from "./GrammarSection";
import { AttachmentPreview } from "./attachments";
import CommonHomework from "./CommonHomework";

export default function ParentPortal({ tasksByClass, notices, grammarScores, onSaveGrammarScore, dailyTask, students, commonHomework }) {
  const [tab, setTab] = useState("home");
  const [childId, setChildId] = useState(null);
  const child = students.find((c) => c.id === childId);
  const [query, setQuery] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSent, setLeaveSent] = useState(false);

  const filtered = students.filter((c) => {
    const q = query.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.cls.toLowerCase().includes(q);
  });

  if (!child) {
    return (
      <>
        <TopBar title="Select your child" subtitle="Parent portal" />
        <div className="px-4 pt-5 pb-10 space-y-3">
          <p className="text-sm" style={{ ...body, color: C.inkSoft }}>
            Choose a child to see their attendance, tasks, grammar practice and results.
          </p>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: C.paper, border: `1px solid ${C.sand}` }}>
            <Search size={16} color={C.inkSoft} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search student by name or class"
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ ...body }}
            />
          </div>
          <p className="text-xs" style={{ ...body, color: C.inkSoft }}>
            {filtered.length} student{filtered.length === 1 ? "" : "s"}
          </p>
          {filtered.length === 0 && (
            <p className="text-sm" style={{ ...body, color: C.inkSoft }}>No student matches "{query}".</p>
          )}
          {filtered.map((c) => {
            const pct = attendancePercent(getAttendance(c.id));
            const tone = pct >= 85 ? C.leaf : pct >= 70 ? C.marigoldDeep : C.coral;
            return (
              <button key={c.id} onClick={() => { setChildId(c.id); setTab("home"); }} className="w-full text-left">
                <Card className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${C.teal}15` }}>
                    <Users size={20} color={C.teal} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{c.name}</p>
                    <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{c.cls}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg" style={{ ...heading, fontWeight: 800, color: tone }}>{pct}%</p>
                    <p className="text-[11px]" style={{ ...body, color: C.inkSoft }}>attendance</p>
                  </div>
                  <ChevronRight size={16} color={C.inkSoft} />
                </Card>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  const items = [
    { key: "home", label: "Home", icon: Home },
    { key: "attendance", label: "Attendance", icon: CalendarCheck },
    { key: "tasks", label: "Tasks", icon: ClipboardList },
    { key: "grammar", label: "Grammar", icon: Sparkles },
    { key: "results", label: "Results", icon: BarChart3 },
    { key: "profile", label: "Profile", icon: User },
  ];

  const attPct = attendancePercent(getAttendance(childId));
  const attTone = attPct >= 85 ? C.leaf : attPct >= 70 ? C.marigoldDeep : C.coral;
  const childGrammar = grammarScores[childId] || {};
  const grammarAttempted = Object.keys(childGrammar).length;

  const ChildSwitcher = (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: C.sand }}>
        <p className="text-xs" style={{ ...body, fontWeight: 700, color: C.ink }}>
          {child.name} · {child.cls}
        </p>
        <button
          onClick={() => setChildId(null)}
          className="flex items-center gap-1 text-xs"
          style={{ ...body, fontWeight: 700, color: C.teal }}
        >
          <ArrowLeftRight size={13} /> Switch child
        </button>
      </div>
    </div>
  );

  return (
    <>
      <TopBar title={`Welcome back!`} subtitle="Parent portal" />
      <div className="pb-28">
        {ChildSwitcher}

        {tab === "home" && (
          <div className="px-4 pt-4 space-y-4">
            <CommonHomework items={commonHomework} />
            <Card className="p-4" style={{ background: `${C.coral}12`, border: `1px solid ${C.coral}33` }}>
              <div className="flex items-center gap-2">
                <Bell size={16} color={C.coral} />
                <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.coral }}>Absent alert</p>
              </div>
              <p className="text-xs mt-1" style={{ ...body, color: C.inkSoft }}>
                {child.name} was marked absent on 12 Sep — a WhatsApp alert was sent the same day.
              </p>
            </Card>

            <Card className="p-4" style={{ background: `${C.marigold}18`, border: `1px solid ${C.marigold}55` }}>
              <div className="flex items-center gap-2">
                <Star size={16} color={C.marigoldDeep} />
                <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.marigoldDeep }}>Daily task</p>
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
                <p className="text-xs mt-1.5" style={{ ...body, color: C.inkSoft }}>No daily task posted yet — check back later.</p>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <p className="text-2xl" style={{ ...heading, fontWeight: 800, color: attTone }}>{attPct}%</p>
                <p className="text-xs" style={{ ...body, color: C.inkSoft }}>attendance this month</p>
              </Card>
              <Card className="p-3">
                <p className="text-2xl" style={{ ...heading, fontWeight: 800, color: C.violet }}>{grammarAttempted}</p>
                <p className="text-xs" style={{ ...body, color: C.inkSoft }}>grammar topics tried</p>
              </Card>
            </div>

            <div>
              <SectionTitle>Today's tasks — {child.cls}</SectionTitle>
              <div className="space-y-2">
                {(tasksByClass[child.cls] || []).slice(0, 2).map((t, i) => (
                  <Card key={i} className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${C.marigold}22` }}>
                      <ClipboardList size={16} color={C.marigoldDeep} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{t.title}</p>
                      <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{t.subject} · due {t.due}</p>
                      <AttachmentPreview attachment={t.attachment} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Notices for {child.cls}</SectionTitle>
              <div className="space-y-2">
                {notices.map((n, i) => (
                  <Card key={i} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ ...body, fontWeight: 600, color: C.ink }}>{n.title}</p>
                      <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{n.date}</p>
                    </div>
                    <Pill tone={C.teal}>{n.tag}</Pill>
                  </Card>
                ))}
              </div>
            </div>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
              style={{ ...body, fontWeight: 700, background: "#25D366", color: "#fff" }}
            >
              <MessageCircle size={16} /> Message {child.name.split(" ")[0]}'s teacher
            </a>
          </div>
        )}

        {tab === "attendance" && (
          <div className="px-4 pt-4">
            <SectionTitle sub={`Class-wise attendance for ${child.cls}`}>Attendance</SectionTitle>
            <Card className="p-4 mb-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs" style={{ ...body, color: C.inkSoft }}>Attendance percentage</p>
                  <p className="text-4xl" style={{ ...heading, fontWeight: 800, color: attTone }}>{attPct}%</p>
                </div>
                <Pill tone={attTone}>{attPct >= 85 ? "Excellent" : attPct >= 70 ? "Needs attention" : "Low — please talk to the teacher"}</Pill>
              </div>
              <div className="mt-3 h-2 rounded-full" style={{ background: C.sand }}>
                <div className="h-2 rounded-full" style={{ width: `${attPct}%`, background: attTone }} />
              </div>
              <div className="flex justify-between mt-3 text-xs" style={{ ...body, color: C.inkSoft }}>
                {["present", "late", "absent"].map((st) => (
                  <span key={st} className="capitalize">
                    {st}: <b style={{ color: C.ink }}>{getAttendance(childId).filter((r) => r.status === st).length}</b>
                  </span>
                ))}
              </div>
            </Card>
            <AttendanceCalendar records={getAttendance(childId)} />
          </div>
        )}

        {tab === "tasks" && (
          <div className="px-4 pt-4">
            <div className="mb-4"><CommonHomework items={commonHomework} /></div>
            <SectionTitle sub={`Homework & classwork for ${child.cls}`}>Tasks</SectionTitle>
            <div className="space-y-2">
              {(tasksByClass[child.cls] || []).map((t, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{t.title}</p>
                    <Pill tone={C.marigoldDeep}>{t.type}</Pill>
                  </div>
                  <p className="text-xs mt-1" style={{ ...body, color: C.inkSoft }}>{t.subject} · due {t.due}</p>
                  <AttachmentPreview attachment={t.attachment} />
                </Card>
              ))}
              {!tasksByClass[child.cls] && (
                <p className="text-sm" style={{ ...body, color: C.inkSoft }}>No tasks posted yet.</p>
              )}
            </div>
          </div>
        )}

        {tab === "grammar" && (
          <GrammarSection childId={childId} scores={grammarScores} onSaveScore={onSaveGrammarScore} />
        )}

        {tab === "results" && (
          <div className="px-4 pt-4 space-y-4">
            <SectionTitle sub="Term-wise marks and teacher remarks">Results — {child.cls}</SectionTitle>
            {(RESULTS_BY_CLASS[child.cls] || []).map((r, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{r.subject}</p>
                  <p className="text-sm" style={{ ...heading, fontWeight: 700, color: C.leaf }}>{r.marks}/{r.out}</p>
                </div>
                <p className="text-xs mt-0.5" style={{ ...body, color: C.inkSoft }}>{r.term}</p>
                <div className="mt-2 h-1.5 rounded-full" style={{ background: C.sand }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${(r.marks / r.out) * 100}%`, background: C.leaf }} />
                </div>
                <p className="text-xs mt-2 italic" style={{ ...body, color: C.inkSoft }}>"{r.remark}"</p>
              </Card>
            ))}

            {grammarAttempted > 0 && (
              <div>
                <SectionTitle sub="Best score from each grammar test taken">Grammar test scores</SectionTitle>
                <div className="space-y-2">
                  {Object.entries(childGrammar).map(([topicId, s]) => (
                    <Card key={topicId} className="p-3 flex items-center justify-between">
                      <p className="text-sm" style={{ ...body, fontWeight: 600, color: C.ink }}>{topicId.replace(/-/g, " ")}</p>
                      <Pill tone={s.best >= 80 ? C.leaf : s.best >= 50 ? C.marigoldDeep : C.coral}>{s.best}%</Pill>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="px-4 pt-4 space-y-4">
            <Card className="p-4">
              <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{child.name}</p>
              <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{child.cls}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <ShieldCheck size={14} color={child.feeStatus.includes("pending") ? C.coral : C.leaf} />
                <p className="text-xs" style={{ ...body, fontWeight: 600, color: child.feeStatus.includes("pending") ? C.coral : C.leaf }}>
                  Fee status: {child.feeStatus}
                </p>
              </div>
            </Card>

            <div>
              <SectionTitle>Achievement badges</SectionTitle>
              <div className="flex gap-2 flex-wrap">
                {(BADGES[childId] || []).map((b, i) => (
                  <Card key={i} className="px-3 py-2 flex items-center gap-2">
                    <span>{b.icon}</span>
                    <span className="text-xs" style={{ ...body, fontWeight: 600, color: C.ink }}>{b.label}</span>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle sub="Submit directly instead of calling the institute">Leave application</SectionTitle>
              {leaveSent ? (
                <Card className="p-4 flex items-center gap-2">
                  <Check size={16} color={C.leaf} />
                  <p className="text-sm" style={{ ...body, color: C.ink }}>Leave request sent for review.</p>
                </Card>
              ) : leaveOpen ? (
                <Card className="p-4 space-y-2">
                  <textarea
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Reason for leave"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ ...body, border: `1px solid ${C.sand}` }}
                    rows={3}
                  />
                  <button
                    onClick={() => leaveReason && setLeaveSent(true)}
                    className="w-full py-2.5 rounded-xl text-sm"
                    style={{ ...body, fontWeight: 700, background: C.teal, color: "#fff" }}
                  >
                    Submit request
                  </button>
                </Card>
              ) : (
                <button
                  onClick={() => setLeaveOpen(true)}
                  className="w-full py-3 rounded-xl text-sm"
                  style={{ ...body, fontWeight: 700, background: C.sand, color: C.ink }}
                >
                  Apply for leave
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <BottomNav items={items} active={tab} onChange={setTab} />
    </>
  );
}

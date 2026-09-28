import React, { useState } from "react";
import {
  CalendarCheck, Users, ClipboardList, BarChart3, FileText, Bell, Lock,
  MessageCircle, Trash2, ShieldCheck, UserPlus, Sparkles, Copy, ExternalLink, Star, Megaphone,
} from "lucide-react";
import { C, heading, body } from "../data/theme";
import { CLASS_OPTIONS, getAttendance, attendancePercent } from "../data/mockData";
import { GRAMMAR_TOPICS } from "../data/grammarData";
import { Card, Pill, SectionTitle, TopBar } from "./ui";
import { AttachmentField, AttachmentPreview } from "./attachments";

const ALL_PERMISSIONS = { publishTasks: true, manageNotices: true, deleteData: true, manageStudents: true };

function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      await onLogin(pw);
      setError("");
    } catch (err) {
      setError(err.status === 401 || err.status === 429 ? err.message : "Can't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar title="Admin login" subtitle="Maitri Classes staff panel" />
      <div className="px-4 pt-8">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${C.teal}15` }}>
              <Lock size={17} color={C.teal} />
            </div>
            <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>Enter admin password</p>
          </div>
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Password"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ ...body, border: `1px solid ${error ? C.coral : C.sand}` }}
          />
          {error && (
            <p className="text-xs mt-1.5" style={{ ...body, color: C.coral }}>{error}</p>
          )}
          <button
            onClick={submit}
            className="w-full mt-3 py-2.5 rounded-xl text-sm"
            style={{ ...body, fontWeight: 700, background: C.teal, color: "#fff" }}
          >
            {busy ? "Checking…" : "Log in"}
          </button>
        </Card>
      </div>
    </>
  );
}

function copyText(text, onDone) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => onDone(true)).catch(() => onDone(false));
  } else {
    onDone(false);
  }
}

export default function AdminPortal({
  isAdmin, adminReady, onLogin, onChangePassword, addTask,
  tasksByClass, deleteTask,
  notices, addNotice, deleteNotice,
  staff, setStaff,
  groupLinksByClass, setGroupLinksByClass,
  grammarScores,
  dailyTask, setDailyTask,
  roster, setRoster,
  commonHomework, setCommonHomework,
}) {
  const [actingAs, setActingAs] = useState("admin"); // "admin" or a staff id — demo permission switch
  const [section, setSection] = useState("attendance");
  const [cls, setCls] = useState("7th Scholarship");
  const [marks, setMarks] = useState({});
  const [notifiedSet, setNotifiedSet] = useState({}); // { [studentName]: true }
  const [copyMsg, setCopyMsg] = useState("");

  const [newStudent, setNewStudent] = useState({ name: "", cls: "7th Scholarship", parent: "" });
  const [studentAdded, setStudentAdded] = useState(false);
  const [taskForm, setTaskForm] = useState({ subject: "", title: "", due: "", type: "Homework", attachment: null });
  const [taskPosted, setTaskPosted] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: "", tag: "Institute-wide" });
  const [noticePosted, setNoticePosted] = useState(false);
  const [dailyTaskForm, setDailyTaskForm] = useState({ title: "", description: "", attachment: null });
  const [hwForm, setHwForm] = useState({ subject: "", title: "", description: "", due: "", attachment: null });
  const [hwPosted, setHwPosted] = useState(false);
  const [dailyTaskPosted, setDailyTaskPosted] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState(null);

  const [newStaff, setNewStaff] = useState({ name: "", password: "", publishTasks: false, manageNotices: false, deleteData: false, manageStudents: false });
  const [groupLinkDraft, setGroupLinkDraft] = useState("");

  if (!isAdmin) {
    return <AdminLogin onLogin={onLogin} />;
  }
  if (!adminReady) {
    return <p className="text-center text-sm pt-16" style={{ ...body, color: C.inkSoft }}>Loading latest data…</p>;
  }

  const permissions = actingAs === "admin"
    ? ALL_PERMISSIONS
    : (staff.find((s) => s.id === actingAs)?.permissions || {});

  const classRoster = roster.filter((s) => s.cls === cls);
  const classTasks = tasksByClass[cls] || [];

  const sections = [
    { key: "attendance", label: "Attendance", icon: CalendarCheck },
    { key: "students", label: "Students", icon: Users },
    { key: "tasks", label: "Tasks", icon: ClipboardList },
    { key: "common", label: "Common HW", icon: Megaphone },
    { key: "daily", label: "Daily Task", icon: Star },
    { key: "results", label: "Results", icon: BarChart3 },
    { key: "grammar", label: "Grammar", icon: Sparkles },
    { key: "enquiries", label: "Enquiries", icon: FileText },
    { key: "notices", label: "Notices", icon: Bell },
    { key: "team", label: "Team", icon: ShieldCheck },
    { key: "settings", label: "Settings", icon: Lock },
  ];

  function nowTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function setStatus(name, status) {
    setMarks((m) => ({ ...m, [name]: { status, time: nowTime() } }));
  }

  function markAllPresent() {
    const time = nowTime();
    setMarks((m) => {
      const next = { ...m };
      classRoster.forEach((s) => { next[s.name] = { status: "present", time }; });
      return next;
    });
  }

  function whatsappLink(student, time) {
    const text = encodeURIComponent(
      `Dear Parent, ${student.name} is present today at ${time}. - Maitri Classes`
    );
    const digits = (student.parent || "").replace(/\D/g, "");
    return digits
      ? `https://wa.me/91${digits}?text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
  }

  const presentStudents = classRoster.filter((s) => marks[s.name]?.status === "present");
  const groupLink = groupLinksByClass[cls];

  function bulkMessage() {
    const names = presentStudents.map((s) => `• ${s.name}`).join("\n");
    return `Dear Parents of ${cls},\n\nThe following students are present today:\n${names}\n\n— Maitri Classes`;
  }

  function notifyAllViaGroup() {
    if (presentStudents.length === 0) return;
    copyText(bulkMessage(), (ok) => setCopyMsg(ok ? "Message copied — paste and send in the group ✓" : "Couldn't auto-copy — message shown below to copy manually."));
    window.open(groupLink, "_blank", "noreferrer");
  }

  function notifyNextIndividually() {
    const next = presentStudents.find((s) => !notifiedSet[s.name] && s.parent);
    if (!next) return;
    window.open(whatsappLink(next, marks[next.name].time), "_blank", "noreferrer");
    setNotifiedSet((n) => ({ ...n, [next.name]: true }));
  }

  const remainingToNotify = presentStudents.filter((s) => !notifiedSet[s.name] && s.parent).length;

  function addStudent() {
    if (!newStudent.name.trim()) return;
    setRoster((r) => [...r, { id: `s${Date.now()}`, name: newStudent.name.trim(), cls: newStudent.cls, parent: newStudent.parent.trim(), feeStatus: "—" }]);
    setNewStudent({ name: "", cls: newStudent.cls, parent: "" });
    setStudentAdded(true);
    setTimeout(() => setStudentAdded(false), 2000);
  }

  function removeStudent(id) {
    setRoster((r) => r.filter((s) => s.id !== id));
  }

  function postTask() {
    if (!taskForm.title.trim()) return;
    addTask(cls, {
      subject: taskForm.subject.trim() || "General",
      title: taskForm.title.trim(),
      due: taskForm.due.trim() || "Today",
      type: taskForm.type,
      attachment: taskForm.attachment,
    });
    setTaskForm({ subject: "", title: "", due: "", type: "Homework", attachment: null });
    setTaskPosted(true);
    setTimeout(() => setTaskPosted(false), 2000);
  }

  function publishDailyTask() {
    if (!dailyTaskForm.title.trim()) return;
    setDailyTask({
      title: dailyTaskForm.title.trim(),
      description: dailyTaskForm.description.trim(),
      attachment: dailyTaskForm.attachment,
      date: nowTime(),
    });
    setDailyTaskForm({ title: "", description: "", attachment: null });
    setDailyTaskPosted(true);
    setTimeout(() => setDailyTaskPosted(false), 2000);
  }

  function postCommonHomework() {
    if (!hwForm.title.trim()) return;
    setCommonHomework((prev) => [
      {
        id: `h${Date.now()}`,
        subject: hwForm.subject.trim() || "General",
        title: hwForm.title.trim(),
        description: hwForm.description.trim(),
        due: hwForm.due.trim() || "Tomorrow",
        attachment: hwForm.attachment,
      },
      ...prev,
    ]);
    setHwForm({ subject: "", title: "", description: "", due: "", attachment: null });
    setHwPosted(true);
    setTimeout(() => setHwPosted(false), 2000);
  }

  function removeCommonHomework(id) {
    setCommonHomework((prev) => prev.filter((h) => h.id !== id));
  }

  function clearDailyTask() {
    setDailyTask(null);
  }

  function postNotice() {
    if (!noticeForm.title.trim()) return;
    addNotice({ title: noticeForm.title.trim(), date: "Today", tag: noticeForm.tag });
    setNoticeForm({ title: "", tag: "Institute-wide" });
    setNoticePosted(true);
    setTimeout(() => setNoticePosted(false), 2000);
  }

  async function updatePassword() {
    if (!pwForm.next || pwForm.next !== pwForm.confirm) {
      setPwMsg({ ok: false, text: "New passwords don't match." });
      return;
    }
    try {
      await onChangePassword(pwForm.current, pwForm.next);
      setPwForm({ current: "", next: "", confirm: "" });
      setPwMsg({ ok: true, text: "Password updated." });
    } catch (err) {
      setPwMsg({ ok: false, text: err.message });
    }
  }

  function addStaff() {
    if (!newStaff.name.trim() || !newStaff.password.trim()) return;
    setStaff((s) => [...s, {
      id: `st${Date.now()}`,
      name: newStaff.name.trim(),
      password: newStaff.password.trim(),
      permissions: {
        publishTasks: newStaff.publishTasks,
        manageNotices: newStaff.manageNotices,
        deleteData: newStaff.deleteData,
        manageStudents: newStaff.manageStudents,
      },
    }]);
    setNewStaff({ name: "", password: "", publishTasks: false, manageNotices: false, deleteData: false, manageStudents: false });
  }

  function toggleStaffPermission(id, key) {
    setStaff((s) => s.map((st) => st.id === id ? { ...st, permissions: { ...st.permissions, [key]: !st.permissions[key] } } : st));
    setCopyMsg("");
  }

  function removeStaff(id) {
    setStaff((s) => s.filter((st) => st.id !== id));
    if (actingAs === id) setActingAs("admin");
  }

  function saveGroupLink() {
    setGroupLinksByClass((g) => ({ ...g, [cls]: groupLinkDraft.trim() }));
    setGroupLinkDraft("");
  }

  return (
    <>
      <TopBar title="Admin dashboard" subtitle="Maitri Classes staff panel" />

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: C.violetSoft }}>
          <ShieldCheck size={14} color={C.violet} />
          <p className="text-xs flex-1" style={{ ...body, color: C.violet, fontWeight: 600 }}>Acting as</p>
          <select
            value={actingAs}
            onChange={(e) => setActingAs(e.target.value)}
            className="text-xs px-2 py-1 rounded-lg outline-none"
            style={{ ...body, fontWeight: 700, border: `1px solid ${C.violet}55`, color: C.violet, background: "#fff" }}
          >
            <option value="admin">Admin (full access)</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name} (staff)</option>)}
          </select>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4 flex gap-2 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap text-xs"
            style={{
              ...body, fontWeight: 600,
              background: section === s.key ? C.teal : C.sand,
              color: section === s.key ? "#fff" : C.ink,
            }}
          >
            <s.icon size={14} /> {s.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-28">
        {section !== "team" && section !== "daily" && section !== "common" && (
          <div className="mb-3">
            <select
              value={cls}
              onChange={(e) => setCls(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ ...body, border: `1px solid ${C.sand}` }}
            >
              {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {section === "attendance" && (
          <div className="space-y-2">
            <p className="text-xs mb-1" style={{ ...body, color: C.inkSoft }}>
              Mark students, then notify every present student's parent in one go.
            </p>
            {classRoster.length === 0 && (
              <p className="text-sm" style={{ ...body, color: C.inkSoft }}>No students in {cls} yet — add one from the Students tab.</p>
            )}
            {classRoster.length > 0 && (
              <button
                onClick={markAllPresent}
                className="w-full py-2 rounded-xl text-xs mb-1"
                style={{ ...body, fontWeight: 700, background: `${C.leaf}18`, color: C.leaf }}
              >
                Mark entire class present
              </button>
            )}
            {classRoster.map((s) => {
              const mark = marks[s.name];
              return (
                <Card key={s.name} className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ ...body, fontWeight: 600, color: C.ink }}>{s.name}</p>
                    <div className="flex gap-1.5">
                      {["present", "late", "absent"].map((st) => {
                        const isSel = mark?.status === st;
                        const tone = st === "present" ? C.leaf : st === "late" ? C.marigoldDeep : C.coral;
                        return (
                          <button
                            key={st}
                            onClick={() => setStatus(s.name, st)}
                            className="px-2.5 py-1 rounded-lg text-[11px] capitalize"
                            style={{ ...body, fontWeight: 700, background: isSel ? tone : `${tone}15`, color: isSel ? "#fff" : tone }}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })}

            {presentStudents.length > 0 && (
              <Card className="p-4 mt-3" style={{ background: `${C.leaf}0D`, border: `1px solid ${C.leaf}33` }}>
                <p className="text-sm mb-1" style={{ ...body, fontWeight: 700, color: C.ink }}>
                  Notify parents — {presentStudents.length} present
                </p>

                {groupLink ? (
                  <>
                    <p className="text-xs mb-2" style={{ ...body, color: C.inkSoft }}>
                      This copies one attendance message and opens the {cls} parents' WhatsApp group — a single window, one send, every parent in the group sees it.
                    </p>
                    <button
                      onClick={notifyAllViaGroup}
                      className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                      style={{ ...body, fontWeight: 700, background: "#25D366", color: "#fff" }}
                    >
                      <MessageCircle size={15} /> Notify all via {cls} group
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs mb-2" style={{ ...body, color: C.coral }}>
                      No WhatsApp group link saved for {cls} yet. True one-tap bulk sending needs either a saved parents' group link, or the paid WhatsApp Business API with a backend — plain wa.me links only ever open one chat at a time. Add a group link in Settings for the one-tap flow, or send individually below.
                    </p>
                    <button
                      onClick={notifyNextIndividually}
                      disabled={remainingToNotify === 0}
                      className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                      style={{
                        ...body, fontWeight: 700,
                        background: remainingToNotify === 0 ? C.sand : "#25D366",
                        color: remainingToNotify === 0 ? C.inkSoft : "#fff",
                      }}
                    >
                      <MessageCircle size={15} />
                      {remainingToNotify === 0 ? "All notified" : `Notify next parent (${remainingToNotify} left)`}
                    </button>
                  </>
                )}
                {copyMsg && <p className="text-xs mt-2" style={{ ...body, color: C.leaf, fontWeight: 600 }}>{copyMsg}</p>}
              </Card>
            )}
          </div>
        )}

        {section === "students" && (
          <div className="space-y-4">
            {permissions.manageStudents ? (
              <Card className="p-4 space-y-2">
                <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>Add student to {cls}</p>
                <input
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value, cls })}
                  placeholder="Student name"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                />
                <input
                  value={newStudent.parent}
                  onChange={(e) => setNewStudent({ ...newStudent, parent: e.target.value })}
                  placeholder="Parent WhatsApp number (optional)"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                />
                <button
                  onClick={() => addStudent()}
                  className="w-full py-2.5 rounded-xl text-sm"
                  style={{ ...body, fontWeight: 700, background: C.teal, color: "#fff" }}
                >
                  Add student
                </button>
                {studentAdded && (
                  <p className="text-xs" style={{ ...body, color: C.leaf, fontWeight: 600 }}>Student added ✓</p>
                )}
              </Card>
            ) : (
              <Card className="p-3">
                <p className="text-xs" style={{ ...body, color: C.inkSoft }}>You don't have permission to add or remove students. Ask the admin to grant "Manage students" under Team.</p>
              </Card>
            )}

            <div>
              <p className="text-sm mb-2" style={{ ...body, fontWeight: 700, color: C.ink }}>{cls} roster ({classRoster.length})</p>
              <div className="space-y-2">
                {classRoster.map((s) => (
                  <Card key={s.name} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ ...body, color: C.ink }}>{s.name}</p>
                      <p className="text-xs mt-0.5" style={{ ...body, color: C.inkSoft }}>
                        {s.parent ? `Parent: ${s.parent}` : "No parent number on file"}
                      </p>
                      {(() => {
                        const pct = attendancePercent(getAttendance(s.id));
                        return (
                          <p className="text-xs mt-0.5" style={{ ...body, fontWeight: 700, color: pct >= 85 ? C.leaf : pct >= 70 ? C.marigoldDeep : C.coral }}>
                            Attendance: {pct}% this month
                          </p>
                        );
                      })()}
                    </div>
                    {permissions.manageStudents && (
                      <button onClick={() => removeStudent(s.id)} aria-label="Remove student">
                        <Trash2 size={16} color={C.coral} />
                      </button>
                    )}
                  </Card>
                ))}
                {classRoster.length === 0 && (
                  <p className="text-sm" style={{ ...body, color: C.inkSoft }}>No students in this class yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {section === "tasks" && (
          <div className="space-y-4">
            {permissions.publishTasks ? (
              <Card className="p-4 space-y-2">
                <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>Add a task for {cls}</p>
                <p className="text-xs" style={{ ...body, color: C.inkSoft }}>New tasks appear at the top of the class's task feed.</p>
                <input
                  value={taskForm.subject}
                  onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })}
                  placeholder="Subject"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                />
                <input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Title / description"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                />
                <input
                  value={taskForm.due}
                  onChange={(e) => setTaskForm({ ...taskForm, due: e.target.value })}
                  placeholder="Due date (e.g. Today, 20 Sep)"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                />
                <select
                  value={taskForm.type}
                  onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                >
                  <option>Homework</option>
                  <option>Classwork</option>
                  <option>Assignment</option>
                </select>
                <AttachmentField
                  value={taskForm.attachment}
                  onChange={(a) => setTaskForm({ ...taskForm, attachment: a })}
                />
                <button
                  onClick={postTask}
                  className="w-full py-2.5 rounded-xl text-sm"
                  style={{ ...body, fontWeight: 700, background: C.teal, color: "#fff" }}
                >
                  Post task
                </button>
                {taskPosted && (
                  <p className="text-xs" style={{ ...body, color: C.leaf, fontWeight: 600 }}>Task posted to {cls} ✓</p>
                )}
              </Card>
            ) : (
              <Card className="p-3">
                <p className="text-xs" style={{ ...body, color: C.inkSoft }}>You don't have permission to publish tasks. Ask the admin to grant "Publish tasks" under Team.</p>
              </Card>
            )}

            <div>
              <p className="text-sm mb-2" style={{ ...body, fontWeight: 700, color: C.ink }}>{cls} task feed ({classTasks.length})</p>
              <div className="space-y-2">
                {classTasks.map((t, i) => (
                  <Card key={i} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{t.title}</p>
                      <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{t.subject} · due {t.due} · {t.type}</p>
                      <AttachmentPreview attachment={t.attachment} />
                    </div>
                    {permissions.deleteData && (
                      <button onClick={() => deleteTask(cls, i)} aria-label="Delete task">
                        <Trash2 size={16} color={C.coral} />
                      </button>
                    )}
                  </Card>
                ))}
                {classTasks.length === 0 && (
                  <p className="text-sm" style={{ ...body, color: C.inkSoft }}>No tasks posted yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {section === "common" && (
          <div className="space-y-4">
            <SectionTitle sub="Sent to every class — highlighted at the top of the public site and every parent's screen">Common homework</SectionTitle>
            {permissions.publishTasks ? (
              <Card className="p-4 space-y-2">
                <input
                  value={hwForm.subject}
                  onChange={(e) => setHwForm({ ...hwForm, subject: e.target.value })}
                  placeholder="Subject"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                />
                <input
                  value={hwForm.title}
                  onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })}
                  placeholder="Homework title"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                />
                <textarea
                  value={hwForm.description}
                  onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })}
                  placeholder="Instructions (optional)"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                />
                <input
                  value={hwForm.due}
                  onChange={(e) => setHwForm({ ...hwForm, due: e.target.value })}
                  placeholder="Due (e.g. Tomorrow, 30 Sep)"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                />
                <AttachmentField value={hwForm.attachment} onChange={(a) => setHwForm({ ...hwForm, attachment: a })} />
                <button
                  onClick={postCommonHomework}
                  className="w-full py-2.5 rounded-xl text-sm"
                  style={{ ...body, fontWeight: 700, background: C.coral, color: "#fff" }}
                >
                  Send to all students
                </button>
                {hwPosted && (
                  <p className="text-xs" style={{ ...body, color: C.leaf, fontWeight: 600 }}>Sent to all students ✓</p>
                )}
              </Card>
            ) : (
              <Card className="p-3">
                <p className="text-xs" style={{ ...body, color: C.inkSoft }}>You don't have permission to publish tasks. Ask the admin to grant "Publish tasks" under Team.</p>
              </Card>
            )}

            <div>
              <p className="text-sm mb-2" style={{ ...body, fontWeight: 700, color: C.ink }}>Live for all students ({commonHomework.length})</p>
              <div className="space-y-2">
                {commonHomework.map((h) => (
                  <Card key={h.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{h.title}</p>
                        <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{h.subject} · due {h.due}</p>
                        <AttachmentPreview attachment={h.attachment} />
                      </div>
                      {permissions.deleteData && (
                        <button onClick={() => removeCommonHomework(h.id)} aria-label="Delete common homework">
                          <Trash2 size={16} color={C.coral} />
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
                {commonHomework.length === 0 && (
                  <p className="text-sm" style={{ ...body, color: C.inkSoft }}>Nothing posted for all students right now.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {section === "daily" && (
          <div className="space-y-4">
            <SectionTitle sub="One task for everyone — shows on every parent's home screen and on the public site">Daily task</SectionTitle>
            {permissions.publishTasks ? (
              <Card className="p-4 space-y-2">
                <input
                  value={dailyTaskForm.title}
                  onChange={(e) => setDailyTaskForm({ ...dailyTaskForm, title: e.target.value })}
                  placeholder="Today's task title"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                />
                <textarea
                  value={dailyTaskForm.description}
                  onChange={(e) => setDailyTaskForm({ ...dailyTaskForm, description: e.target.value })}
                  placeholder="Instructions (optional)"
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                />
                <AttachmentField
                  value={dailyTaskForm.attachment}
                  onChange={(a) => setDailyTaskForm({ ...dailyTaskForm, attachment: a })}
                />
                <button
                  onClick={publishDailyTask}
                  className="w-full py-2.5 rounded-xl text-sm"
                  style={{ ...body, fontWeight: 700, background: C.teal, color: "#fff" }}
                >
                  Publish daily task
                </button>
                {dailyTaskPosted && (
                  <p className="text-xs" style={{ ...body, color: C.leaf, fontWeight: 600 }}>Published to everyone ✓</p>
                )}
              </Card>
            ) : (
              <Card className="p-3">
                <p className="text-xs" style={{ ...body, color: C.inkSoft }}>You don't have permission to publish tasks. Ask the admin to grant "Publish tasks" under Team.</p>
              </Card>
            )}

            <div>
              <p className="text-sm mb-2" style={{ ...body, fontWeight: 700, color: C.ink }}>Currently live</p>
              {dailyTask ? (
                <Card className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{dailyTask.title}</p>
                      {dailyTask.description && (
                        <p className="text-xs mt-0.5" style={{ ...body, color: C.inkSoft }}>{dailyTask.description}</p>
                      )}
                      <AttachmentPreview attachment={dailyTask.attachment} />
                    </div>
                    {permissions.deleteData && (
                      <button onClick={clearDailyTask} aria-label="Remove daily task">
                        <Trash2 size={16} color={C.coral} />
                      </button>
                    )}
                  </div>
                </Card>
              ) : (
                <p className="text-sm" style={{ ...body, color: C.inkSoft }}>No daily task is live right now.</p>
              )}
            </div>
          </div>
        )}

        {section === "results" && (
          <Card className="p-4 space-y-2">
            <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>Enter marks — {cls}</p>
            {classRoster.slice(0, 2).map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <p className="text-xs flex-1" style={{ ...body, color: C.ink }}>{s.name}</p>
                <input placeholder="Marks" className="w-20 px-2 py-1.5 rounded-lg text-sm outline-none" style={{ ...body, border: `1px solid ${C.sand}` }} />
              </div>
            ))}
            {classRoster.length === 0 && (
              <p className="text-sm" style={{ ...body, color: C.inkSoft }}>No students in this class yet.</p>
            )}
            <textarea placeholder="Remark (optional)" rows={2} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ ...body, border: `1px solid ${C.sand}` }} />
            <button className="w-full py-2.5 rounded-xl text-sm" style={{ ...body, fontWeight: 700, background: C.teal, color: "#fff" }}>
              Save results
            </button>
          </Card>
        )}

        {section === "grammar" && (
          <div className="space-y-4">
            <SectionTitle sub="Best score each child has reached per topic">Grammar test leaderboard</SectionTitle>
            {roster.map((child) => {
              const scores = grammarScores[child.id] || {};
              const attempted = Object.keys(scores).length;
              return (
                <Card key={child.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{child.name}</p>
                      <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{child.cls}</p>
                    </div>
                    <Pill tone={C.violet}>{attempted}/{GRAMMAR_TOPICS.length} topics</Pill>
                  </div>
                  {attempted === 0 ? (
                    <p className="text-xs" style={{ ...body, color: C.inkSoft }}>No grammar tests attempted yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(scores).map(([topicId, s]) => {
                        const topic = GRAMMAR_TOPICS.find((t) => t.id === topicId);
                        return (
                          <Pill key={topicId} tone={s.best >= 80 ? C.leaf : s.best >= 50 ? C.marigoldDeep : C.coral}>
                            {topic?.title || topicId}: {s.best}%
                          </Pill>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {section === "enquiries" && (
          <div className="space-y-2">
            <Card className="p-3">
              <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>Priya Sawant</p>
              <p className="text-xs" style={{ ...body, color: C.inkSoft }}>4th Scholarship · 98xxxxxx21</p>
            </Card>
            <Card className="p-3">
              <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>Nikhil Rao</p>
              <p className="text-xs" style={{ ...body, color: C.inkSoft }}>9th · 97xxxxxx08</p>
            </Card>
          </div>
        )}

        {section === "notices" && (
          <div className="space-y-4">
            {permissions.manageNotices ? (
              <Card className="p-4 space-y-2">
                <input
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="Notice title"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                />
                <select
                  value={noticeForm.tag}
                  onChange={(e) => setNoticeForm({ ...noticeForm, tag: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ ...body, border: `1px solid ${C.sand}` }}
                >
                  <option>Institute-wide</option>
                  <option>Class-specific</option>
                  <option>Exam</option>
                  <option>Holiday</option>
                </select>
                <button onClick={postNotice} className="w-full py-2.5 rounded-xl text-sm" style={{ ...body, fontWeight: 700, background: C.teal, color: "#fff" }}>
                  Post notice
                </button>
                {noticePosted && (
                  <p className="text-xs" style={{ ...body, color: C.leaf, fontWeight: 600 }}>Notice posted ✓</p>
                )}
              </Card>
            ) : (
              <Card className="p-3">
                <p className="text-xs" style={{ ...body, color: C.inkSoft }}>You don't have permission to post notices. Ask the admin to grant "Manage notices" under Team.</p>
              </Card>
            )}

            <div className="space-y-2">
              {notices.map((n, i) => (
                <Card key={i} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{ ...body, fontWeight: 600, color: C.ink }}>{n.title}</p>
                    <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{n.date} · {n.tag}</p>
                  </div>
                  {permissions.deleteData && (
                    <button onClick={() => deleteNotice(i)} aria-label="Delete notice">
                      <Trash2 size={16} color={C.coral} />
                    </button>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {section === "team" && (
          <div className="space-y-4">
            <SectionTitle sub="Give staff their own login and choose what they're allowed to do">Staff & authority</SectionTitle>

            {actingAs !== "admin" ? (
              <Card className="p-3">
                <p className="text-xs" style={{ ...body, color: C.inkSoft }}>Only the main admin account can manage staff. Switch "Acting as" back to Admin above.</p>
              </Card>
            ) : (
              <>
                <Card className="p-4 space-y-2">
                  <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>Add a staff account</p>
                  <input
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    placeholder="Staff name"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ ...body, border: `1px solid ${C.sand}` }}
                  />
                  <input
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    placeholder="Login password"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ ...body, border: `1px solid ${C.sand}` }}
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {[
                      ["publishTasks", "Publish tasks"],
                      ["manageNotices", "Manage notices"],
                      ["deleteData", "Delete records"],
                      ["manageStudents", "Manage students"],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-xs" style={{ ...body, color: C.ink }}>
                        <input
                          type="checkbox"
                          checked={newStaff[key]}
                          onChange={(e) => setNewStaff({ ...newStaff, [key]: e.target.checked })}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={addStaff}
                    className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                    style={{ ...body, fontWeight: 700, background: C.teal, color: "#fff" }}
                  >
                    <UserPlus size={15} /> Add staff member
                  </button>
                </Card>

                <div className="space-y-2">
                  {staff.map((s) => (
                    <Card key={s.id} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{s.name}</p>
                        <button onClick={() => removeStaff(s.id)} aria-label="Remove staff">
                          <Trash2 size={16} color={C.coral} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ["publishTasks", "Publish tasks"],
                          ["manageNotices", "Manage notices"],
                          ["deleteData", "Delete records"],
                          ["manageStudents", "Manage students"],
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 text-xs" style={{ ...body, color: C.ink }}>
                            <input
                              type="checkbox"
                              checked={!!s.permissions[key]}
                              onChange={() => toggleStaffPermission(s.id, key)}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </Card>
                  ))}
                  {staff.length === 0 && (
                    <p className="text-sm" style={{ ...body, color: C.inkSoft }}>No staff accounts yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {section === "settings" && (
          <div className="space-y-4">
            <Card className="p-4 space-y-2">
              <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>Change admin password</p>
              <input
                type="password"
                value={pwForm.current}
                onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                placeholder="Current password"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ ...body, border: `1px solid ${C.sand}` }}
              />
              <input
                type="password"
                value={pwForm.next}
                onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                placeholder="New password"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ ...body, border: `1px solid ${C.sand}` }}
              />
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ ...body, border: `1px solid ${C.sand}` }}
              />
              <button
                onClick={updatePassword}
                className="w-full py-2.5 rounded-xl text-sm"
                style={{ ...body, fontWeight: 700, background: C.teal, color: "#fff" }}
              >
                Update password
              </button>
              {pwMsg && (
                <p className="text-xs" style={{ ...body, fontWeight: 600, color: pwMsg.ok ? C.leaf : C.coral }}>
                  {pwMsg.text}
                </p>
              )}
            </Card>

            <Card className="p-4 space-y-2">
              <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>WhatsApp parent group — {cls}</p>
              <p className="text-xs" style={{ ...body, color: C.inkSoft }}>
                Paste the invite link of the WhatsApp group that already has this class's parents in it (Group info → Invite via link). Saving it here is what makes "notify all in one tap" possible on the Attendance tab.
              </p>
              {groupLink && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: C.cream }}>
                  <ExternalLink size={13} color={C.leaf} />
                  <p className="text-xs flex-1 truncate" style={{ ...body, color: C.leaf }}>{groupLink}</p>
                </div>
              )}
              <input
                value={groupLinkDraft}
                onChange={(e) => setGroupLinkDraft(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{ ...body, border: `1px solid ${C.sand}` }}
              />
              <button
                onClick={saveGroupLink}
                className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                style={{ ...body, fontWeight: 700, background: C.sand, color: C.ink }}
              >
                <Copy size={14} /> Save group link for {cls}
              </button>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

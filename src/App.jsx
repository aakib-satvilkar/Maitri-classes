import React, { useState, useEffect } from "react";
import { fetchState, saveState, login, logout, changePassword, postGrammarScore, getToken } from "./utils/api";
import ErrorBoundary from "./components/ErrorBoundary";
import { C, body } from "./data/theme";
import { INITIAL_TASKS_BY_CLASS, NOTICES, INITIAL_STAFF, INITIAL_ROSTER } from "./data/mockData";
import { RoleSwitcher, WhatsAppButton } from "./components/ui";
import PublicSite from "./components/PublicSite";
import ParentPortal from "./components/ParentPortal";
import AdminPortal from "./components/AdminPortal";

export default function MaitriClassesApp() {
  const [role, setRole] = useState("public");
  const [isAdmin, setIsAdmin] = useState(!!getToken());

  const [tasksByClass, setTasksByClass] = useState(INITIAL_TASKS_BY_CLASS);
  const [notices, setNotices] = useState(NOTICES);
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [groupLinksByClass, setGroupLinksByClass] = useState({});
  const [dailyTask, setDailyTask] = useState({
    title: "Write 5 sentences using today's word: 'brave'",
    description: "Underline the adjective in each sentence and share with your teacher tomorrow.",
    attachment: null,
    date: "Today",
  });
  const [commonHomework, setCommonHomework] = useState([
    { id: "h1", subject: "English", title: "Read Chapter 3 and write 5 new words", description: "Applies to every class.", due: "Tomorrow", attachment: null },
  ]);
  const [students, setStudents] = useState(INITIAL_ROSTER);
  const [grammarScores, setGrammarScores] = useState({}); // { [childId]: { [topicId]: { best, attempts } } }

  // ---- persistence: everything is stored on the server (survives refresh, devices, time) ----
  const [hydrated, setHydrated] = useState(false);
  const [adminReady, setAdminReady] = useState(false); // admin has loaded the latest server data
  const [saveFailed, setSaveFailed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  function applyServerState(saved, { includeAdminData = true } = {}) {
    if (!saved) return;
    if (includeAdminData) {
      if (saved.tasksByClass) setTasksByClass(saved.tasksByClass);
      if (saved.notices) setNotices(saved.notices);
      if (saved.staff) setStaff(saved.staff);
      if (saved.groupLinksByClass) setGroupLinksByClass(saved.groupLinksByClass);
      if ("dailyTask" in saved) setDailyTask(saved.dailyTask);
      if (saved.commonHomework) setCommonHomework(saved.commonHomework);
      if (saved.students) setStudents(saved.students);
    }
    if (saved.grammarScores) setGrammarScores(saved.grammarScores);
  }

  // initial load (+ re-load when admin logs in, so edits never start from stale data)
  useEffect(() => {
    let cancelled = false;
    setAdminReady(false);
    fetchState()
      .then((saved) => {
        if (cancelled) return;
        applyServerState(saved);
        setLoadFailed(false);
        setHydrated(true);
        if (isAdmin) setAdminReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadFailed(true);
        setHydrated(true); // show the app with defaults, but never save over server data
      });
    return () => { cancelled = true; };
  }, [isAdmin]);

  // parents/public: pick up new admin changes every 30s
  useEffect(() => {
    if (isAdmin) return undefined;
    const id = setInterval(() => {
      fetchState().then((saved) => { applyServerState(saved); setLoadFailed(false); }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [isAdmin]);

  // admin: save every change to the server
  useEffect(() => {
    if (!isAdmin || !adminReady) return undefined;
    const t = setTimeout(() => {
      saveState({ tasksByClass, notices, staff, groupLinksByClass, dailyTask, commonHomework, students })
        .then(() => setSaveFailed(false))
        .catch((err) => {
          setSaveFailed(true);
          if (err.status === 401) setIsAdmin(false);
        });
    }, 400);
    return () => clearTimeout(t);
  }, [isAdmin, adminReady, tasksByClass, notices, staff, groupLinksByClass, dailyTask, commonHomework, students]);

  async function handleAdminLogin(password) {
    await login(password);
    setIsAdmin(true);
  }
  function handleAdminLogout() {
    logout();
    setIsAdmin(false);
  }

  function addTask(cls, task) {
    setTasksByClass((prev) => ({
      ...prev,
      [cls]: [task, ...(prev[cls] || [])],
    }));
  }

  function deleteTask(cls, index) {
    setTasksByClass((prev) => ({
      ...prev,
      [cls]: (prev[cls] || []).filter((_, i) => i !== index),
    }));
  }

  function addNotice(notice) {
    setNotices((prev) => [notice, ...prev]);
  }

  function deleteNotice(index) {
    setNotices((prev) => prev.filter((_, i) => i !== index));
  }

  function saveGrammarScore(childId, topicId, score) {
    postGrammarScore(childId, topicId, score)
      .then((r) => r.grammarScores && setGrammarScores(r.grammarScores))
      .catch(() => {});
    setGrammarScores((prev) => {
      const childPrev = prev[childId] || {};
      const topicPrev = childPrev[topicId] || { best: 0, attempts: 0 };
      return {
        ...prev,
        [childId]: {
          ...childPrev,
          [topicId]: {
            best: Math.max(topicPrev.best, score),
            attempts: topicPrev.attempts + 1,
          },
        },
      };
    });
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.cream, ...body, color: C.inkSoft }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-md mx-auto relative" style={{ background: C.cream, ...body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {(saveFailed || loadFailed) && (
        <p className="text-center text-xs py-1.5" style={{ ...body, background: C.coral, color: "#fff", fontWeight: 600 }}>
          {saveFailed
            ? "Couldn't save to the server — check your connection. Changes are not saved yet."
            : "Can't reach the server — showing offline data. Refresh when you're back online."}
        </p>
      )}
      <RoleSwitcher role={role} setRole={setRole} />

      <ErrorBoundary key={role}>
      {role === "public" && <PublicSite dailyTask={dailyTask} commonHomework={commonHomework} />}

      {role === "parent" && (
        <ParentPortal
          tasksByClass={tasksByClass}
          notices={notices}
          grammarScores={grammarScores}
          onSaveGrammarScore={saveGrammarScore}
          dailyTask={dailyTask}
          students={students}
          commonHomework={commonHomework}
        />
      )}

      {role === "admin" && (
        <AdminPortal
          isAdmin={isAdmin}
          adminReady={adminReady}
          onLogin={handleAdminLogin}
          onLogout={handleAdminLogout}
          onChangePassword={changePassword}
          addTask={addTask}
          tasksByClass={tasksByClass}
          deleteTask={deleteTask}
          notices={notices}
          addNotice={addNotice}
          deleteNotice={deleteNotice}
          staff={staff}
          setStaff={setStaff}
          groupLinksByClass={groupLinksByClass}
          setGroupLinksByClass={setGroupLinksByClass}
          grammarScores={grammarScores}
          dailyTask={dailyTask}
          setDailyTask={setDailyTask}
          roster={students}
          setRoster={setStudents}
          commonHomework={commonHomework}
          setCommonHomework={setCommonHomework}
        />
      )}

      </ErrorBoundary>

      <WhatsAppButton />
    </div>
  );
}

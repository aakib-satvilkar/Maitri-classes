import { C } from "./theme";

/* ---------------- Mock data ---------------- */

export const BATCH_GROUPS = [
  {
    label: "Nursery – 10th (Regular)",
    tint: C.leaf,
    batches: [
      { name: "Nursery – 2nd", subjects: "Foundation, Rhymes, Numbers", timing: "9:00 – 11:00 AM" },
      { name: "3rd – 5th", subjects: "Maths, English, EVS", timing: "3:00 – 5:00 PM" },
      { name: "6th – 8th", subjects: "Maths, Science, English, Social Studies", timing: "4:00 – 6:30 PM" },
      { name: "9th – 10th", subjects: "Maths, Science, English, Board Prep", timing: "5:00 – 8:00 PM" },
    ],
  },
  {
    label: "3rd Manthan Batch",
    tint: C.marigold,
    batches: [
      { name: "3rd Manthan", subjects: "Reasoning, Maths Olympiad, English", timing: "Sat – Sun, 10:00 AM – 12:00 PM" },
    ],
  },
  {
    label: "Scholarship Batches",
    tint: C.coral,
    batches: [
      { name: "4th Scholarship", subjects: "Maths, Intelligence Test, Marathi/English", timing: "Mon/Wed/Fri, 6:00 – 7:30 PM" },
      { name: "7th Scholarship", subjects: "Maths, Intelligence Test, Marathi/English", timing: "Tue/Thu/Sat, 6:00 – 7:30 PM" },
    ],
  },
];

export const CLASS_OPTIONS = [
  "Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "3rd Manthan", "4th",
  "4th Scholarship", "5th", "6th", "7th", "7th Scholarship", "8th", "9th", "10th",
];

export const TOPPERS = [
  { name: "Sanika Patil", batch: "7th Scholarship", score: "98.4%" },
  { name: "Om Deshmukh", batch: "10th", score: "96.8%" },
  { name: "Ira Kulkarni", batch: "4th Scholarship", score: "97.1%" },
];

export const NOTICES = [
  { title: "Scholarship exam registration open", date: "18 Sep", tag: "Scholarship" },
  { title: "Ganesh Chaturthi holiday, 25–27 Sep", date: "20 Sep", tag: "Holiday" },
  { title: "Unit test 2 timetable released", date: "22 Sep", tag: "Exam" },
];

export const CHILDREN = [
  { id: "s1", name: "Aarav Shinde", cls: "7th Scholarship", feeStatus: "Paid till Aug" },
  { id: "s2", name: "Myra Shinde", cls: "4th", feeStatus: "₹1,200 pending" },
];

export function buildMonthAttendance(seed) {
  const days = 30;
  const arr = [];
  for (let d = 1; d <= days; d++) {
    const r = (d * seed) % 10;
    let status = "present";
    if (r === 0) status = "absent";
    else if (r === 3) status = "late";
    arr.push({ day: d, status });
  }
  return arr;
}

export function attendancePercent(records) {
  if (!records || records.length === 0) return 0;
  const attended = records.filter((r) => r.status === "present" || r.status === "late").length;
  return Math.round((attended / records.length) * 100);
}

export const ATTENDANCE = {
  s1: buildMonthAttendance(3),
  s2: buildMonthAttendance(5),
};

export const INITIAL_TASKS_BY_CLASS = {
  "7th Scholarship": [
    { subject: "Maths", title: "Practice set 14 — Ratio & Proportion", due: "Today", type: "Homework" },
    { subject: "Intelligence Test", title: "Pattern completion worksheet", due: "Tomorrow", type: "Classwork" },
  ],
  "4th": [
    { subject: "English", title: "Chapter 4 — new words + sentences", due: "Today", type: "Homework" },
    { subject: "Maths", title: "Tables 12–15 revision", due: "20 Sep", type: "Assignment" },
  ],
};

export const RESULTS_BY_CLASS = {
  "7th Scholarship": [
    { term: "Unit Test 1", subject: "Maths", marks: 46, out: 50, remark: "Excellent grasp of ratio concepts." },
    { term: "Unit Test 1", subject: "Intelligence Test", marks: 41, out: 50, remark: "Work on figure-series speed." },
  ],
  "4th": [
    { term: "Unit Test 1", subject: "English", marks: 22, out: 25, remark: "Neat handwriting, good vocabulary." },
    { term: "Unit Test 1", subject: "Maths", marks: 20, out: 25, remark: "Revise multiplication tables." },
  ],
};

export const BADGES = {
  s1: [{ label: "100% Attendance — Aug", icon: "🏅" }, { label: "Batch Topper", icon: "🏆" }],
  s2: [{ label: "Most Improved", icon: "⭐" }],
};

/* ---------------- New: admin roster w/ parent numbers ---------------- */

export const INITIAL_ROSTER = [
  { id: "s1", name: "Aarav Shinde", cls: "7th Scholarship", parent: "9370298551", feeStatus: "Paid till Aug" },
  { id: "s2", name: "Myra Shinde", cls: "4th", parent: "9370298551", feeStatus: "₹1,200 pending" },
  { id: "s3", name: "Sanika Patil", cls: "7th Scholarship", parent: "9822011223", feeStatus: "Paid till Aug" },
  { id: "s4", name: "Rohan Jadhav", cls: "7th Scholarship", parent: "", feeStatus: "Paid till Aug" },
  { id: "s5", name: "Ira Kulkarni", cls: "4th Scholarship", parent: "", feeStatus: "Paid till Aug" },
];

/* Attendance for any student: seeded demo history, generated for new ones */
export function getAttendance(id) {
  if (ATTENDANCE[id]) return ATTENDANCE[id];
  let seed = 0;
  for (const ch of String(id)) seed += ch.charCodeAt(0);
  return buildMonthAttendance((seed % 7) + 2);
}

/* ---------------- New: staff / authority accounts ---------------- */

export const INITIAL_STAFF = [
  {
    id: "st1",
    name: "Priya Deshmukh",
    password: "priya123",
    permissions: { publishTasks: true, manageNotices: true, deleteData: false, manageStudents: false },
  },
];

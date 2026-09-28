import React, { useState } from "react";
import {
  Tag, Zap, Palette, Wind, TrendingUp, Clock, Puzzle, MapPinned,
  ChevronRight, ChevronLeft, Check, X, Award, RotateCcw, BookOpen,
} from "lucide-react";
import { C, heading, body } from "../data/theme";
import { GRAMMAR_TOPICS } from "../data/grammarData";
import { Card, Pill, SectionTitle } from "./ui";

const ICONS = { Tag, Zap, Palette, Wind, TrendingUp, Clock, Puzzle, MapPinned };

/* ---------------- Quiz engine ---------------- */

function Quiz({ topic, onFinish, onExit }) {
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);

  const q = topic.quiz[i];
  const isLast = i === topic.quiz.length - 1;

  function pick(idx) {
    if (selected !== null) return;
    setSelected(idx);
  }

  function next() {
    const correct = selected === q.correct;
    const nextAnswers = [...answers, correct];
    if (isLast) {
      const score = Math.round((nextAnswers.filter(Boolean).length / topic.quiz.length) * 100);
      onFinish(score);
      return;
    }
    setAnswers(nextAnswers);
    setSelected(null);
    setI(i + 1);
  }

  return (
    <div className="px-4 pt-4 pb-28">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onExit} className="flex items-center gap-1 text-xs" style={{ ...body, color: C.inkSoft, fontWeight: 600 }}>
          <ChevronLeft size={15} /> Exit test
        </button>
        <p className="text-xs" style={{ ...body, color: C.inkSoft, fontWeight: 600 }}>
          Question {i + 1} of {topic.quiz.length}
        </p>
      </div>

      <div className="h-1.5 rounded-full mb-4" style={{ background: C.sand }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${((i + (selected !== null ? 1 : 0)) / topic.quiz.length) * 100}%`, background: C.violet }}
        />
      </div>

      <Card className="p-4">
        <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{q.q}</p>
        <div className="mt-3 space-y-2">
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.correct;
            const isPicked = idx === selected;
            let bg = C.cream, border = C.sand, color = C.ink;
            if (selected !== null) {
              if (isCorrect) { bg = `${C.leaf}20`; border = C.leaf; color = C.leaf; }
              else if (isPicked) { bg = `${C.coral}18`; border = C.coral; color = C.coral; }
            }
            return (
              <button
                key={idx}
                onClick={() => pick(idx)}
                disabled={selected !== null}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between"
                style={{ ...body, fontWeight: 600, background: bg, border: `1.5px solid ${border}`, color }}
              >
                {opt}
                {selected !== null && isCorrect && <Check size={16} color={C.leaf} />}
                {selected !== null && isPicked && !isCorrect && <X size={16} color={C.coral} />}
              </button>
            );
          })}
        </div>
        {selected !== null && (
          <div className="mt-3 p-3 rounded-xl" style={{ background: C.violetSoft }}>
            <p className="text-xs" style={{ ...body, color: C.violet, fontWeight: 600 }}>{q.explain}</p>
          </div>
        )}
      </Card>

      <button
        onClick={next}
        disabled={selected === null}
        className="w-full mt-4 py-3 rounded-xl text-sm"
        style={{
          ...body, fontWeight: 700,
          background: selected === null ? C.sand : C.teal,
          color: selected === null ? C.inkSoft : "#fff",
        }}
      >
        {isLast ? "Finish test" : "Next question"}
      </button>
    </div>
  );
}

function QuizResult({ topic, score, onRetry, onExit }) {
  const tone = score >= 80 ? C.leaf : score >= 50 ? C.marigoldDeep : C.coral;
  const msg = score >= 80 ? "Excellent work!" : score >= 50 ? "Good effort — a bit more practice!" : "Let's revise this topic again.";
  return (
    <div className="px-4 pt-6 pb-28">
      <Card className="p-6 text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: `${tone}18` }}>
          <Award size={28} color={tone} />
        </div>
        <p className="text-3xl mt-3" style={{ ...heading, fontWeight: 800, color: tone }}>{score}%</p>
        <p className="text-sm mt-1" style={{ ...body, fontWeight: 700, color: C.ink }}>{msg}</p>
        <p className="text-xs mt-1" style={{ ...body, color: C.inkSoft }}>{topic.title} test result</p>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5"
            style={{ ...body, fontWeight: 700, background: C.sand, color: C.ink }}
          >
            <RotateCcw size={14} /> Retry
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ ...body, fontWeight: 700, background: C.teal, color: "#fff" }}
          >
            Back to topics
          </button>
        </div>
      </Card>
    </div>
  );
}

function Lesson({ topic, onStart, onExit, best }) {
  const Icon = ICONS[topic.icon] || BookOpen;
  return (
    <div className="px-4 pt-4 pb-28">
      <button onClick={onExit} className="flex items-center gap-1 text-xs mb-3" style={{ ...body, color: C.inkSoft, fontWeight: 600 }}>
        <ChevronLeft size={15} /> All grammar topics
      </button>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: C.violetSoft }}>
            <Icon size={20} color={C.violet} />
          </div>
          <div>
            <p className="text-base" style={{ ...heading, fontWeight: 700, color: C.ink }}>{topic.title}</p>
            <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{topic.tagline}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {topic.points.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: C.violet }} />
              <p className="text-sm" style={{ ...body, color: C.ink }}>{p}</p>
            </div>
          ))}
        </div>
      </Card>

      {best != null && (
        <div className="mt-3 flex items-center gap-2 px-1">
          <Award size={14} color={C.marigoldDeep} />
          <p className="text-xs" style={{ ...body, color: C.inkSoft }}>Best score so far: <b style={{ color: C.ink }}>{best}%</b></p>
        </div>
      )}

      <button
        onClick={onStart}
        className="w-full mt-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
        style={{ ...body, fontWeight: 700, background: C.violet, color: "#fff" }}
      >
        {best != null ? "Retake test" : "Take the test"} <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ---------------- Root grammar section ---------------- */

export default function GrammarSection({ childId, scores, onSaveScore }) {
  const [view, setView] = useState("list"); // list | lesson | quiz | result
  const [topicId, setTopicId] = useState(null);
  const [lastScore, setLastScore] = useState(null);

  const topic = GRAMMAR_TOPICS.find((t) => t.id === topicId);
  const childScores = scores[childId] || {};

  function openTopic(id) {
    setTopicId(id);
    setView("lesson");
  }

  function finishQuiz(score) {
    onSaveScore(childId, topicId, score);
    setLastScore(score);
    setView("result");
  }

  if (view === "lesson" && topic) {
    return (
      <Lesson
        topic={topic}
        best={childScores[topicId]?.best}
        onStart={() => setView("quiz")}
        onExit={() => setView("list")}
      />
    );
  }

  if (view === "quiz" && topic) {
    return <Quiz topic={topic} onFinish={finishQuiz} onExit={() => setView("lesson")} />;
  }

  if (view === "result" && topic) {
    return (
      <QuizResult
        topic={topic}
        score={lastScore}
        onRetry={() => setView("quiz")}
        onExit={() => setView("list")}
      />
    );
  }

  const attempted = Object.keys(childScores).length;

  return (
    <div className="px-4 pt-4 pb-28">
      <SectionTitle sub="Learn a topic, then test yourself — scores are saved to your progress">English Grammar</SectionTitle>

      <Card className="p-3 mb-4 flex items-center justify-between" style={{ background: C.violetSoft, border: "none" }}>
        <p className="text-xs" style={{ ...body, color: C.violet, fontWeight: 700 }}>
          {attempted}/{GRAMMAR_TOPICS.length} topics attempted
        </p>
        <div className="w-24 h-1.5 rounded-full" style={{ background: "#fff" }}>
          <div className="h-1.5 rounded-full" style={{ width: `${(attempted / GRAMMAR_TOPICS.length) * 100}%`, background: C.violet }} />
        </div>
      </Card>

      <div className="space-y-2">
        {GRAMMAR_TOPICS.map((t) => {
          const Icon = ICONS[t.icon] || BookOpen;
          const best = childScores[t.id]?.best;
          return (
            <Card key={t.id} className="p-3 flex items-center gap-3" style={{ cursor: "pointer" }}>
              <button onClick={() => openTopic(t.id)} className="flex items-center gap-3 flex-1 text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: C.violetSoft }}>
                  <Icon size={17} color={C.violet} />
                </div>
                <div className="flex-1">
                  <p className="text-sm" style={{ ...body, fontWeight: 700, color: C.ink }}>{t.title}</p>
                  <p className="text-xs" style={{ ...body, color: C.inkSoft }}>{t.level}</p>
                </div>
                {best != null ? (
                  <Pill tone={best >= 80 ? C.leaf : best >= 50 ? C.marigoldDeep : C.coral}>{best}%</Pill>
                ) : (
                  <ChevronRight size={16} color={C.inkSoft} />
                )}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

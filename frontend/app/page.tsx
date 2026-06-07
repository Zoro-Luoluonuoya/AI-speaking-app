"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import AudioRecorder from "./components/AudioRecorder";
import ScoreBadge from "./components/ScoreBadge";
import SummaryModal, { type SummaryData } from "./components/SummaryModal";
import Sidebar from "./components/Sidebar";
import { useAppStore, SCENARIOS, type Scenario } from "@/lib/useAppStore";
import { t } from "@/lib/i18n";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const SCENARIO_META: Record<Scenario, { badge: string; desc: string; color: string }> = {
  interview: { badge: "scenario.interview.badge", desc: "scenario.interview.desc", color: "emerald" },
  restaurant: { badge: "scenario.restaurant.badge", desc: "scenario.restaurant.desc", color: "teal" },
  meeting: { badge: "scenario.meeting.badge", desc: "scenario.meeting.desc", color: "cyan" },
};

interface Message {
  role: "user" | "assistant";
  content: string;
  grammar_correction?: string;
  pronunciation_score?: number;
}

function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  if (score >= 60) return "bg-amber-500/10 text-amber-300 border-amber-500/20";
  return "bg-red-500/10 text-red-300 border-red-500/20";
}

function scoreLabel(score: number, lang: "en" | "zh") {
  if (score >= 80) return t("summary.score.excellent", lang);
  if (score >= 60) return t("summary.score.good", lang);
  return t("summary.score.needs", lang);
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Home() {
  const scenario = useAppStore((s) => s.scenario);
  const setScenario = useAppStore((s) => s.setScenario);
  const uiLanguage = useAppStore((s) => s.uiLanguage);
  const toggleLanguage = useAppStore((s) => s.toggleLanguage);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<"idle" | "transcribing" | "thinking">("idle");
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [expandedCorrections, setExpandedCorrections] = useState<Set<number>>(new Set());
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [textInput, setTextInput] = useState("");
  const sessionStartRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);


  const userMsgCount = messages.filter((m) => m.role === "user").length;

  // Timer
  useEffect(() => {
    if (messages.length === 0) {
      sessionStartRef.current = null;
      setElapsed(0);
      return;
    }
    if (!sessionStartRef.current) sessionStartRef.current = Date.now();
    const interval = setInterval(() => {
      if (sessionStartRef.current) setElapsed(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const toggleCorrection = (idx: number) => {
    setExpandedCorrections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const processUserMessage = useCallback(
    async (text: string, confidence: number) => {
      const userIdx = messages.length;
      setMessages((prev) => [...prev, { role: "user", content: text, pronunciation_score: confidence }]);
      setStatus("thinking");

      try {
        const res = await axios.post(`${API_BASE}/api/chat/send`, { text, confidence, scenario });
        const { reply, grammar_correction, pronunciation_score } = res.data;

        setMessages((prev) => [...prev, { role: "assistant", content: reply, grammar_correction }]);

        if (pronunciation_score != null) {
          setMessages((prev) =>
            prev.map((m, i) => (i === userIdx ? { ...m, pronunciation_score } : m))
          );
          setAvgScore(() => {
            const scores = messages
              .map((m) => m.pronunciation_score)
              .filter((s): s is number => s != null);
            scores.push(pronunciation_score);
            return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          });
        }

        speak(reply);
      } catch (err: unknown) {
        const msg = axios.isAxiosError(err) ? err.message : "Unknown error";
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${msg}` }]);
      } finally {
        setStatus("idle");
      }
    },
    [messages, scenario]
  );

  const handleTranscription = useCallback(
    (text: string, confidence: number) => {
      processUserMessage(text, confidence);
    },
    [processUserMessage]
  );

  const handleTextSend = useCallback(() => {
    const text = textInput.trim();
    if (!text || status !== "idle") return;
    setTextInput("");
    processUserMessage(text, 85);
  }, [textInput, status, processUserMessage]);

  const handleQuickPhrase = useCallback(
    (phrase: string) => {
      if (status !== "idle") return;
      processUserMessage(phrase, 85);
    },
    [status, processUserMessage]
  );

  const handleEndPractice = useCallback(async () => {
    speechSynthesis.cancel();
    setSummaryOpen(true);
    setSummaryLoading(true);
    setSummaryData(null);

    try {
      const payload = messages.map((m) => ({
        role: m.role,
        content: m.content,
        grammar_correction: m.grammar_correction ?? null,
        pronunciation_score: m.pronunciation_score ?? null,
      }));
      const res = await axios.post(`${API_BASE}/api/summary/generate`, {
        messages: payload,
        language: uiLanguage,
        duration: elapsed,
        message_count: userMsgCount,
      });
      setSummaryData(res.data);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.message : "Unknown error";
      setSummaryData({
        overall_score: 0,
        grammar_review: `Error generating report: ${msg}`,
        vocabulary_feedback: "",
        next_steps: "",
      });
    } finally {
      setSummaryLoading(false);
    }
  }, [messages, uiLanguage, elapsed, userMsgCount]);

  const handleNewSession = useCallback(() => {
    speechSynthesis.cancel();
    setMessages([]);
    setAvgScore(null);
    setExpandedCorrections(new Set());
    setSummaryOpen(false);
    setSummaryData(null);
    setScenario("interview");
    setTextInput("");
    setElapsed(0);
  }, [setScenario]);

  const isActive = messages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-slate-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-600/[0.07] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-teal-500/[0.05] rounded-full blur-[100px]" />
      </div>

      {/* ─── Header ─── */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              {t("app.title", uiLanguage)}
            </h1>
            <span className="text-[10px] text-emerald-400/80 font-medium tracking-wide hidden sm:block">
              {t("app.tagline", uiLanguage)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats */}
          {isActive && (
            <div className="hidden md:flex items-center gap-3 mr-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <span className="tabular-nums">{userMsgCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="tabular-nums">{formatDuration(elapsed)}</span>
              </div>
            </div>
          )}

          {/* Avg Score */}
          {avgScore != null && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold tabular-nums ${scoreBg(avgScore)}`}>
              <span>{avgScore}</span>
              <span className="hidden sm:inline text-[10px] opacity-80">{scoreLabel(avgScore, uiLanguage)}</span>
            </div>
          )}

          {/* End Practice */}
          {messages.length >= 2 && status === "idle" && (
            <button
              onClick={handleEndPractice}
              aria-label={t("end.practice", uiLanguage)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M10 2a.75.75 0 0 1 .75.75v6.69l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 1.06-1.06l1.72 1.72V2.75A.75.75 0 0 1 10 2Z" />
                <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
              </svg>
              {t("end.practice", uiLanguage)}
            </button>
          )}

          {/* History */}
          <div className="tooltip-trigger">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label={t("sidebar.history", uiLanguage)}
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <span className="tooltip-content absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-[10px] font-medium text-white bg-slate-700 rounded-md whitespace-nowrap z-50">
              {t("sidebar.history", uiLanguage)}
            </span>
          </div>

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            aria-label={t("lang.toggle", uiLanguage)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 active:bg-slate-800 transition-colors"
          >
            {t("lang.toggle", uiLanguage)}
          </button>
        </div>
      </header>

      {/* ─── Scenario Tabs ─── */}
      <div className="relative z-10 bg-slate-900/60 backdrop-blur-sm border-b border-slate-800/60 px-4">
        <div className="max-w-3xl mx-auto flex gap-0.5 py-2">
          {(Object.keys(SCENARIOS) as Scenario[]).map((key) => {
            const active = scenario === key;
            return (
              <button
                key={key}
                onClick={() => { if (!isActive) setScenario(key); }}
                disabled={isActive}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? "bg-emerald-600/15 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                  }
                  ${isActive && !active ? "opacity-30 cursor-not-allowed" : ""}
                `}
              >
                <span className="text-base">{SCENARIOS[key].icon}</span>
                <span>{t(SCENARIOS[key].i18nKey, uiLanguage)}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 pb-2 max-w-3xl mx-auto leading-relaxed">
          {t(`hint.${scenario}`, uiLanguage)}
        </p>
      </div>

      {/* ─── Main Area ─── */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-5">

            {/* ─── Empty State: Scenario Cards + Daily Quote ─── */}
            {!isActive && (
              <div className="space-y-8 py-8">
                {/* Brand Center */}
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20 mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{t("app.title", uiLanguage)}</h2>
                    <p className="text-sm text-emerald-400/70 font-medium mt-1">{t("app.tagline", uiLanguage)}</p>
                  </div>
                </div>

                {/* Scenario Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(SCENARIOS) as Scenario[]).map((key, idx) => {
                    const active = scenario === key;
                    const meta = SCENARIO_META[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setScenario(key)}
                        className={`
                          group relative text-left p-4 rounded-xl transition-all duration-200 card-stagger
                          ${active
                            ? "bg-emerald-600/10 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/5"
                            : "bg-slate-800/50 ring-1 ring-slate-700/50 hover:bg-slate-800 hover:ring-slate-600 hover:shadow-md hover:-translate-y-0.5"
                          }
                        `}
                        style={{ animationDelay: `${idx * 80}ms` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-2xl">{SCENARIOS[key].icon}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            active
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-slate-700 text-slate-400 group-hover:text-slate-300"
                          }`}>
                            {t(meta.badge, uiLanguage)}
                          </span>
                        </div>
                        <h3 className={`text-sm font-bold mb-1 ${active ? "text-emerald-300" : "text-white"}`}>
                          {t(SCENARIOS[key].i18nKey, uiLanguage)}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {t(meta.desc, uiLanguage)}
                        </p>
                        {active && (
                          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Daily Quote */}
                <div className="bg-slate-800/30 rounded-xl px-5 py-4 ring-1 ring-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-emerald-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                    <span className="text-[11px] font-semibold text-emerald-400/60 uppercase tracking-wider">
                      {t("daily.title", uiLanguage)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 italic leading-relaxed">
                    {t("daily.quote", uiLanguage)}
                  </p>
                </div>

                {/* Quick start hint */}
                <p className="text-center text-xs text-slate-600">
                  {t("chat.placeholder", uiLanguage)}
                </p>
              </div>
            )}

            {/* ─── Messages ─── */}
            {messages.map((msg, i) => (
              <div key={i} className="msg-enter" style={{ animationDelay: `${Math.min(i * 30, 150)}ms` }}>
                <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {/* AI Avatar */}
                  {msg.role === "assistant" && (
                    <div className="shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 max-w-[80%] md:max-w-[70%]">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-1 ${
                      msg.role === "user" ? "text-right text-emerald-400" : "text-slate-500"
                    }`}>
                      {msg.role === "user" ? (uiLanguage === "zh" ? "你" : "You") : "AI Coach"}
                    </span>

                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all duration-200 ${
                        msg.role === "user"
                          ? "bg-emerald-600 text-white rounded-br-md ml-auto"
                          : "bg-slate-800/80 text-slate-100 rounded-bl-md ring-1 ring-slate-700/60"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {msg.role === "user" && msg.pronunciation_score != null && (
                      <div className="self-end score-enter">
                        <ScoreBadge score={msg.pronunciation_score} />
                      </div>
                    )}

                    {msg.role === "assistant" && msg.grammar_correction?.trim() && (
                      <button onClick={() => toggleCorrection(i)} className="text-left group mt-0.5">
                        <div className="flex items-center gap-1 text-amber-400 text-xs transition-colors group-hover:text-amber-300">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">
                            {expandedCorrections.has(i) ? t("chat.grammar.hide", uiLanguage) : t("chat.grammar.tip", uiLanguage)}
                          </span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 transition-transform duration-200 ${expandedCorrections.has(i) ? "rotate-180" : ""}`}>
                            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                          </svg>
                        </div>
                        {expandedCorrections.has(i) && (
                          <p className="mt-1.5 text-xs text-amber-200 bg-amber-500/10 rounded-lg px-3 py-2.5 ring-1 ring-amber-500/20 leading-relaxed tip-expand">
                            {msg.grammar_correction}
                          </p>
                        )}
                      </button>
                    )}
                  </div>

                  {/* User Avatar */}
                  {msg.role === "user" && (
                    <div className="shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center ring-1 ring-slate-600">
                        <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 1 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {status === "thinking" && (
              <div className="flex gap-3 justify-start msg-enter">
                <div className="shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1">AI Coach</span>
                  <div className="bg-slate-800/80 ring-1 ring-slate-700/60 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-emerald-500/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </main>
      </div>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 bg-slate-900/80 backdrop-blur-md border-t border-slate-800/80">
        {/* Quick Phrases */}
        {isActive && status === "idle" && (
          <div className="px-4 pt-3 pb-1">
            <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
              {["quick.repeat", "quick.slower", "quick.meaning", "quick.example"].map((key) => (
                <button
                  key={key}
                  onClick={() => handleQuickPhrase(t(key, "en"))}
                  className="shrink-0 px-3 py-1.5 text-[11px] font-medium rounded-full bg-slate-800 text-slate-400 ring-1 ring-slate-700 hover:text-emerald-300 hover:ring-emerald-500/30 hover:bg-emerald-500/5 transition-all"
                >
                  {t(key, uiLanguage)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-end gap-3">
            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextSend(); } }}
                placeholder={t("chat.type.placeholder", uiLanguage)}
                disabled={status !== "idle"}
                className="w-full px-4 py-3 pr-12 text-sm bg-slate-800/60 text-slate-200 placeholder:text-slate-600 rounded-xl ring-1 ring-slate-700/50 focus:ring-emerald-500/40 focus:outline-none transition-all disabled:opacity-40"
              />
              {textInput.trim() && (
                <button
                  onClick={handleTextSend}
                  disabled={status !== "idle"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              )}
            </div>

            {/* Mic Button */}
            <AudioRecorder onTranscription={handleTranscription} disabled={status !== "idle"} />
          </div>
        </div>

        {/* Status Bar */}
        {isActive && (
          <div className="px-4 pb-3">
            <div className="max-w-2xl mx-auto flex items-center justify-between text-[10px] text-slate-600">
              <div className="flex items-center gap-3">
                <span>{t("status.scenario", uiLanguage)}: {t(SCENARIOS[scenario].i18nKey, uiLanguage)}</span>
                <span className="text-slate-800">|</span>
                <span>{t("status.duration", uiLanguage)}: {formatDuration(elapsed)}</span>
              </div>
              <span>{t("chat.mic.hint", uiLanguage)}</span>
            </div>
          </div>
        )}
      </footer>

      {/* ─── Sidebar ─── */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} lang={uiLanguage} />

      {/* ─── Summary Modal ─── */}
      <SummaryModal
        data={summaryData}
        loading={summaryLoading}
        onClose={handleNewSession}
        lang={uiLanguage}
        duration={elapsed}
        messageCount={userMsgCount}
        scenario={scenario}
      />
    </div>
  );
}

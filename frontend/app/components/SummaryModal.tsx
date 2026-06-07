"use client";

import { useState, useRef } from "react";
import { t, type Lang } from "@/lib/i18n";
import { saveSession } from "./Sidebar";

export interface SummaryData {
  overall_score: number;
  grammar_review: string;
  vocabulary_feedback: string;
  next_steps: string;
}

interface Props {
  data: SummaryData | null;
  loading: boolean;
  onClose: () => void;
  lang: Lang;
  duration?: number;
  messageCount?: number;
  scenario?: string;
}

function scoreRing(score: number) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  let color = "#059669";
  if (score < 60) color = "#dc2626";
  else if (score < 80) color = "#d97706";
  return { circ, offset, color };
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0 text-slate-500">{icon}</div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-200 mb-1.5">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{children}</p>
      </div>
    </div>
  );
}

export default function SummaryModal({ data, loading, onClose, lang, duration = 0, messageCount = 0, scenario = "interview" }: Props) {
  const [exported, setExported] = useState(false);
  const savedRef = useRef(false);

  if (!loading && !data) return null;

  const ring = data ? scoreRing(data.overall_score) : null;

  // Save to history when data arrives
  if (data && data.overall_score > 0 && !savedRef.current) {
    savedRef.current = true;
    saveSession({ scenario, score: data.overall_score, messages: messageCount, duration });
  }

  const handleExport = () => {
    if (!data) return;
    const text = [
      `📋 ${t("summary.title", lang)}`,
      `━━━━━━━━━━━━━━━━━━`,
      `${t("summary.overall", lang)}: ${data.overall_score}/100`,
      `${t("summary.messages", lang)}: ${messageCount}`,
      `${t("summary.duration", lang)}: ${formatDuration(duration)}`,
      ``,
      `📝 ${t("summary.grammar", lang)}`,
      data.grammar_review,
      ``,
      `📚 ${t("summary.vocabulary", lang)}`,
      data.vocabulary_feedback,
      ``,
      `🎯 ${t("summary.next", lang)}`,
      data.next_steps,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm modal-backdrop-enter" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col modal-enter ring-1 ring-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {t("summary.title", lang)}
          </h2>
          <div className="flex items-center gap-2">
            {!loading && data && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30 transition-all"
              >
                {exported ? (
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25" />
                  </svg>
                )}
                {exported ? (lang === "zh" ? "已复制" : "Copied") : t("summary.export", lang)}
              </button>
            )}
            <button
              onClick={onClose}
              aria-label={t("summary.close", lang)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 -m-1 rounded-lg hover:bg-slate-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
              </div>
              <p className="text-sm text-slate-500 animate-pulse">
                {t("summary.loading", lang)}
              </p>
            </div>
          ) : data && (
            <div className="space-y-6">
              {/* Score + Stats */}
              <div className="flex items-center gap-6">
                {/* Score Ring */}
                <div className="shrink-0">
                  <svg width="120" height="120" viewBox="0 0 130 130">
                    <circle cx="65" cy="65" r={ring!.circ} fill="none" stroke="#1e293b" strokeWidth="8" />
                    <circle
                      cx="65" cy="65" r={ring!.circ}
                      fill="none" stroke={ring!.color} strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={ring!.circ}
                      strokeDashoffset={ring!.offset}
                      transform="rotate(-90 65 65)"
                      className="transition-all duration-1000 ease-out"
                    />
                    <text x="65" y="58" textAnchor="middle" className="text-3xl font-bold" fill={ring!.color} dominantBaseline="middle">
                      {data.overall_score}
                    </text>
                    <text x="65" y="80" textAnchor="middle" className="text-xs" fill="#64748b">
                      / 100
                    </text>
                  </svg>
                </div>

                {/* Stat Cards */}
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 rounded-xl p-3 ring-1 ring-slate-700/40">
                    <div className="text-lg font-bold text-white tabular-nums">{messageCount}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{t("summary.messages", lang)}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 ring-1 ring-slate-700/40">
                    <div className="text-lg font-bold text-white tabular-nums">{formatDuration(duration)}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{t("summary.duration", lang)}</div>
                  </div>
                  <div className="col-span-2 bg-emerald-500/5 rounded-xl p-3 ring-1 ring-emerald-500/15">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-400 font-medium">{t("summary.overall", lang)}</span>
                      <span className="text-sm font-bold text-emerald-300">
                        {data.overall_score >= 80 ? "A" : data.overall_score >= 60 ? "B" : "C"}
                      </span>
                    </div>
                    {/* Score bar */}
                    <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${data.overall_score}%`,
                          background: `linear-gradient(90deg, ${ring!.color}, ${ring!.color}dd)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-5">
                <Section
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                    </svg>
                  }
                  title={t("summary.grammar", lang)}
                >
                  {data.grammar_review}
                </Section>

                <Section
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
                    </svg>
                  }
                  title={t("summary.vocabulary", lang)}
                >
                  {data.vocabulary_feedback}
                </Section>

                <Section
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                    </svg>
                  }
                  title={t("summary.next", lang)}
                >
                  {data.next_steps}
                </Section>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && data && (
          <div className="border-t border-slate-800 px-6 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
            >
              {t("summary.close", lang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

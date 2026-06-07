"use client";

import { useEffect, useState } from "react";
import { t, type Lang } from "@/lib/i18n";

export interface HistoryEntry {
  id: string;
  date: string;
  scenario: string;
  score: number;
  messages: number;
  duration: number;
}

const STORAGE_KEY = "ai-speaking-history";

export function saveSession(entry: Omit<HistoryEntry, "id" | "date">) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift({
      ...entry,
      id: Date.now().toString(36),
      date: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {}
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function scoreDotColor(score: number) {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-amber-400";
  return "bg-red-400";
}

function relativeTime(dateStr: string, lang: Lang) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === "zh" ? "刚刚" : "Just now";
  if (mins < 60) return lang === "zh" ? `${mins}分钟前` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === "zh" ? `${hours}小时前` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return lang === "zh" ? `${days}天前` : `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" });
}

interface Props {
  open: boolean;
  onClose: () => void;
  lang: Lang;
}

export default function Sidebar({ open, onClose, lang }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (open) setHistory(getHistory());
  }, [open]);

  // Listen for storage changes
  useEffect(() => {
    const handler = () => setHistory(getHistory());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden sidebar-backdrop-enter"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className={`
          fixed top-0 right-0 z-50 h-full w-80 bg-slate-900 border-l border-slate-800
          transform transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
          lg:translate-x-full
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-sm font-bold text-white">{t("sidebar.history", lang)}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-64px)] p-4 space-y-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800 ring-1 ring-slate-700 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <p className="text-xs text-slate-600">{t("sidebar.no.history", lang)}</p>
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="group p-3 rounded-xl bg-slate-800/40 ring-1 ring-slate-700/40 hover:bg-slate-800/70 hover:ring-slate-600/50 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${scoreDotColor(entry.score)}`} />
                    <span className="text-xs font-semibold text-white capitalize">{entry.scenario}</span>
                  </div>
                  <span className="text-[10px] text-slate-600">{relativeTime(entry.date, lang)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>{entry.messages} msgs</span>
                    <span>{formatDuration(entry.duration)}</span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${scoreColor(entry.score)}`}>
                    {entry.score}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import SignalCards from "@/components/SignalCards";
import ExpertInsights from "@/components/ExpertInsights";
import TrendList from "@/components/TrendList";

const RadarMap = dynamic(() => import("@/components/RadarMap"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface Signal {
  id: number;
  title: string;
  summary: string;
  importance: number;
  created_at: string;
}
interface Article {
  id: number;
  title: string;
  url: string;
  summary: string;
  source: string;
  published_date: string;
  score: number | null;
  created_at: string;
}
interface Trend {
  id: number;
  topic: string;
  frequency: number;
  growth_rate: number;
  domain: string;
  impact: number;
  maturity: number;
  created_at: string;
}
interface Expert {
  id: number;
  author: string;
  platform: string;
  score: number;
  insight: string;
  insight_type: string;
  url: string;
  created_at: string;
}

const SOURCES = ["AI Times", "Hacker News", "GitHub Trending", "arXiv"];
const SRC_COLOR: Record<string, string> = {
  "AI Times": "bg-rose-500/20 text-rose-400",
  "Hacker News": "bg-orange-500/20 text-orange-400",
  "GitHub Trending": "bg-emerald-500/20 text-emerald-400",
  arXiv: "bg-violet-500/20 text-violet-400",
};

function timeAgo(s: string) {
  if (!s) return "";
  const d = Date.now() - new Date(s).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function Home() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("signals");

  const fetchAll = useCallback(async () => {
    try {
      const [sR, aR, tR, eR] = await Promise.all([
        fetch(`${API}/api/signals`),
        fetch(`${API}/api/articles`),
        fetch(`${API}/api/trends`),
        fetch(`${API}/api/experts`),
      ]);
      if (sR.ok) setSignals(await sR.json());
      if (aR.ok) setArticles(await aR.json());
      if (tR.ok) setTrends(await tR.json());
      if (eR.ok) setExperts(await eR.json());
    } catch {
      /* backend not ready */
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleCollect() {
    setLoading("collect");
    setError(null);
    setBanner(null);
    try {
      const r = await fetch(`${API}/api/collect`, { method: "POST" });
      const d = await r.json();
      setBanner(
        `Collected ${d.total_collected} articles | Trends: ${d.trends_detected} | Experts: ${d.experts_detected}`
      );
      await fetchAll();
    } catch {
      setError("Backend not reachable. Is it running?");
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerate() {
    setLoading("generate");
    setError(null);
    try {
      const r = await fetch(`${API}/api/generate`, { method: "POST" });
      const d = await r.json();
      if (d.error) setError(d.error);
      else setBanner(`Generated ${d.generated} signals`);
      await fetchAll();
    } catch {
      setError("Backend not reachable. Is it running?");
    } finally {
      setLoading(null);
    }
  }

  const todaySignals = signals.filter((s) => {
    const c = new Date(s.created_at);
    const n = new Date();
    return (
      c.getFullYear() === n.getFullYear() &&
      c.getMonth() === n.getMonth() &&
      c.getDate() === n.getDate()
    );
  });
  const displaySignals =
    todaySignals.length > 0 ? todaySignals : signals.slice(0, 6);

  const bySource: Record<string, Article[]> = {};
  SOURCES.forEach((s) => {
    bySource[s] = articles.filter((a) => a.source === s);
  });

  return (
    <div className="min-h-screen bg-[#080c14]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#1a2540] bg-[#080c14]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-blue-500/20" />
              <svg
                className="relative h-4 w-4 text-blue-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                AI Radar
              </h1>
              <p className="text-[9px] text-[#475569] tracking-widest uppercase">
                Real-time Intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCollect}
              disabled={loading !== null}
              className="rounded-lg border border-[#1a2540] bg-[#0f1520] px-3 py-1.5 text-xs font-medium text-[#94a3b8] transition hover:bg-[#1a2540] disabled:opacity-40"
            >
              {loading === "collect" ? "Scanning..." : "Collect"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading !== null}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              {loading === "generate" ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-4">
        {/* Banners */}
        {error && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
            {error}
          </div>
        )}
        {banner && (
          <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-400">
            {banner}
          </div>
        )}

        {/* Stats Strip */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { l: "Signals", v: signals.length, c: "text-blue-400" },
            { l: "Articles", v: articles.length, c: "text-purple-400" },
            { l: "Trends", v: trends.length, c: "text-cyan-400" },
            { l: "Experts", v: experts.length, c: "text-amber-400" },
            { l: "Sources", v: Object.values(bySource).filter((a) => a.length > 0).length, c: "text-emerald-400" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-lg border border-[#1a2540] bg-[#0f1520] px-3 py-2"
            >
              <p className="text-[10px] text-[#475569] uppercase tracking-wider">
                {s.l}
              </p>
              <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left Column - Radar + Trends */}
          <div className="space-y-4">
            <RadarMap trends={trends} />
            <div>
              <h2 className="mb-2 text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
                Emerging Trends
              </h2>
              <TrendList trends={trends} />
            </div>
          </div>

          {/* Center Column - Signals + Articles */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab Navigation */}
            <div className="flex gap-1 rounded-lg border border-[#1a2540] bg-[#0f1520] p-1">
              {[
                { key: "signals", label: "Signals", count: displaySignals.length },
                { key: "articles", label: "Articles", count: articles.length },
                { key: "experts", label: "Expert Insights", count: experts.length },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    tab === t.key
                      ? "bg-[#1a2540] text-white"
                      : "text-[#475569] hover:text-[#94a3b8]"
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className="ml-1 text-[10px] text-blue-400">
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {tab === "signals" && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
                  Today&apos;s AI Signals
                </h2>
                <SignalCards signals={displaySignals} />
              </div>
            )}

            {tab === "experts" && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
                  Expert Insights
                </h2>
                <ExpertInsights experts={experts} />
              </div>
            )}

            {tab === "articles" && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
                  Latest Articles
                </h2>
                {articles.length === 0 ? (
                  <div className="rounded-xl border border-[#1a2540] bg-[#121a2a] p-8 text-center">
                    <p className="text-sm text-[#475569]">
                      No articles yet. Click &quot;Collect&quot; to start.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SOURCES.map((source) => {
                      const sa = bySource[source] || [];
                      if (sa.length === 0) return null;
                      return (
                        <div
                          key={source}
                          className="rounded-xl border border-[#1a2540] bg-[#121a2a] p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                SRC_COLOR[source] || "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {source}
                            </span>
                            <span className="text-[10px] text-[#475569]">
                              {sa.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {sa.slice(0, 8).map((a) => (
                              <a
                                key={a.id}
                                href={a.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-lg border border-[#1a2540] bg-[#0f1520] p-2.5 transition hover:border-blue-500/20"
                              >
                                <p className="text-xs font-medium text-[#e2e8f0] line-clamp-2">
                                  {a.title}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-[10px] text-[#475569]">
                                  {a.score != null && a.score > 0 && (
                                    <span className="text-orange-400">
                                      {a.score} pts
                                    </span>
                                  )}
                                  {a.published_date && (
                                    <span>{timeAgo(a.published_date)}</span>
                                  )}
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-8 border-t border-[#1a2540] py-4 text-center text-[10px] text-[#475569]">
        AI Radar v2.0 &mdash; Auto-collecting every 30 minutes &mdash; Open Source
      </footer>
    </div>
  );
}

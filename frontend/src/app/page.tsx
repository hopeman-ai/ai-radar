"use client";

import { useState, useEffect, useCallback } from "react";
import StatsHeader from "@/components/StatsHeader";
import KeywordPanel from "@/components/KeywordPanel";
import IssuePanel from "@/components/IssuePanel";
import TopNews from "@/components/TopNews";
import TopArticles from "@/components/TopArticles";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface Stats {
  news_count: number;
  article_count: number;
  total: number;
}

interface Keyword {
  keyword: string;
  count: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [topNews, setTopNews] = useState<any[]>([]);
  const [topArticles, setTopArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [sR, kR, iR, nR, aR] = await Promise.all([
        fetch(`${API}/api/stats`),
        fetch(`${API}/api/keywords`),
        fetch(`${API}/api/issues`),
        fetch(`${API}/api/top-news`),
        fetch(`${API}/api/top-articles`),
      ]);
      if (sR.ok) setStats(await sR.json());
      if (kR.ok) setKeywords(await kR.json());
      if (iR.ok) setIssues(await iR.json());
      if (nR.ok) setTopNews(await nR.json());
      if (aR.ok) setTopArticles(await aR.json());
      setError(null);
    } catch {
      setError("Backend not reachable. Is it running?");
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
        `Collected ${d.total_collected ?? 0} items (saved ${d.saved ?? 0} new) | Keywords: ${d.keywords_extracted ?? 0} | Issues: ${d.issues_generated ?? 0}`
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
    setBanner(null);
    try {
      const r = await fetch(`${API}/api/generate`, { method: "POST" });
      const d = await r.json();
      setBanner(
        `Dashboard updated: ${d.news_count ?? 0} news, ${d.article_count ?? 0} articles`
      );
      await fetchAll();
    } catch {
      setError("Backend not reachable. Is it running?");
    } finally {
      setLoading(null);
    }
  }

  const isEmpty = stats !== null && stats.total === 0;

  return (
    <div className="min-h-screen bg-[#080c14]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#1a2540] bg-[#080c14]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3">
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
                AI Information Scanner
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCollect}
              disabled={loading !== null}
              className="rounded-lg border border-[#1a2540] bg-[#0f1520] px-4 py-1.5 text-xs font-medium text-[#94a3b8] transition hover:bg-[#1a2540] disabled:opacity-40"
            >
              {loading === "collect" ? "Scanning..." : "Collect"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading !== null}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              {loading === "generate" ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-4 space-y-4">
        {/* Banners */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
            {error}
          </div>
        )}
        {banner && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-400">
            {banner}
          </div>
        )}

        {isEmpty && !banner ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-[#1a2540] bg-[#121a2a]">
            <div className="text-center">
              <p className="text-lg text-[#475569] mb-2">
                No data collected yet
              </p>
              <p className="text-xs text-[#475569]">
                Click &quot;Collect&quot; to start scanning AI information.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <StatsHeader stats={stats} />

            {/* Main Grid: Left 40% / Right 60% */}
            <div className="grid gap-4 lg:grid-cols-5">
              {/* Left Column - Insights */}
              <div className="lg:col-span-2 space-y-4">
                <KeywordPanel keywords={keywords} />
                <IssuePanel issues={issues} />
              </div>

              {/* Right Column - Top Lists */}
              <div className="lg:col-span-3 space-y-4">
                <TopNews items={topNews} />
                <TopArticles items={topArticles} />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="mt-8 border-t border-[#1a2540] py-4 text-center text-[10px] text-[#475569]">
        AI Radar v3.0 &mdash; AI Information Scanning Service
      </footer>
    </div>
  );
}

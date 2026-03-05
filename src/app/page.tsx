"use client";

import { useState, useEffect, useCallback } from "react";

const API = "";

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
  stars: number | null;
  collected_at: string;
}

const SOURCE_ORDER = ["AI Times", "Hacker News", "GitHub Trending", "arXiv"];

const SOURCE_COLORS: Record<string, string> = {
  "AI Times": "bg-rose-500/20 text-rose-400",
  "Hacker News": "bg-orange-500/20 text-orange-400",
  "GitHub Trending": "bg-green-500/20 text-green-400",
  arXiv: "bg-violet-500/20 text-violet-400",
};

function importanceColor(score: number) {
  const colors: Record<number, string> = {
    5: "bg-red-500",
    4: "bg-orange-500",
    3: "bg-yellow-500",
    2: "bg-green-500",
    1: "bg-gray-500",
  };
  return colors[score] || "bg-gray-500";
}

function importanceLabel(score: number) {
  const labels: Record<number, string> = {
    5: "Critical",
    4: "High",
    3: "Medium",
    2: "Low",
    1: "Minor",
  };
  return labels[score] || "Unknown";
}

function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function SignalCard({ signal }: { signal: Signal }) {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5 transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5">
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${importanceColor(signal.importance)}`}
        >
          {importanceLabel(signal.importance)}
        </span>
        <span className="text-xs text-gray-500">{timeAgo(signal.created_at)}</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{signal.title}</h3>
      <p className="text-sm leading-relaxed text-gray-400">{signal.summary}</p>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 w-6 rounded-full ${
              i <= signal.importance ? importanceColor(signal.importance) : "bg-gray-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-[#1e293b] bg-[#0f172a] p-4 transition-all hover:border-blue-500/30 hover:bg-[#111827]"
    >
      <h4 className="mb-1 text-sm font-medium text-gray-200 line-clamp-2">{article.title}</h4>
      {article.summary && (
        <p className="mb-2 text-xs text-gray-500 line-clamp-2">{article.summary}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-gray-600">
        {article.score != null && article.score > 0 && (
          <span className="text-orange-400">{article.score} pts</span>
        )}
        {article.stars != null && article.stars > 0 && (
          <span className="text-yellow-400">{article.stars.toLocaleString()} stars</span>
        )}
        {article.published_date && (
          <span>{timeAgo(article.published_date)}</span>
        )}
      </div>
    </a>
  );
}

export default function Home() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [collectResult, setCollectResult] = useState<Record<string, number> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [sigRes, artRes] = await Promise.all([
        fetch(`${API}/api/signals`),
        fetch(`${API}/api/articles`),
      ]);
      if (sigRes.ok) setSignals(await sigRes.json());
      if (artRes.ok) setArticles(await artRes.json());
    } catch {
      // API not available yet
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCollect() {
    setLoading("collect");
    setError(null);
    setCollectResult(null);
    try {
      const res = await fetch(`${API}/api/collect`, { method: "POST" });
      const data = await res.json();
      setCollectResult(data.sources);
      await fetchData();
    } catch {
      setError("Failed to connect to backend. Is it running on port 8000?");
    } finally {
      setLoading(null);
    }
  }

  async function handleGenerate() {
    setLoading("generate");
    setError(null);
    try {
      const res = await fetch(`${API}/api/generate`, { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      }
      await fetchData();
    } catch {
      setError("Failed to connect to backend. Is it running on port 8000?");
    } finally {
      setLoading(null);
    }
  }

  const todaySignals = signals.filter((s) => {
    const created = new Date(s.created_at);
    const now = new Date();
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    );
  });

  const displaySignals = todaySignals.length > 0 ? todaySignals : signals.slice(0, 6);

  const articlesBySource: Record<string, Article[]> = {};
  for (const source of SOURCE_ORDER) {
    articlesBySource[source] = articles.filter((a) => a.source === source);
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#1e293b] bg-[#0b0f1a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">AI Radar</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCollect}
              disabled={loading !== null}
              className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-medium text-gray-300 border border-[#1e293b] transition-colors hover:bg-[#1e293b] disabled:opacity-50"
            >
              {loading === "collect" ? "Scanning..." : "Collect Data"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading !== null}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === "generate" ? "Generating..." : "Generate Signals"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Collection result banner */}
        {collectResult && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
            Collected: {Object.entries(collectResult).map(([k, v]) => `${k}: ${v}`).join(" | ")} new articles
          </div>
        )}

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Signals", value: signals.length, color: "text-blue-400" },
            { label: "Today Signals", value: todaySignals.length, color: "text-green-400" },
            { label: "Articles", value: articles.length, color: "text-purple-400" },
            { label: "Sources", value: Object.values(articlesBySource).filter((a) => a.length > 0).length, color: "text-orange-400" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[#1e293b] bg-[#111827] p-4">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Today's Signals */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Today Signals
            {displaySignals.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs text-blue-400">
                {displaySignals.length}
              </span>
            )}
          </h2>
          {displaySignals.length === 0 ? (
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-8 text-center">
              <p className="text-gray-500">
                No signals yet. Click &quot;Collect Data&quot; then &quot;Generate Signals&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displaySignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </section>

        {/* Latest Articles grouped by source */}
        <section>
          <h2 className="mb-6 text-lg font-semibold text-white">Latest Articles</h2>

          {articles.length === 0 ? (
            <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-8 text-center">
              <p className="text-gray-500">No articles collected yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {SOURCE_ORDER.map((source) => {
                const sourceArticles = articlesBySource[source] || [];
                if (sourceArticles.length === 0) return null;
                return (
                  <div key={source} className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${SOURCE_COLORS[source] || "bg-gray-500/20 text-gray-400"}`}>
                        {source}
                      </span>
                      <span className="text-xs text-gray-600">{sourceArticles.length} articles</span>
                    </div>
                    <div className="space-y-3">
                      {sourceArticles.slice(0, 8).map((article) => (
                        <ArticleCard key={article.id} article={article} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-[#1e293b] py-6 text-center text-xs text-gray-600">
        AI Radar &mdash; AI News Intelligence Dashboard
      </footer>
    </div>
  );
}

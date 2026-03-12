"use client";

interface Stats {
  news_count: number;
  article_count: number;
  total: number;
}

export default function StatsHeader({ stats }: { stats: Stats | null }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#475569]">
          News
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-rose-400">
          {stats?.news_count ?? 0}
        </p>
      </div>
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#475569]">
          Articles
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-violet-400">
          {stats?.article_count ?? 0}
        </p>
      </div>
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#475569]">
          Total
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-blue-400">
          {stats?.total ?? 0}
        </p>
      </div>
    </div>
  );
}

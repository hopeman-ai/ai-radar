"use client";

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

const TYPE_COLORS: Record<string, string> = {
  research: "bg-violet-500/20 text-violet-400",
  tool_discovery: "bg-cyan-500/20 text-cyan-400",
  industry_trend: "bg-amber-500/20 text-amber-400",
  workflow: "bg-emerald-500/20 text-emerald-400",
  general: "bg-gray-500/20 text-gray-400",
};

const PLATFORM_ICONS: Record<string, string> = {
  "Hacker News": "HN",
  "GitHub Trending": "GH",
  "AI Times": "AT",
  arXiv: "aX",
};

export default function ExpertInsights({ experts }: { experts: Expert[] }) {
  if (experts.length === 0) {
    return (
      <div className="rounded-xl border border-[#1a2540] bg-[#121a2a] p-6 text-center">
        <p className="text-sm text-[#475569]">No expert insights detected yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {experts.slice(0, 15).map((e) => (
        <a
          key={e.id}
          href={e.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-lg border border-[#1a2540] bg-[#0f1520] p-3 transition-all hover:border-blue-500/30 hover:bg-[#121a2a]"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#1a2540] text-[10px] font-bold text-[#94a3b8]">
            {PLATFORM_ICONS[e.platform] || e.platform.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white line-clamp-2">
              {e.insight}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-[#475569]">@{e.author}</span>
              {e.insight_type && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                    TYPE_COLORS[e.insight_type] || TYPE_COLORS.general
                  }`}
                >
                  {e.insight_type.replace("_", " ")}
                </span>
              )}
              <span className="text-[10px] text-amber-500/70">
                {e.score?.toFixed(0)} pts
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

"use client";

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

const DOMAIN_COLORS: Record<string, string> = {
  "AI Models": "text-blue-400",
  "AI Coding": "text-cyan-400",
  "AI Infrastructure": "text-amber-400",
  "AI Research": "text-violet-400",
  "AI Applications": "text-emerald-400",
  General: "text-gray-400",
};

export default function TrendList({ trends }: { trends: Trend[] }) {
  if (trends.length === 0) {
    return (
      <div className="rounded-xl border border-[#1a2540] bg-[#121a2a] p-6 text-center">
        <p className="text-sm text-[#475569]">No trends detected yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {trends.slice(0, 10).map((t, i) => {
        const score = t.frequency * Math.max(t.growth_rate, 0.1);
        const barWidth = Math.min(100, (score / 20) * 100);
        const growthPct = (t.growth_rate * 100).toFixed(0);
        const isPositive = t.growth_rate > 0;

        return (
          <div
            key={t.id}
            className="rounded-lg border border-[#1a2540] bg-[#0f1520] p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#1a2540] text-[9px] font-bold text-[#475569]">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-white">
                  {t.topic}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-medium ${
                    DOMAIN_COLORS[t.domain] || DOMAIN_COLORS.General
                  }`}
                >
                  {t.domain}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    isPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {growthPct}%
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#1a2540]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="text-[9px] text-[#475569]">
                {t.frequency} mentions
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

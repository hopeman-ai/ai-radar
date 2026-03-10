"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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

const DOMAINS = [
  "AI Models",
  "AI Coding",
  "AI Infrastructure",
  "AI Research",
  "AI Applications",
];

export default function RadarMap({ trends }: { trends: Trend[] }) {
  const domainScores = DOMAINS.map((domain) => {
    const domainTrends = trends.filter((t) => t.domain === domain);
    const avgImpact =
      domainTrends.length > 0
        ? domainTrends.reduce((s, t) => s + (t.impact || 0), 0) /
          domainTrends.length
        : 0;
    const avgGrowth =
      domainTrends.length > 0
        ? domainTrends.reduce((s, t) => s + Math.max(t.growth_rate || 0, 0), 0) /
          domainTrends.length
        : 0;
    const count = domainTrends.length;

    return {
      domain,
      impact: Math.round(avgImpact * 100),
      growth: Math.min(100, Math.round(avgGrowth * 50)),
      activity: Math.min(100, count * 25),
    };
  });

  if (trends.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-[#1a2540] bg-[#121a2a]">
        <p className="text-sm text-[#475569]">
          No trend data yet. Collect data first.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1a2540] bg-[#121a2a] p-4">
      <h3 className="mb-2 text-sm font-semibold text-[#94a3b8]">
        AI DOMAIN RADAR
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={domainScores} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#1a2540" />
          <PolarAngleAxis
            dataKey="domain"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#475569", fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            name="Impact"
            dataKey="impact"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Radar
            name="Growth"
            dataKey="growth"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.1}
            strokeWidth={2}
          />
          <Radar
            name="Activity"
            dataKey="activity"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.05}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <Tooltip
            contentStyle={{
              background: "#0f1520",
              border: "1px solid #1a2540",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            itemStyle={{ color: "#e2e8f0" }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex justify-center gap-4 text-xs text-[#475569]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          Impact
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Growth
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          Activity
        </span>
      </div>
    </div>
  );
}

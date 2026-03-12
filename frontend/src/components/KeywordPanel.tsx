"use client";

interface Keyword {
  keyword: string;
  count: number;
}

export default function KeywordPanel({ keywords }: { keywords: Keyword[] }) {
  if (keywords.length === 0) {
    return (
      <div className="rounded-xl border border-[#1a2540] bg-[#121a2a] p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
          Top Keywords
        </h3>
        <p className="text-xs text-[#475569]">
          Click Collect to extract keywords.
        </p>
      </div>
    );
  }

  const max = keywords[0]?.count ?? 1;

  return (
    <div className="rounded-xl border border-[#1a2540] bg-[#121a2a] p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
        Top Keywords
      </h3>
      <div className="space-y-2.5">
        {keywords.map((kw, i) => {
          const pct = Math.min(100, (kw.count / max) * 100);
          return (
            <div key={kw.keyword}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-[#1a2540] text-[8px] font-bold text-[#475569]">
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium text-[#e2e8f0]">
                    {kw.keyword}
                  </span>
                </div>
                <span className="text-[10px] tabular-nums text-blue-400">
                  {kw.count}
                </span>
              </div>
              <div className="ml-6 h-1 overflow-hidden rounded-full bg-[#1a2540]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

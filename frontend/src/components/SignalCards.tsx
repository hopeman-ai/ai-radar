"use client";

interface Signal {
  id: number;
  title: string;
  summary: string;
  importance: number;
  created_at: string;
}

const IMP_COLORS: Record<number, string> = {
  5: "from-red-500/20 to-red-900/10 border-red-500/30",
  4: "from-orange-500/20 to-orange-900/10 border-orange-500/30",
  3: "from-yellow-500/20 to-yellow-900/10 border-yellow-500/30",
  2: "from-green-500/20 to-green-900/10 border-green-500/30",
  1: "from-gray-500/20 to-gray-900/10 border-gray-500/30",
};

const IMP_BADGE: Record<number, string> = {
  5: "bg-red-500/20 text-red-400 ring-red-500/30",
  4: "bg-orange-500/20 text-orange-400 ring-orange-500/30",
  3: "bg-yellow-500/20 text-yellow-400 ring-yellow-500/30",
  2: "bg-green-500/20 text-green-400 ring-green-500/30",
  1: "bg-gray-500/20 text-gray-400 ring-gray-500/30",
};

const IMP_LABEL: Record<number, string> = {
  5: "CRITICAL",
  4: "HIGH",
  3: "MEDIUM",
  2: "LOW",
  1: "MINOR",
};

function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function SignalCards({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) {
    return (
      <div className="rounded-xl border border-[#1a2540] bg-[#121a2a] p-8 text-center">
        <p className="text-sm text-[#475569]">
          No signals yet. Click Collect then Generate.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {signals.map((s) => (
        <div
          key={s.id}
          className={`rounded-xl border bg-gradient-to-br p-4 transition-all hover:scale-[1.01] ${
            IMP_COLORS[s.importance] || IMP_COLORS[3]
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${
                IMP_BADGE[s.importance] || IMP_BADGE[3]
              }`}
            >
              {IMP_LABEL[s.importance] || "MEDIUM"}
            </span>
            <span className="text-[10px] text-[#475569]">
              {timeAgo(s.created_at)}
            </span>
          </div>
          <h3 className="mb-1.5 text-sm font-semibold text-white leading-tight">
            {s.title}
          </h3>
          <p className="text-xs leading-relaxed text-[#94a3b8]">{s.summary}</p>
          <div className="mt-2.5 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= s.importance
                    ? i >= 4
                      ? "bg-orange-500"
                      : i >= 3
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    : "bg-[#1a2540]"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

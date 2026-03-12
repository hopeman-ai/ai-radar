"use client";

interface ContentItem {
  id: number;
  title: string;
  url: string;
  summary: string;
  type: string;
  source: string;
  published_date: string;
  created_at: string;
}

const SRC_COLOR: Record<string, string> = {
  "AI Times": "text-rose-400",
  "Hacker News": "text-orange-400",
};

function timeAgo(s: string) {
  if (!s) return "";
  const d = Date.now() - new Date(s).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TopNews({ items }: { items: ContentItem[] }) {
  return (
    <div className="rounded-xl border border-[#1a2540] bg-[#121a2a] p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-rose-400">
        Top News
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-[#475569]">No news collected yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-[#1a2540] bg-[#0f1520] p-3 transition-all hover:border-blue-500/30 hover:bg-[#0f1520]/80"
            >
              <p className="text-xs font-medium text-[#e2e8f0] leading-relaxed line-clamp-2">
                {item.title}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                <span className={SRC_COLOR[item.source] || "text-gray-400"}>
                  {item.source}
                </span>
                <span className="text-[#475569]">
                  {timeAgo(item.published_date || item.created_at)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

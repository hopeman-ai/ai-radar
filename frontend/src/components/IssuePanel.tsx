"use client";

export default function IssuePanel({ issues }: { issues: string[] }) {
  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-[#1a2540] bg-[#121a2a] p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
          Key Issues
        </h3>
        <p className="text-xs text-[#475569]">
          Click Collect to generate issue summaries.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1a2540] bg-[#121a2a] p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
        Key Issues
      </h3>
      <div className="space-y-2">
        {issues.map((issue, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 rounded-lg border border-amber-500/10 bg-amber-500/5 p-2.5"
          >
            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[8px] font-bold text-amber-400">
              !
            </span>
            <p className="text-xs leading-relaxed text-[#e2e8f0]">{issue}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { collectAITimes, collectHackerNews, collectGitHub, collectArxiv } from "@/lib/collectors";
import { addArticles } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const [aitimes, hn, github, arxiv] = await Promise.all([
    collectAITimes(),
    collectHackerNews(),
    collectGitHub(),
    collectArxiv(),
  ]);

  const results: Record<string, number> = {
    "AI Times": addArticles(aitimes),
    "Hacker News": addArticles(hn),
    "GitHub Trending": addArticles(github),
    arXiv: addArticles(arxiv),
  };

  const total = Object.values(results).reduce((a, b) => a + b, 0);
  return NextResponse.json({ sources: results, total_new: total });
}

import type { Article } from "./collectors";

export interface Signal {
  id: number;
  title: string;
  summary: string;
  importance: number;
  created_at: string;
}

// In-memory store for Vercel serverless (resets on cold start)
// For persistence across deployments, use a database service

let articles: Article[] = [];
let signals: Signal[] = [];
let nextArticleId = 1;
let nextSignalId = 1;

export function getArticles(): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime()
  );
}

export function addArticles(newArticles: Article[]): number {
  const existingUrls = new Set(articles.map((a) => a.url));
  let count = 0;
  for (const a of newArticles) {
    if (existingUrls.has(a.url)) continue;
    articles.push({ ...a, id: nextArticleId++ });
    existingUrls.add(a.url);
    count++;
  }
  return count;
}

export function getSignals(): Signal[] {
  return [...signals].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function addSignal(title: string, summary: string, importance: number): void {
  signals.push({
    id: nextSignalId++,
    title,
    summary,
    importance: Math.max(1, Math.min(5, importance)),
    created_at: new Date().toISOString(),
  });
}

export function getRecentArticles(limit: number = 30): Article[] {
  return getArticles().slice(0, limit);
}

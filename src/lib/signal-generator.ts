import type { Article } from "./collectors";
import { getRecentArticles, addSignal } from "./store";

const SYSTEM_PROMPT = `You are an AI industry analyst. Given a batch of recent AI news articles from multiple sources (AI Times, Hacker News, GitHub Trending, arXiv), generate concise AI signals that capture the key trends and developments.

For each signal, provide:
- Signal Title: A concise headline (max 10 words)
- Signal Summary: 2-3 sentences explaining the trend/development
- Importance Score: 1-5 (1=minor, 5=critical/breakthrough)

Return your response as a JSON array of objects with keys: "title", "summary", "importance".
Return between 3 and 7 signals. Focus on the most significant and distinct trends.
Only return the JSON array, no other text.`;

function buildArticlesText(articles: Article[]): string {
  return articles
    .map((a) => {
      const parts = [`Title: ${a.title}`, `Source: ${a.source}`];
      if (a.summary) parts.push(`Summary: ${a.summary}`);
      if (a.score) parts.push(`Score: ${a.score}`);
      if (a.stars) parts.push(`Stars: ${a.stars}`);
      return parts.join("\n");
    })
    .join("\n---\n");
}

function parseSignalsJson(text: string): Array<{ title: string; summary: string; importance: number }> {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
  }
  return [];
}

async function generateWithAnthropic(articlesText: string): Promise<Array<{ title: string; summary: string; importance: number }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Analyze these AI articles and generate signals:\n\n${articlesText}` },
      ],
    }),
  });

  if (!res.ok) {
    console.error("Anthropic API error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return parseSignalsJson(data.content?.[0]?.text || "");
}

async function generateWithOpenAI(articlesText: string): Promise<Array<{ title: string; summary: string; importance: number }>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze these AI articles and generate signals:\n\n${articlesText}` },
      ],
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    console.error("OpenAI API error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return parseSignalsJson(data.choices?.[0]?.message?.content || "");
}

function generateMockSignals(articles: Article[]): Array<{ title: string; summary: string; importance: number }> {
  const sourceGroups: Record<string, Article[]> = {};
  for (const a of articles) {
    if (!sourceGroups[a.source]) sourceGroups[a.source] = [];
    sourceGroups[a.source].push(a);
  }

  const signals: Array<{ title: string; summary: string; importance: number }> = [];
  for (const [source, arts] of Object.entries(sourceGroups)) {
    if (!arts.length) continue;
    const top = arts[0];
    signals.push({
      title: top.title.slice(0, 80),
      summary: `From ${source}: ${(top.summary || "New development detected.").slice(0, 200)}`,
      importance: arts.length > 3 ? 4 : 3,
    });
  }
  return signals.slice(0, 5);
}

export async function generateSignals(): Promise<{ generated: number; error?: string }> {
  const articles = getRecentArticles(30);
  if (articles.length === 0) {
    return { generated: 0, error: "No articles found. Click Collect Data first." };
  }

  const articlesText = buildArticlesText(articles);
  let rawSignals: Array<{ title: string; summary: string; importance: number }> = [];

  // Try Anthropic
  rawSignals = await generateWithAnthropic(articlesText);

  // Try OpenAI
  if (!rawSignals.length) {
    rawSignals = await generateWithOpenAI(articlesText);
  }

  // Fallback to mock
  if (!rawSignals.length) {
    rawSignals = generateMockSignals(articles);
  }

  let count = 0;
  for (const s of rawSignals) {
    if (s.title && s.summary) {
      const importance = typeof s.importance === "number" ? s.importance : 3;
      addSignal(s.title, s.summary, importance);
      count++;
    }
  }

  return { generated: count };
}

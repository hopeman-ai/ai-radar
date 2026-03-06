export interface Article {
  id: number;
  title: string;
  url: string;
  summary: string;
  source: string;
  published_date: string;
  score: number | null;
  stars: number | null;
  collected_at: string;
}

// ── AI Times (RSS) ──────────────────────────────────────────────

export async function collectAITimes(): Promise<Article[]> {
  const articles: Article[] = [];
  try {
    const res = await fetch("https://www.aitimes.kr/rss/allArticle.xml", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AIRadar/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    const xml = await res.text();

    const items = xml.split("<item>").slice(1);
    for (const item of items.slice(0, 20)) {
      const title = stripHtml(extractTag(item, "title"));
      const link = extractTag(item, "link");
      const desc = stripHtml(extractTag(item, "description")).slice(0, 500);
      const pubDate = extractTag(item, "pubDate");

      if (title && link) {
        // pubDate format: "2026-03-06 09:16:24" (Korean time)
        let isoDate = new Date().toISOString();
        if (pubDate) {
          const normalized = pubDate.replace(" ", "T") + "+09:00";
          const d = new Date(normalized);
          if (!isNaN(d.getTime())) isoDate = d.toISOString();
        }

        articles.push({
          id: 0,
          title,
          url: link,
          summary: desc,
          source: "AI Times",
          published_date: isoDate,
          score: null,
          stars: null,
          collected_at: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    console.error("[AI Times]", e);
  }
  return articles;
}

// ── Hacker News ─────────────────────────────────────────────────

const HN_KEYWORDS = [
  "ai", "llm", "openai", "claude", "deep learning", "machine learning",
  "gpt", "transformer", "neural", "anthropic", "gemini", "mistral",
];

export async function collectHackerNews(): Promise<Article[]> {
  const articles: Article[] = [];
  try {
    const res = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
      { signal: AbortSignal.timeout(10000) }
    );
    const ids: number[] = await res.json();

    const fetches = ids.slice(0, 80).map(async (id) => {
      try {
        const r = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          { signal: AbortSignal.timeout(5000) }
        );
        return await r.json();
      } catch {
        return null;
      }
    });

    const items = await Promise.all(fetches);

    for (const item of items) {
      if (!item || item.type !== "story" || !item.title) continue;
      const lower = item.title.toLowerCase();
      if (!HN_KEYWORDS.some((kw) => lower.includes(kw))) continue;

      articles.push({
        id: 0,
        title: item.title,
        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        summary: "",
        source: "Hacker News",
        published_date: item.time
          ? new Date(item.time * 1000).toISOString()
          : new Date().toISOString(),
        score: item.score || 0,
        stars: null,
        collected_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("[Hacker News]", e);
  }
  return articles;
}

// ── GitHub Trending ─────────────────────────────────────────────

const GH_KEYWORDS = [
  "ai", "llm", "machine-learning", "deep-learning", "agent",
  "transformer", "gpt", "neural", "language-model", "diffusion",
];

export async function collectGitHub(): Promise<Article[]> {
  const articles: Article[] = [];
  try {
    const res = await fetch("https://github.com/trending", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AIRadar/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();

    // Parse article.Box-row elements manually
    const rows = html.split(/class="Box-row"/).slice(1);

    for (const row of rows) {
      // Extract repo path from h2 > a href
      const hrefMatch = row.match(/href="\/([^"]+)"/);
      if (!hrefMatch) continue;
      const repoPath = hrefMatch[1];
      const repoName = repoPath.replace("/", " / ");
      const url = `https://github.com/${repoPath}`;

      // Extract description from <p> tag
      const pMatch = row.match(/<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
      const description = pMatch ? stripHtml(pMatch[1]).trim() : "";

      const searchable = `${repoName} ${description}`.toLowerCase();
      if (!GH_KEYWORDS.some((kw) => searchable.includes(kw))) continue;

      // Extract stars
      let stars = 0;
      const starsMatch = row.match(/\/stargazers[^>]*>[\s\S]*?([0-9,]+)/);
      if (starsMatch) {
        stars = parseInt(starsMatch[1].replace(/,/g, ""), 10) || 0;
      }

      articles.push({
        id: 0,
        title: repoName,
        url,
        summary: description,
        source: "GitHub Trending",
        published_date: "",
        score: null,
        stars,
        collected_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("[GitHub Trending]", e);
  }
  return articles;
}

// ── arXiv ───────────────────────────────────────────────────────

export async function collectArxiv(): Promise<Article[]> {
  const articles: Article[] = [];
  try {
    const query = "cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL";
    const url = `http://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const xml = await res.text();

    const entries = xml.split("<entry>").slice(1);
    for (const entry of entries) {
      const title = extractTag(entry, "title").replace(/\s+/g, " ").trim();
      const summary = extractTag(entry, "summary").replace(/\s+/g, " ").trim().slice(0, 500);
      const published = extractTag(entry, "published").slice(0, 19);
      const idTag = extractTag(entry, "id");

      // Extract authors
      const authorMatches = [...entry.matchAll(/<name>([^<]+)<\/name>/g)];
      const authors = authorMatches.map((m) => m[1]).slice(0, 5);
      let authorStr = authors.join(", ");
      if (authorMatches.length > 5) authorStr += ` et al. (${authorMatches.length} authors)`;

      const fullSummary = authorStr ? `Authors: ${authorStr}\n${summary}` : summary;

      // Extract HTML link
      const linkMatch = entry.match(/<link[^>]+type="text\/html"[^>]+href="([^"]+)"/);
      const link = linkMatch ? linkMatch[1] : idTag;

      if (title && link) {
        articles.push({
          id: 0,
          title,
          url: link,
          summary: fullSummary,
          source: "arXiv",
          published_date: published,
          score: null,
          stars: null,
          collected_at: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    console.error("[arXiv]", e);
  }
  return articles;
}

// ── Helpers ─────────────────────────────────────────────────────

function extractTag(xml: string, tag: string): string {
  // Handle CDATA
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`);
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();

  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const match = xml.match(re);
  return match ? match[1].trim() : "";
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

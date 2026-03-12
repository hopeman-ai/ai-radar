"""Unified collector: gathers AI content from all sources."""

import re
import requests
import feedparser
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from datetime import datetime


# ---------------------------------------------------------------------------
# AI Times (RSS) → type: news
# ---------------------------------------------------------------------------

AITIMES_FEED = "https://www.aitimes.com/rss/allArticle.xml"


def _strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    for entity, char in [("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"),
                         ("&quot;", '"'), ("&#39;", "'")]:
        text = text.replace(entity, char)
    return text.strip()


def _parse_date(entry) -> str:
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        return datetime(*entry.published_parsed[:6]).isoformat()
    if hasattr(entry, "updated_parsed") and entry.updated_parsed:
        return datetime(*entry.updated_parsed[:6]).isoformat()
    return datetime.utcnow().isoformat()


def collect_aitimes() -> list[dict]:
    items = []
    try:
        feed = feedparser.parse(AITIMES_FEED)
        for entry in feed.entries[:30]:
            title = _strip_html(entry.get("title", ""))
            url = entry.get("link", "")
            if not title or not url:
                continue
            summary = ""
            if hasattr(entry, "summary"):
                summary = _strip_html(entry.summary)[:500]
            elif hasattr(entry, "description"):
                summary = _strip_html(entry.description)[:500]
            items.append({
                "title": title, "url": url, "summary": summary,
                "type": "news", "source": "AI Times",
                "published_date": _parse_date(entry),
            })
    except Exception as e:
        print(f"[Collector] AI Times error: {e}")
    return items


# ---------------------------------------------------------------------------
# Hacker News (JSON API) → type: news
# ---------------------------------------------------------------------------

HN_TOP = "https://hacker-news.firebaseio.com/v0/topstories.json"
HN_ITEM = "https://hacker-news.firebaseio.com/v0/item/{}.json"
HN_KEYWORDS = ["ai", "llm", "openai", "claude", "machine learning",
               "deep learning", "agent", "gpt", "transformer",
               "anthropic", "gemini", "mistral", "neural"]


def collect_hackernews() -> list[dict]:
    items = []
    try:
        ids = requests.get(HN_TOP, timeout=10).json()[:50]
        for sid in ids:
            try:
                story = requests.get(HN_ITEM.format(sid), timeout=5).json()
                if not story or story.get("type") != "story":
                    continue
                title = story.get("title", "")
                if not any(kw in title.lower() for kw in HN_KEYWORDS):
                    continue
                url = story.get("url") or f"https://news.ycombinator.com/item?id={sid}"
                ts = story.get("time", 0)
                pub = datetime.utcfromtimestamp(ts).isoformat() if ts else datetime.utcnow().isoformat()
                items.append({
                    "title": title, "url": url, "summary": "",
                    "type": "news", "source": "Hacker News",
                    "published_date": pub,
                })
            except Exception:
                continue
    except Exception as e:
        print(f"[Collector] Hacker News error: {e}")
    return items


# ---------------------------------------------------------------------------
# arXiv (XML API) → type: article
# ---------------------------------------------------------------------------

ARXIV_API = "http://export.arxiv.org/api/query"
ARXIV_CATS = ["cs.AI", "cs.LG", "cs.CL"]


def collect_arxiv() -> list[dict]:
    items = []
    query = "+OR+".join(f"cat:{c}" for c in ARXIV_CATS)
    url = f"{ARXIV_API}?search_query={query}&start=0&max_results=30&sortBy=submittedDate&sortOrder=descending"
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
        ns = {"a": "http://www.w3.org/2005/Atom"}
        for entry in root.findall("a:entry", ns):
            title_el = entry.find("a:title", ns)
            summary_el = entry.find("a:summary", ns)
            pub_el = entry.find("a:published", ns)
            title = " ".join(title_el.text.split()) if title_el is not None and title_el.text else ""
            summary = " ".join(summary_el.text.split())[:500] if summary_el is not None and summary_el.text else ""
            published = pub_el.text[:19] if pub_el is not None and pub_el.text else ""
            link = ""
            for l in entry.findall("a:link", ns):
                if l.get("type") == "text/html":
                    link = l.get("href", "")
                    break
            if not link:
                id_el = entry.find("a:id", ns)
                link = id_el.text if id_el is not None and id_el.text else ""
            if title and link:
                items.append({
                    "title": title, "url": link, "summary": summary,
                    "type": "article", "source": "arXiv",
                    "published_date": published,
                })
    except Exception as e:
        print(f"[Collector] arXiv error: {e}")
    return items


# ---------------------------------------------------------------------------
# GitHub Trending (scraping) → type: article
# ---------------------------------------------------------------------------

GH_URL = "https://github.com/trending"
GH_KEYWORDS = ["ai", "machine-learning", "deep-learning", "llm",
               "transformer", "agent", "gpt", "neural", "language-model",
               "diffusion"]


def collect_github() -> list[dict]:
    items = []
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; AIRadarLite/1.0)"}
        resp = requests.get(GH_URL, headers=headers, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for row in soup.select("article.Box-row"):
            h2 = row.select_one("h2")
            if not h2:
                continue
            a_tag = h2.select_one("a")
            if not a_tag:
                continue
            repo_path = a_tag.get("href", "").strip("/")
            repo_name = repo_path.replace("/", " / ")
            url = f"https://github.com/{repo_path}"
            desc_el = row.select_one("p")
            desc = desc_el.get_text(strip=True) if desc_el else ""
            if not any(kw in f"{repo_name} {desc}".lower() for kw in GH_KEYWORDS):
                continue
            items.append({
                "title": repo_name, "url": url, "summary": desc,
                "type": "article", "source": "GitHub Trending",
                "published_date": "",
            })
    except Exception as e:
        print(f"[Collector] GitHub Trending error: {e}")
    return items


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def collect_all() -> dict:
    """Run all collectors and return counts."""
    all_items = []
    sources = {}

    for name, fn in [("AI Times", collect_aitimes),
                     ("Hacker News", collect_hackernews),
                     ("arXiv", collect_arxiv),
                     ("GitHub Trending", collect_github)]:
        result = fn()
        sources[name] = len(result)
        all_items.extend(result)
        print(f"[Collector] {name}: {len(result)} items")

    from database import save_content
    saved = save_content(all_items)

    return {
        "total_collected": len(all_items),
        "saved": saved,
        "sources": sources,
    }

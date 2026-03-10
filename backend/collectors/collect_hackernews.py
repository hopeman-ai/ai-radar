import requests
from datetime import datetime

TOP_URL = "https://hacker-news.firebaseio.com/v0/topstories.json"
ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/{}.json"
SOURCE = "Hacker News"

KEYWORDS = [
    "ai", "llm", "openai", "claude", "deep learning",
    "machine learning", "agent", "gpt", "transformer",
    "anthropic", "gemini", "mistral", "neural",
]


def matches(title: str) -> bool:
    lower = title.lower()
    return any(kw in lower for kw in KEYWORDS)


def collect() -> list[dict]:
    articles = []
    try:
        resp = requests.get(TOP_URL, timeout=10)
        resp.raise_for_status()
        ids = resp.json()[:50]

        for sid in ids:
            try:
                item = requests.get(ITEM_URL.format(sid), timeout=5).json()
                if not item or item.get("type") != "story":
                    continue
                title = item.get("title", "")
                if not matches(title):
                    continue

                url = item.get("url") or f"https://news.ycombinator.com/item?id={sid}"
                ts = item.get("time", 0)
                published = (
                    datetime.utcfromtimestamp(ts).isoformat() if ts
                    else datetime.utcnow().isoformat()
                )

                articles.append({
                    "title": title,
                    "url": url,
                    "summary": "",
                    "source": SOURCE,
                    "published_date": published,
                    "score": item.get("score", 0),
                })
            except Exception:
                continue
    except Exception as e:
        print(f"[AI Radar] Hacker News error: {e}")
    return articles

import feedparser
import re
from datetime import datetime

FEED_URL = "https://www.aitimes.com/rss/allArticle.xml"
SOURCE = "AI Times"


def strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    for entity, char in [("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"),
                         ("&quot;", '"'), ("&#39;", "'"), ("&lsquo;", "'"),
                         ("&rsquo;", "'"), ("&middot;", ".")]:
        text = text.replace(entity, char)
    return text.strip()


def parse_date(entry) -> str:
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        return datetime(*entry.published_parsed[:6]).isoformat()
    if hasattr(entry, "updated_parsed") and entry.updated_parsed:
        return datetime(*entry.updated_parsed[:6]).isoformat()
    raw = entry.get("published", "")
    if raw:
        try:
            return datetime.strptime(raw.strip(), "%Y-%m-%d %H:%M:%S").isoformat()
        except ValueError:
            pass
    return datetime.utcnow().isoformat()


def collect() -> list[dict]:
    articles = []
    try:
        feed = feedparser.parse(FEED_URL)
        if feed.bozo and not feed.entries:
            print(f"[AI Radar] AI Times RSS parse error: {feed.bozo_exception}")
            return articles

        for entry in feed.entries[:30]:
            title = strip_html(entry.get("title", "")).strip()
            url = entry.get("link", "")
            if not title or not url:
                continue

            summary = ""
            if hasattr(entry, "summary"):
                summary = strip_html(entry.summary)[:500]
            elif hasattr(entry, "description"):
                summary = strip_html(entry.description)[:500]

            articles.append({
                "title": title,
                "url": url,
                "summary": summary,
                "source": SOURCE,
                "published_date": parse_date(entry),
                "score": None,
            })
    except Exception as e:
        print(f"[AI Radar] AI Times error: {e}")
    return articles

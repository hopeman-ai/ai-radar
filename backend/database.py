import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ai_radar_lite.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS content (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT UNIQUE NOT NULL,
            summary TEXT,
            type TEXT NOT NULL CHECK(type IN ('news', 'article')),
            source TEXT NOT NULL,
            published_date TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
        CREATE INDEX IF NOT EXISTS idx_content_created ON content(created_at);
    """)
    conn.commit()
    conn.close()
    print("[AI Radar Lite] Database initialized")


def save_content(items: list[dict]) -> int:
    conn = get_conn()
    saved = 0
    for item in items:
        try:
            conn.execute(
                """INSERT OR IGNORE INTO content
                   (title, url, summary, type, source, published_date)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    item.get("title", "")[:500],
                    item.get("url", ""),
                    item.get("summary", "")[:2000],
                    item.get("type", "news"),
                    item.get("source", ""),
                    item.get("published_date", ""),
                ),
            )
            if conn.total_changes > saved:
                saved = conn.total_changes
        except Exception:
            continue
    conn.commit()
    conn.close()
    return saved


def get_stats() -> dict:
    conn = get_conn()
    news = conn.execute("SELECT COUNT(*) FROM content WHERE type='news'").fetchone()[0]
    articles = conn.execute("SELECT COUNT(*) FROM content WHERE type='article'").fetchone()[0]
    conn.close()
    return {
        "news_count": news,
        "article_count": articles,
        "total": news + articles,
    }


def get_top_news(limit: int = 10) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        """SELECT * FROM content WHERE type='news'
           ORDER BY COALESCE(published_date, created_at) DESC LIMIT ?""",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_top_articles(limit: int = 10) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        """SELECT * FROM content WHERE type='article'
           ORDER BY COALESCE(published_date, created_at) DESC LIMIT ?""",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_content_text(limit: int = 300) -> list[dict]:
    """Get recent titles+summaries for keyword extraction."""
    conn = get_conn()
    rows = conn.execute(
        "SELECT title, summary FROM content ORDER BY created_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [{"title": r[0] or "", "summary": r[1] or ""} for r in rows]

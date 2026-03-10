"""
Database module - SQLite with WAL mode.
Tables: articles, signals, experts, trends.
"""

import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ai_radar.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT UNIQUE NOT NULL,
            summary TEXT,
            source TEXT NOT NULL,
            published_date TEXT,
            score INTEGER,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            importance INTEGER CHECK(importance BETWEEN 1 AND 5),
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS experts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            platform TEXT NOT NULL,
            score REAL,
            insight TEXT,
            insight_type TEXT,
            url TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS trends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT NOT NULL,
            frequency INTEGER DEFAULT 1,
            growth_rate REAL DEFAULT 0.0,
            domain TEXT DEFAULT 'General',
            impact REAL DEFAULT 0.5,
            maturity REAL DEFAULT 0.5,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
        CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at);
        CREATE INDEX IF NOT EXISTS idx_signals_created ON signals(created_at);
        CREATE INDEX IF NOT EXISTS idx_trends_created ON trends(created_at);
        CREATE INDEX IF NOT EXISTS idx_experts_score ON experts(score);
    """)
    conn.commit()
    conn.close()
    print("[AI Radar] Database initialized")


def cleanup_old_data(days: int = 30):
    """Remove data older than N days to prevent database bloat."""
    conn = get_conn()
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    conn.execute("DELETE FROM articles WHERE created_at < ?", (cutoff,))
    conn.execute("DELETE FROM signals WHERE created_at < ?", (cutoff,))
    conn.execute("DELETE FROM experts WHERE created_at < ?", (cutoff,))
    conn.execute("DELETE FROM trends WHERE created_at < ?", (cutoff,))
    conn.commit()
    conn.close()
    print(f"[AI Radar] Cleaned up data older than {days} days")


def save_articles(articles: list[dict]) -> int:
    conn = get_conn()
    saved = 0
    for a in articles:
        try:
            conn.execute(
                """INSERT OR IGNORE INTO articles
                   (title, url, summary, source, published_date, score)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    a.get("title", "")[:500],
                    a.get("url", ""),
                    a.get("summary", "")[:2000],
                    a.get("source", ""),
                    a.get("published_date", ""),
                    a.get("score"),
                ),
            )
            saved += conn.total_changes - saved
        except Exception:
            continue
    conn.commit()
    conn.close()
    return saved


def save_signal(title: str, summary: str, importance: int):
    conn = get_conn()
    conn.execute(
        "INSERT INTO signals (title, summary, importance) VALUES (?, ?, ?)",
        (title, summary, max(1, min(5, importance))),
    )
    conn.commit()
    conn.close()


def save_expert(author: str, platform: str, score: float, insight: str,
                insight_type: str = "", url: str = ""):
    conn = get_conn()
    conn.execute(
        """INSERT INTO experts (author, platform, score, insight, insight_type, url)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (author, platform, score, insight[:1000], insight_type, url),
    )
    conn.commit()
    conn.close()


def save_trends(trends: list[dict]):
    conn = get_conn()
    for t in trends:
        conn.execute(
            """INSERT INTO trends (topic, frequency, growth_rate, domain, impact, maturity)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                t.get("topic", ""),
                t.get("frequency", 1),
                t.get("growth_rate", 0.0),
                t.get("domain", "General"),
                t.get("impact", 0.5),
                t.get("maturity", 0.5),
            ),
        )
    conn.commit()
    conn.close()


def get_articles(limit: int = 100) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM articles ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_signals(limit: int = 50) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM signals ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_experts(limit: int = 50) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM experts ORDER BY score DESC, created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_trends(limit: int = 20) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        """SELECT * FROM trends
           ORDER BY (frequency * growth_rate) DESC, created_at DESC
           LIMIT ?""",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_recent_articles(limit: int = 50) -> list[dict]:
    return get_articles(limit)


def get_stats() -> dict:
    conn = get_conn()
    article_count = conn.execute("SELECT COUNT(*) FROM articles").fetchone()[0]
    signal_count = conn.execute("SELECT COUNT(*) FROM signals").fetchone()[0]
    expert_count = conn.execute("SELECT COUNT(*) FROM experts").fetchone()[0]
    trend_count = conn.execute("SELECT COUNT(*) FROM trends").fetchone()[0]
    sources = conn.execute("SELECT DISTINCT source FROM articles").fetchall()
    last_collected = conn.execute(
        "SELECT MAX(created_at) FROM articles"
    ).fetchone()[0]
    conn.close()
    return {
        "total_articles": article_count,
        "total_signals": signal_count,
        "total_experts": expert_count,
        "total_trends": trend_count,
        "active_sources": [r[0] for r in sources],
        "last_collected": last_collected,
    }

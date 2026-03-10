"""
Signal Generator - LLM-powered AI signal generation.
Supports: Anthropic Claude, OpenAI GPT, Mock fallback.
"""

import os
import json
import re
from database import get_recent_articles, get_trends, save_signal

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


SYSTEM_PROMPT = """You are an elite AI industry analyst. Given recent AI articles and detected trends from multiple sources, generate concise AI signals that capture the most important emerging patterns.

For each signal provide:
- title: concise headline (max 12 words)
- summary: 2-3 sentences explaining the trend, its significance, and potential impact
- importance: 1-5 (1=minor, 3=notable, 5=critical breakthrough)

Return a JSON array of objects with keys: "title", "summary", "importance".
Generate 3-7 signals. Focus on the most significant, distinct trends.
Return ONLY the JSON array, no other text."""


def build_text(articles: list[dict], trends: list[dict] = None) -> str:
    parts = []

    if trends:
        parts.append("=== DETECTED TRENDS ===")
        for t in trends[:10]:
            parts.append(f"Topic: {t['topic']} | Domain: {t.get('domain', 'General')} | "
                        f"Frequency: {t.get('frequency', 0)} | Growth: {t.get('growth_rate', 0)}")
        parts.append("")

    parts.append("=== RECENT ARTICLES ===")
    for a in articles:
        lines = [f"Title: {a['title']}", f"Source: {a['source']}"]
        if a.get("summary"):
            lines.append(f"Summary: {a['summary'][:300]}")
        if a.get("score"):
            lines.append(f"Score: {a['score']}")
        parts.append("\n".join(lines))
        parts.append("---")

    return "\n".join(parts)


def parse_json(text: str) -> list:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    m = re.search(r'\[[\s\S]*\]', text)
    if m:
        try:
            return json.loads(m.group())
        except json.JSONDecodeError:
            pass
    return []


def call_anthropic(text: str) -> list:
    client = anthropic.Anthropic()
    msg = client.messages.create(
        model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Analyze these AI signals:\n\n{text}"}],
    )
    return parse_json(msg.content[0].text)


def call_openai(text: str) -> list:
    client = openai.OpenAI()
    resp = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze these AI signals:\n\n{text}"},
        ],
        max_tokens=2000,
    )
    return parse_json(resp.choices[0].message.content)


def mock_signals(articles: list[dict], trends: list[dict] = None) -> list:
    """Generate signals without LLM when no API key is configured."""
    signals = []

    if trends:
        for t in trends[:3]:
            signals.append({
                "title": f"{t['topic']} gaining momentum",
                "summary": (
                    f"{t['topic']} is showing significant activity with "
                    f"frequency {t.get('frequency', 0)} mentions and "
                    f"{t.get('growth_rate', 0):.0%} growth rate. "
                    f"This trend is emerging in the {t.get('domain', 'AI')} domain."
                ),
                "importance": 4 if t.get("growth_rate", 0) > 0.5 else 3,
            })

    groups: dict[str, list] = {}
    for a in articles:
        groups.setdefault(a["source"], []).append(a)

    for source, arts in groups.items():
        if len(signals) >= 6:
            break
        top = arts[0]
        signals.append({
            "title": f"Notable signal from {source}",
            "summary": (
                f"{top['title'][:100]}. "
                f"Detected across {len(arts)} articles from {source}. "
                f"Indicates growing activity in this area."
            ),
            "importance": 4 if len(arts) > 5 else 3,
        })

    return signals[:7]


def generate_signals() -> dict:
    articles = get_recent_articles(50)
    trends = get_trends(10)

    if not articles:
        print("[AI Radar] No articles found for signal generation")
        return {"generated": 0, "error": "No articles found. Run /api/collect first."}

    text = build_text(articles, trends)
    signals = []

    if HAS_ANTHROPIC and os.getenv("ANTHROPIC_API_KEY"):
        try:
            print("[AI Radar] Generating signals with Anthropic Claude")
            signals = call_anthropic(text)
        except Exception as e:
            print(f"[AI Radar] Anthropic error: {e}")

    if not signals and HAS_OPENAI and os.getenv("OPENAI_API_KEY"):
        try:
            print("[AI Radar] Generating signals with OpenAI")
            signals = call_openai(text)
        except Exception as e:
            print(f"[AI Radar] OpenAI error: {e}")

    if not signals:
        print("[AI Radar] Using mock signal generation (no API key)")
        signals = mock_signals(articles, trends)

    count = 0
    for s in signals:
        title = s.get("title", "")
        summary = s.get("summary", "")
        importance = s.get("importance", 3)
        if isinstance(importance, str):
            importance = int(importance) if importance.isdigit() else 3
        if title and summary:
            save_signal(title, summary, importance)
            count += 1

    print(f"[AI Radar] {count} signals generated")
    return {"generated": count}

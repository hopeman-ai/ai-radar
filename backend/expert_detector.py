"""
Expert Detection Module
Identifies high-value AI insights from social sources.
Analyzes Hacker News stories for expert-level content.
"""

import requests
from database import get_conn, save_expert

TECHNICAL_KEYWORDS = [
    "architecture", "benchmark", "evaluation", "fine-tuning", "inference",
    "latency", "throughput", "scaling", "ablation", "attention mechanism",
    "gradient", "loss function", "embedding", "tokenizer", "rlhf",
    "distillation", "quantization", "sparse", "moe", "transformer",
    "diffusion", "retrieval", "alignment", "hallucination", "prompt",
    "chain of thought", "tool use", "function calling", "agentic",
    "context window", "reasoning", "multimodal", "zero-shot", "few-shot",
]

INSIGHT_TYPES = {
    "research": ["paper", "arxiv", "research", "study", "finding", "experiment",
                 "benchmark", "evaluation", "ablation"],
    "tool_discovery": ["release", "launch", "open-source", "github", "library",
                       "framework", "tool", "sdk", "api", "plugin"],
    "industry_trend": ["market", "enterprise", "adoption", "revenue", "funding",
                       "startup", "acquisition", "partnership", "regulation"],
    "workflow": ["workflow", "tutorial", "how to", "guide", "tips", "productivity",
                 "best practice", "pattern", "recipe"],
}

HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item/{}.json"


def compute_keyword_density(text: str) -> float:
    text_lower = text.lower()
    words = text_lower.split()
    if not words:
        return 0.0
    matches = sum(1 for kw in TECHNICAL_KEYWORDS if kw in text_lower)
    return round(matches / max(len(words), 1) * 100, 2)


def classify_insight(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for itype, keywords in INSIGHT_TYPES.items():
        scores[itype] = sum(1 for kw in keywords if kw in text_lower)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"


def compute_expert_score(item: dict, keyword_density: float) -> float:
    hn_score = item.get("score", 0)
    descendants = item.get("descendants", 0)
    engagement = (hn_score * 0.7 + descendants * 0.3)
    density_boost = 1.0 + (keyword_density * 0.1)
    return round(engagement * density_boost, 2)


def detect_experts() -> dict:
    """Analyze HN top stories to find expert insights."""
    experts_found = []

    try:
        resp = requests.get(
            "https://hacker-news.firebaseio.com/v0/topstories.json", timeout=10
        )
        resp.raise_for_status()
        story_ids = resp.json()[:50]

        ai_keywords = ["ai", "llm", "gpt", "claude", "machine learning",
                        "deep learning", "neural", "transformer", "agent",
                        "openai", "anthropic", "model"]

        for sid in story_ids:
            try:
                item = requests.get(HN_ITEM_URL.format(sid), timeout=5).json()
                if not item or item.get("type") != "story":
                    continue

                title = item.get("title", "")
                title_lower = title.lower()

                if not any(kw in title_lower for kw in ai_keywords):
                    continue

                author = item.get("by", "unknown")
                url = item.get("url", f"https://news.ycombinator.com/item?id={sid}")
                text = f"{title} {item.get('text', '')}"

                density = compute_keyword_density(text)
                score = compute_expert_score(item, density)
                insight_type = classify_insight(text)

                if score > 5:
                    expert_data = {
                        "author": author,
                        "platform": "Hacker News",
                        "score": score,
                        "insight": title,
                        "insight_type": insight_type,
                        "url": url,
                    }
                    experts_found.append(expert_data)

                    save_expert(
                        author=author,
                        platform="Hacker News",
                        score=score,
                        insight=title,
                        insight_type=insight_type,
                        url=url,
                    )
            except Exception:
                continue

    except Exception as e:
        print(f"[AI Radar] Expert detection error: {e}")

    try:
        conn = get_conn()
        high_score_articles = conn.execute(
            """SELECT title, url, source, score FROM articles
               WHERE score IS NOT NULL AND score > 50
               ORDER BY score DESC LIMIT 20"""
        ).fetchall()
        conn.close()

        for row in high_score_articles:
            text = row["title"]
            density = compute_keyword_density(text)
            if density > 0:
                art_score = (row["score"] or 0) * (1 + density * 0.05)
                insight_type = classify_insight(text)
                expert_data = {
                    "author": f"{row['source']} Top",
                    "platform": row["source"],
                    "score": round(art_score, 2),
                    "insight": row["title"],
                    "insight_type": insight_type,
                    "url": row["url"],
                }
                experts_found.append(expert_data)
    except Exception as e:
        print(f"[AI Radar] DB expert analysis error: {e}")

    experts_found.sort(key=lambda x: x["score"], reverse=True)
    top_experts = experts_found[:20]

    print(f"[AI Radar] {len(top_experts)} expert insights detected")
    return {"detected": len(top_experts), "experts": top_experts}

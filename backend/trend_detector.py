"""
Trend Detection Module
Analyzes collected articles to detect emerging AI trends.
Uses keyword frequency analysis and growth rate computation.
"""

import re
from collections import Counter
from datetime import datetime, timedelta
from database import get_conn, save_trends

DOMAIN_KEYWORDS = {
    "AI Models": ["gpt", "llm", "language model", "foundation model", "claude",
                  "gemini", "mistral", "llama", "transformer", "fine-tuning",
                  "pre-training", "multimodal", "reasoning"],
    "AI Coding": ["copilot", "code generation", "coding", "developer tool",
                  "ide", "debugging", "software engineer", "vscode",
                  "cursor", "devin", "swe-bench"],
    "AI Infrastructure": ["inference", "training", "gpu", "tpu", "mlops",
                          "deployment", "serving", "optimization", "quantization",
                          "distillation", "hardware", "chip", "nvidia", "cloud"],
    "AI Research": ["arxiv", "paper", "benchmark", "evaluation", "alignment",
                    "safety", "interpretability", "rlhf", "synthetic data",
                    "hallucination", "emergent"],
    "AI Applications": ["agent", "agentic", "rag", "retrieval", "chatbot",
                        "automation", "workflow", "tool use", "function calling",
                        "enterprise", "healthcare", "finance", "robotics"],
}

TOPIC_PATTERNS = [
    r"\b(agentic\s+ai)\b", r"\b(ai\s+agents?)\b", r"\b(rag)\b",
    r"\b(fine[\s-]?tuning)\b", r"\b(open[\s-]?source\s+(?:llm|model)s?)\b",
    r"\b(multimodal)\b", r"\b(reasoning)\b", r"\b(code\s+generation)\b",
    r"\b(synthetic\s+data)\b", r"\b(inference\s+(?:cost|optimization|speed))\b",
    r"\b(alignment)\b", r"\b(ai\s+safety)\b", r"\b(mcp|model\s+context\s+protocol)\b",
    r"\b(tool\s+use|function\s+calling)\b", r"\b(ai\s+coding)\b",
    r"\b(vision\s+(?:model|language))\b", r"\b(embedding)\b",
    r"\b(quantization)\b", r"\b(diffusion)\b", r"\b(transformer)\b",
    r"\b(reinforcement\s+learning)\b", r"\b(robotics)\b",
    r"\b(ai\s+regulation|ai\s+governance)\b", r"\b(ai\s+hardware)\b",
    r"\b(edge\s+ai)\b", r"\b(small\s+(?:language\s+)?models?)\b",
    r"\b(text[\s-]to[\s-](?:image|video|speech|3d))\b",
    r"\b(world\s+model)\b", r"\b(ai\s+workflow)\b",
]


def classify_domain(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for domain, keywords in DOMAIN_KEYWORDS.items():
        scores[domain] = sum(1 for kw in keywords if kw in text_lower)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "General"


def extract_topics(text: str) -> list[str]:
    text_lower = text.lower()
    found = []
    for pattern in TOPIC_PATTERNS:
        matches = re.findall(pattern, text_lower)
        found.extend(matches)
    return list(set(found))


def compute_growth_rate(current_freq: int, previous_freq: int) -> float:
    if previous_freq == 0:
        return 2.0 if current_freq > 0 else 0.0
    return round((current_freq - previous_freq) / previous_freq, 2)


def detect_trends() -> dict:
    conn = get_conn()

    cutoff_recent = (datetime.utcnow() - timedelta(hours=24)).isoformat()
    recent = conn.execute(
        "SELECT title, summary, source, score FROM articles WHERE created_at > ?",
        (cutoff_recent,),
    ).fetchall()

    cutoff_old = (datetime.utcnow() - timedelta(hours=72)).isoformat()
    older = conn.execute(
        "SELECT title, summary FROM articles WHERE created_at > ? AND created_at <= ?",
        (cutoff_old, cutoff_recent),
    ).fetchall()
    conn.close()

    if not recent:
        conn2 = get_conn()
        recent = conn2.execute(
            "SELECT title, summary, source, score FROM articles ORDER BY created_at DESC LIMIT 100"
        ).fetchall()
        older = []
        conn2.close()

    recent_topics = Counter()
    topic_sources = {}
    for row in recent:
        text = f"{row['title']} {row['summary'] or ''}"
        topics = extract_topics(text)
        for t in topics:
            recent_topics[t] += 1
            if t not in topic_sources:
                topic_sources[t] = set()
            topic_sources[t].add(row["source"])

    older_topics = Counter()
    for row in older:
        text = f"{row['title']} {row['summary'] or ''}"
        for t in extract_topics(text):
            older_topics[t] += 1

    trends = []
    for topic, freq in recent_topics.most_common(15):
        growth = compute_growth_rate(freq, older_topics.get(topic, 0))
        domain = classify_domain(topic)
        trend_score = freq * max(growth, 0.1)
        impact = min(1.0, trend_score / 10.0)
        maturity = min(1.0, 0.3 + (older_topics.get(topic, 0) / max(freq, 1)) * 0.5)

        trends.append({
            "topic": topic.title(),
            "frequency": freq,
            "growth_rate": growth,
            "domain": domain,
            "impact": round(impact, 2),
            "maturity": round(maturity, 2),
            "trend_score": round(trend_score, 2),
            "sources": list(topic_sources.get(topic, [])),
        })

    trends.sort(key=lambda x: x["trend_score"], reverse=True)
    top_trends = trends[:10]

    if top_trends:
        save_trends(top_trends)
        print(f"[AI Radar] {len(top_trends)} trends detected")
    else:
        print("[AI Radar] No trends detected from current articles")

    return {"detected": len(top_trends), "trends": top_trends}

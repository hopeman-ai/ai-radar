"""Generate issue summaries from collected content using LLM or mock fallback."""

import os
import json
import re
from database import get_all_content_text, get_top_news, get_top_articles

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


SYSTEM_PROMPT = """You are an AI industry analyst. Given recent AI news and articles, identify the 3-5 most significant issues or trends happening right now.

For each issue provide a single concise sentence (max 15 words) that captures the trend.

Return a JSON array of strings. Example:
["Open-source LLM momentum increasing", "AI coding automation accelerating"]

Return ONLY the JSON array, no other text."""


def _build_context() -> str:
    news = get_top_news(15)
    articles = get_top_articles(15)
    parts = ["=== RECENT AI NEWS ==="]
    for n in news:
        parts.append(f"- {n['title']} ({n['source']})")
    parts.append("\n=== RECENT AI ARTICLES ===")
    for a in articles:
        parts.append(f"- {a['title']} ({a['source']})")
    return "\n".join(parts)


def _parse_json(text: str) -> list:
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


def _call_anthropic(context: str) -> list:
    client = anthropic.Anthropic()
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Analyze:\n\n{context}"}],
    )
    return _parse_json(msg.content[0].text)


def _call_openai(context: str) -> list:
    client = openai.OpenAI()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze:\n\n{context}"},
        ],
        max_tokens=500,
    )
    return _parse_json(resp.choices[0].message.content)


def _mock_issues() -> list[str]:
    """Generate issues from keyword patterns without LLM."""
    texts = get_all_content_text(100)
    if not texts:
        return ["No data collected yet"]

    full = " ".join(t["title"].lower() for t in texts)

    issues = []
    patterns = [
        ("open source", "Open-source AI tools gaining momentum"),
        ("llm", "LLM development and adoption accelerating"),
        ("agent", "AI agent ecosystem rapidly expanding"),
        ("inference", "Inference optimization becoming competitive focus"),
        ("code", "AI-powered code generation advancing"),
        ("safety", "AI safety and alignment gaining attention"),
        ("multimodal", "Multimodal AI capabilities expanding"),
        ("reasoning", "AI reasoning capabilities improving"),
        ("gpu", "GPU and hardware competition intensifying"),
        ("benchmark", "AI model benchmarking evolving"),
    ]

    for keyword, issue in patterns:
        if keyword in full and len(issues) < 5:
            issues.append(issue)

    if not issues:
        issues = ["AI industry showing broad activity across multiple domains"]

    return issues


def generate_issues() -> list[str]:
    """Generate issue summaries. Returns list of issue strings."""
    context = _build_context()

    issues = []

    if HAS_ANTHROPIC and os.getenv("ANTHROPIC_API_KEY"):
        try:
            issues = _call_anthropic(context)
        except Exception as e:
            print(f"[Issues] Anthropic error: {e}")

    if not issues and HAS_OPENAI and os.getenv("OPENAI_API_KEY"):
        try:
            issues = _call_openai(context)
        except Exception as e:
            print(f"[Issues] OpenAI error: {e}")

    if not issues:
        issues = _mock_issues()

    # Ensure all items are strings
    return [str(i) for i in issues[:5]]

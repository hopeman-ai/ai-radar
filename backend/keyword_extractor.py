"""Extract top keywords from collected content."""

import re
from database import get_all_content_text

STOP_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "need", "to", "of", "in", "for", "on",
    "with", "at", "by", "from", "as", "into", "through", "during", "before",
    "after", "above", "below", "between", "out", "off", "over", "under",
    "again", "further", "then", "once", "here", "there", "when", "where",
    "why", "how", "all", "both", "each", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
    "too", "very", "just", "about", "also", "new", "one", "two", "first",
    "last", "long", "great", "little", "right", "big", "high", "different",
    "small", "large", "next", "early", "young", "important", "public", "bad",
    "able", "and", "but", "or", "if", "while", "because", "that", "this",
    "these", "those", "it", "its", "what", "which", "who", "whom", "we",
    "they", "i", "you", "he", "she", "my", "your", "his", "her", "our",
    "their", "me", "him", "us", "them", "up", "down", "make", "made",
    "using", "use", "based", "like", "via", "get", "way", "now", "year",
    "years", "time", "show", "shows", "study", "work", "paper", "data",
    "approach", "system", "method", "results", "learning", "world", "part",
    "find", "day", "know", "model", "models", "many", "much", "well",
    "been", "set", "even", "still", "take", "however", "given", "propose",
    "proposed", "used", "task", "tasks", "performance", "without", "information",
}

KNOWN_PHRASES = [
    "ai agents", "large language model", "language model", "open source",
    "foundation model", "machine learning", "deep learning",
    "natural language", "computer vision", "reinforcement learning",
    "neural network", "generative ai", "code generation",
    "fine tuning", "prompt engineering", "retrieval augmented",
    "chain of thought", "mixture of experts", "multimodal",
    "edge ai", "small language model",
]

IMPORTANT_SINGLE = {
    "llm", "gpt", "claude", "openai", "anthropic", "gemini", "mistral",
    "inference", "rag", "mcp", "transformer", "diffusion", "benchmark",
    "gpu", "reasoning", "alignment", "safety", "hallucination",
    "embedding", "quantization", "robotics", "autonomous", "copilot",
    "agentic", "synthetic", "chatbot",
}


def extract_keywords(limit: int = 10) -> list[dict]:
    rows = get_all_content_text(300)
    if not rows:
        return []

    full_text = ""
    for r in rows:
        full_text += " " + r["title"].lower() + " " + r["summary"].lower()

    freq: dict[str, int] = {}

    # Multi-word phrases
    for phrase in KNOWN_PHRASES:
        count = full_text.count(phrase)
        if count > 0:
            freq[phrase.title()] = freq.get(phrase.title(), 0) + count

    # Important single terms
    words = re.findall(r'[a-z][a-z\-]+', full_text)
    for w in words:
        if w in STOP_WORDS or len(w) < 3:
            continue
        if w in IMPORTANT_SINGLE:
            display = w.upper() if len(w) <= 4 else w.title()
            freq[display] = freq.get(display, 0) + 1

    sorted_kw = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [{"keyword": k, "count": c} for k, c in sorted_kw[:limit]]

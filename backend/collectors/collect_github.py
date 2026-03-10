import requests
from bs4 import BeautifulSoup

TRENDING_URL = "https://github.com/trending"
SOURCE = "GitHub Trending"

KEYWORDS = [
    "ai", "machine-learning", "deep-learning", "llm",
    "transformer", "agent", "gpt", "neural", "language-model",
    "diffusion",
]


def matches(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in KEYWORDS)


def collect() -> list[dict]:
    articles = []
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; AIRadar/2.0)"}
        resp = requests.get(TRENDING_URL, headers=headers, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        rows = soup.select("article.Box-row")
        for row in rows:
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
            description = desc_el.get_text(strip=True) if desc_el else ""

            if not matches(f"{repo_name} {description}"):
                continue

            stars = 0
            stars_el = row.select_one("a[href$='/stargazers']")
            if stars_el:
                stars_text = stars_el.get_text(strip=True).replace(",", "")
                try:
                    stars = int(stars_text)
                except ValueError:
                    pass

            articles.append({
                "title": repo_name,
                "url": url,
                "summary": description,
                "source": SOURCE,
                "published_date": "",
                "score": stars,
            })
    except Exception as e:
        print(f"[AI Radar] GitHub Trending error: {e}")
    return articles

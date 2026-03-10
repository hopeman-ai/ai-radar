from collectors.collect_aitimes import collect as collect_aitimes
from collectors.collect_hackernews import collect as collect_hackernews
from collectors.collect_github import collect as collect_github
from collectors.collect_arxiv import collect as collect_arxiv


def collect_all_sources() -> dict:
    from database import save_articles

    results = {}
    all_articles = []

    collectors = [
        ("AI Times", collect_aitimes),
        ("Hacker News", collect_hackernews),
        ("GitHub Trending", collect_github),
        ("arXiv", collect_arxiv),
    ]

    for name, collector_fn in collectors:
        print(f"[AI Radar] Collecting {name}")
        try:
            articles = collector_fn()
            all_articles.extend(articles)
            results[name] = len(articles)
            print(f"[AI Radar] {name} collected: {len(articles)} articles")
        except Exception as e:
            results[name] = 0
            print(f"[AI Radar] {name} failed: {e}")

    saved = save_articles(all_articles)
    print(f"[AI Radar] {saved} articles saved to database")

    total = sum(results.values())
    return {"sources": results, "total_collected": total, "total_saved": saved}

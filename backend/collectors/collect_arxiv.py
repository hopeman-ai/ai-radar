import requests
import xml.etree.ElementTree as ET

ARXIV_API = "http://export.arxiv.org/api/query"
SOURCE = "arXiv"
CATEGORIES = ["cs.AI", "cs.LG", "cs.CL"]


def collect() -> list[dict]:
    articles = []
    query = "+OR+".join(f"cat:{c}" for c in CATEGORIES)
    url = f"{ARXIV_API}?search_query={query}&start=0&max_results=30&sortBy=submittedDate&sortOrder=descending"

    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}

        for entry in root.findall("atom:entry", ns):
            title_el = entry.find("atom:title", ns)
            summary_el = entry.find("atom:summary", ns)
            published_el = entry.find("atom:published", ns)

            title = " ".join(title_el.text.split()) if title_el is not None and title_el.text else ""
            summary = " ".join(summary_el.text.split())[:500] if summary_el is not None and summary_el.text else ""
            published = published_el.text[:19] if published_el is not None and published_el.text else ""

            link = ""
            for link_el in entry.findall("atom:link", ns):
                if link_el.get("type") == "text/html":
                    link = link_el.get("href", "")
                    break
            if not link:
                id_el = entry.find("atom:id", ns)
                link = id_el.text if id_el is not None and id_el.text else ""

            authors = []
            for author_el in entry.findall("atom:author", ns):
                name_el = author_el.find("atom:name", ns)
                if name_el is not None and name_el.text:
                    authors.append(name_el.text)
            author_str = ", ".join(authors[:5])
            if len(authors) > 5:
                author_str += f" et al. ({len(authors)} authors)"

            full_summary = f"Authors: {author_str}\n{summary}" if author_str else summary

            if title and link:
                articles.append({
                    "title": title,
                    "url": link,
                    "summary": full_summary,
                    "source": SOURCE,
                    "published_date": published,
                    "score": None,
                })
    except Exception as e:
        print(f"[AI Radar] arXiv error: {e}")
    return articles

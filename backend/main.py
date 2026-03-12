from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_stats, get_top_news, get_top_articles
from collector import collect_all
from keyword_extractor import extract_keywords
from issue_generator import generate_issues


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("[AI Radar Lite] Server started")
    yield
    print("[AI Radar Lite] Server stopped")


app = FastAPI(title="AI Radar Lite", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Cached state (regenerated on collect/generate) ---
_cache: dict = {"keywords": [], "issues": []}


@app.get("/api/stats")
def stats():
    return get_stats()


@app.get("/api/keywords")
def keywords():
    return _cache["keywords"]


@app.get("/api/issues")
def issues():
    return _cache["issues"]


@app.get("/api/top-news")
def top_news(limit: int = 10):
    return get_top_news(limit)


@app.get("/api/top-articles")
def top_articles(limit: int = 10):
    return get_top_articles(limit)


@app.post("/api/collect")
def run_collect():
    result = collect_all()
    kw = extract_keywords(10)
    iss = generate_issues()
    _cache["keywords"] = kw
    _cache["issues"] = iss
    return {
        **result,
        "keywords_extracted": len(kw),
        "issues_generated": len(iss),
    }


@app.post("/api/generate")
def run_generate():
    s = get_stats()
    _cache["keywords"] = extract_keywords(10)
    _cache["issues"] = generate_issues()
    return {
        **s,
        "top_news": get_top_news(10),
        "top_articles": get_top_articles(10),
    }

"""
AI Radar - Backend API Server
FastAPI application that collects AI news, detects trends, and generates insights.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_articles, get_signals, get_experts, get_trends, get_stats
from collectors import collect_all_sources
from signal_generator import generate_signals
from trend_detector import detect_trends
from expert_detector import detect_experts
from scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_scheduler()
    print("[AI Radar] Server started")
    yield
    stop_scheduler()
    print("[AI Radar] Server stopped")


app = FastAPI(
    title="AI Radar API",
    version="2.0.0",
    description="Real-time AI Intelligence Dashboard API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    stats = get_stats()
    return {"status": "ok", "version": "2.0.0", **stats}


@app.get("/api/articles")
def list_articles(limit: int = 100):
    return get_articles(limit)


@app.get("/api/signals")
def list_signals(limit: int = 50):
    return get_signals(limit)


@app.get("/api/trends")
def list_trends(limit: int = 20):
    return get_trends(limit)


@app.get("/api/experts")
def list_experts(limit: int = 50):
    return get_experts(limit)


@app.post("/api/collect")
def run_collect():
    result = collect_all_sources()
    trend_result = detect_trends()
    expert_result = detect_experts()
    return {
        **result,
        "trends_detected": trend_result.get("detected", 0),
        "experts_detected": expert_result.get("detected", 0),
    }


@app.post("/api/generate")
def run_generate():
    return generate_signals()

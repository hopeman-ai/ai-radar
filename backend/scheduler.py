"""
Scheduler - Runs the full pipeline every 30 minutes.
Pipeline: collect -> detect trends -> detect experts -> generate signals -> cleanup
"""

from apscheduler.schedulers.background import BackgroundScheduler
from collectors import collect_all_sources

scheduler = BackgroundScheduler()


def run_full_pipeline():
    from trend_detector import detect_trends
    from expert_detector import detect_experts
    from signal_generator import generate_signals
    from database import cleanup_old_data

    print("[AI Radar] === Starting full pipeline ===")
    collect_all_sources()
    detect_trends()
    detect_experts()
    generate_signals()
    cleanup_old_data(days=30)
    print("[AI Radar] === Pipeline complete ===")


def start_scheduler():
    scheduler.add_job(
        run_full_pipeline,
        "interval",
        minutes=30,
        id="full_pipeline",
        replace_existing=True,
    )
    scheduler.start()
    print("[AI Radar] Scheduler started - full pipeline every 30 minutes")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[AI Radar] Scheduler stopped")

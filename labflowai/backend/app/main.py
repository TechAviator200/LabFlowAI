"""
LabFlow AI — FastAPI entry point.
"""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import workflows, documents, runs, audit

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("LabFlowAI backend starting...")
    print(f"  env:        {settings.app_env}")
    print(f"  demo_mode:  {settings.demo_mode}")
    print(f"  db:         {'mock (in-memory)' if (not settings.supabase_url or settings.use_mock_db) else 'supabase'}")
    print(f"  llm:        {'heuristic fallback' if not settings.llm_api_key else settings.llm_model}")
    if settings.demo_mode:
        _maybe_seed_demo()
    yield


def _maybe_seed_demo():
    """Seed demo workflows if the table is empty and DEMO_MODE=true."""
    try:
        from app.database import get_db
        db = get_db()
        count = db.table("workflows").select("id", count="exact").execute().count
        if count and count > 0:
            return
        logger.info("DEMO_MODE: seeding example workflows…")
        from seeds.seed_demo import run_seed
        run_seed(db)
    except Exception as e:
        logger.warning("Demo seed skipped: %s", e)


app = FastAPI(
    title="LabFlow AI API",
    description=(
        "AI copilot for biotech R&D teams. "
        "⚠️ DEMO/SANDBOX — not validated for GxP or regulatory use."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflows.router)
app.include_router(documents.router)
app.include_router(runs.router)
app.include_router(audit.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "env": settings.app_env, "demo_mode": settings.demo_mode}

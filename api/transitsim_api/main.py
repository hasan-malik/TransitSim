"""
TransitSim public API — entrypoint.

The simulation core lives in ``analysis/engine.py`` and is the single
source of truth.  This module is a thin transport layer:

    request body ──> Pydantic schema ──> engine ──> Pydantic response

The HTTP surface is intentionally tiny in v1 — one POST endpoint plus
operational pings — because the engine is itself a pure function of
the modal-mix input.  Future endpoints (presets, model metadata,
inverse optimisation) are listed as TODOs at the bottom of this file
so the public-API contract has a single, scannable home.

Run locally:
    pip install -e .[api,dev]
    uvicorn transitsim_api.main:app --reload --app-dir api

Run in a container:
    docker build -f api/Dockerfile -t transitsim-api . && docker run -p 8000:8000 transitsim-api
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from analysis.engine import BPRParams, calculate_metrics

from . import __version__
from .schemas import (
    ModalMix,
    RadarScores,
    SimulateRequest,
    SimulateResponse,
)

logger = logging.getLogger("transitsim_api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


# ─── App lifecycle ──────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm the engine on startup so the first request isn't slow.

    Loading ``analysis.engine`` triggers ``calibrated.json`` parsing and
    NumPy import; a single dummy call ensures all of that is paid up-front.
    """
    _ = calculate_metrics({"car": 50, "subway": 50})  # warm-up
    bpr = BPRParams().as_dict()
    logger.info("engine warm; BPR=%s", bpr)
    yield
    logger.info("shutdown")


# ─── App ────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="TransitSim API",
    version=__version__,
    summary="Evidence-based modal-share simulator for downtown Toronto",
    description=(
        "Public, deterministic API around the TransitSim simulation core.\n\n"
        "Given a six-mode modal-share vector "
        "(car, bus, subway, cycling, pedestrian, other), the engine returns "
        "13 sustainability metrics (CO₂e, PM2.5, NOₓ, congestion, commute time, "
        "noise dB(A), health, productivity, equity, cost) plus a composite "
        "0–100 score and letter grade.\n\n"
        "Every coefficient is sourced from peer-reviewed literature or "
        "published transit-agency data; the volume-delay function uses "
        "Bayesian-calibrated coefficients fit to observed Toronto downtown "
        "(V/C, speed) data.  See [the About page](https://github.com/hasanmalik/TransitSim) "
        "for the full methodology and citation list."
    ),
    contact={"name": "Hasan Malik", "url": "https://github.com/hasanmalik/TransitSim"},
    license_info={"name": "MIT Licence",
                  "url": "https://github.com/hasanmalik/TransitSim/blob/main/LICENSE"},
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS: v1 is a public, read-only API — allow any origin.  Tighten if we
# later add stateful endpoints (rate limits, auth).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def _access_log(request: Request, call_next):
    """Minimal structured access log — one line per request with latency."""
    t0 = time.perf_counter()
    try:
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.info(
            'method=%s path=%s status=%d latency_ms=%.1f',
            request.method, request.url.path, response.status_code, elapsed_ms,
        )
        return response
    except Exception:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.exception(
            'method=%s path=%s status=500 latency_ms=%.1f (unhandled)',
            request.method, request.url.path, elapsed_ms,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "internal_error"},
        )


# ─── Operational endpoints (unversioned, terse) ─────────────────────────────

@app.get("/", include_in_schema=False)
def index() -> dict:
    return {
        "name": "TransitSim API",
        "version": __version__,
        "docs": "/docs",
        "endpoints": ["POST /v1/simulate"],
    }


@app.get("/health", include_in_schema=False)
def health() -> dict:
    """Liveness probe.  Doesn't touch the engine — just confirms the process is up."""
    return {"status": "ok"}


# ─── v1 endpoints ───────────────────────────────────────────────────────────

@app.post(
    "/v1/simulate",
    response_model=SimulateResponse,
    tags=["simulate"],
    summary="Run the simulator on a given modal-share scenario",
    response_description="Full metrics for the supplied modal mix",
)
def simulate(body: SimulateRequest) -> SimulateResponse:
    """Run a single deterministic simulation.

    The request body carries a ``mix`` object — six optional percentage
    shares.  Missing fields default to 0; the engine then normalises the
    vector so partial inputs are valid.  An all-zero mix returns the
    Toronto 2022 Cordon-Count baseline rather than erroring.

    The response carries the full 13-metric output plus the composite
    score, letter grade, and the seven integer-rounded radar sub-scores.
    Identical inputs always produce identical outputs.
    """
    raw = body.mix.as_engine_dict()
    metrics = calculate_metrics(raw)

    return SimulateResponse(
        mix=ModalMix(**metrics["mix"]),
        co2_tonnes=metrics["co2_tonnes"],
        pm25_tonnes=metrics["pm25_tonnes"],
        pm25_ambient=metrics["pm25_ambient"],
        nox_tonnes=metrics["nox_tonnes"],
        congestion_index=metrics["congestion_index"],
        avg_commute_min=metrics["avg_commute_min"],
        avg_speed_kmh=metrics["avg_speed_kmh"],
        noise_dba=metrics["noise_dba"],
        health_index=metrics["health_index"],
        productivity_index=metrics["productivity_index"],
        equity_index=metrics["equity_index"],
        cost_mday=metrics["cost_mday"],
        overall_score=metrics["overall_score"],
        grade=metrics["grade"],
        scores=RadarScores(**metrics["scores"]),
    )


# ─── Roadmap (not yet implemented) ──────────────────────────────────────────
# GET  /v1/scenarios        — list named presets (transformto_2050, brt, …)
# GET  /v1/scenarios/{id}   — fetch one preset + run it
# GET  /v1/model            — coefficients, citations, calibrated BPR posteriors
# POST /v1/optimize         — inverse optimisation (wraps analysis/optimization.py)

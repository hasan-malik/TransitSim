# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the TransitSim public API.
#
# Build context is the repo root, not api/ — the engine lives in
# analysis/ and the calibrated coefficients live in src/models/, so we
# need to pull from both.  From the repo root:
#
#     docker build -f api/Dockerfile -t transitsim-api .
#     docker run --rm -p 8000:8000 transitsim-api
#
# The image scales-to-zero cleanly on Cloud Run / App Runner because
# uvicorn shuts down on SIGTERM and the lifespan handler logs cleanly.

# ────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder: resolve & install all wheels into a virtualenv we
# can copy verbatim into the slim runtime.  Keeping build tools out of
# the final image cuts ~150 MB and shrinks the attack surface.
# ────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    UV_SYSTEM_PYTHON=1

WORKDIR /build

# Copy only the dep-manifest first so we don't bust the wheel cache on
# every source-code edit.
COPY pyproject.toml ./
COPY README.md ./

RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install ".[api]"

# ────────────────────────────────────────────────────────────────────────────
# Stage 2 — runtime: distroless would be tighter but slim keeps shells
# available for debugging on Cloud Run / Fly.  Image ends ~180 MB.
# ────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH="/app:/app/api"

# Non-root user (best-practice; some platforms require it)
RUN groupadd --system app && useradd --system --gid app --home /app app

WORKDIR /app

# Copy the venv from the builder stage.
COPY --from=builder /opt/venv /opt/venv

# Application code.  We deliberately copy only what the engine + API
# actually need at runtime: the engine module, its calibrated.json,
# and the API package.  The Bayesian calibration / optimization
# scripts pull in pymc/scipy/arviz and aren't needed to serve traffic.
COPY analysis/__init__.py             /app/analysis/__init__.py
COPY analysis/engine.py               /app/analysis/engine.py
COPY src/models/calibrated.json       /app/src/models/calibrated.json
COPY api/transitsim_api/              /app/api/transitsim_api/
COPY LICENSE README.md                /app/

USER app

# Cloud Run / App Runner inject $PORT; default to 8000 locally.
ENV PORT=8000
EXPOSE 8000

# Liveness check — mirrors the GET /health route.  ``python -c`` keeps
# the image curl-less; the only out-of-stdlib dep is the venv.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request,sys; \
sys.exit(0 if urllib.request.urlopen(f'http://127.0.0.1:{__import__(\"os\").environ.get(\"PORT\",\"8000\")}/health',timeout=3).status==200 else 1)"

# ``exec`` form so uvicorn receives SIGTERM directly (clean shutdown).
# ``--proxy-headers`` makes us trust X-Forwarded-* from the load
# balancer.  ``--forwarded-allow-ips=*`` is required on Cloud Run
# because the proxy IP is the platform's, not 127.0.0.1.
CMD exec uvicorn transitsim_api.main:app \
    --host 0.0.0.0 \
    --port ${PORT} \
    --proxy-headers \
    --forwarded-allow-ips='*' \
    --log-level info

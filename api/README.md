# TransitSim API

Public, deterministic HTTP API around the TransitSim simulation core.

Given a six-mode modal-share vector (`car`, `bus`, `subway`, `cycling`,
`pedestrian`, `other`), the engine returns 13 sustainability metrics
(CO₂e, PM2.5, NOx, congestion, commute time, noise dB(A), health,
productivity, equity, cost) plus a composite 0–100 score and letter
grade. The math comes from [`analysis/engine.py`](../analysis/engine.py)
— the same engine the web app ships, kept in lock-step with the JS
implementation by [`tests/test_parity.py`](../tests/test_parity.py).

## Run it

```bash
pip install -e '.[api,dev]'
uvicorn transitsim_api.main:app --reload --app-dir api
```

Then:

- `http://127.0.0.1:8000/docs` — Swagger UI (interactive)
- `http://127.0.0.1:8000/redoc` — Redoc UI
- `http://127.0.0.1:8000/openapi.json` — raw OpenAPI 3.1 spec

## v1 endpoint

### `POST /v1/simulate`

```bash
curl -s http://127.0.0.1:8000/v1/simulate \
  -H 'Content-Type: application/json' \
  -d '{"mix": {"car": 5, "bus": 20, "subway": 40, "cycling": 20, "pedestrian": 13, "other": 2}}'
```

Response (truncated):

```json
{
  "mix": { "car": 5.0, "bus": 20.0, "subway": 40.0, ... },
  "co2_tonnes": 86.93,
  "pm25_ambient": 6.21,
  "congestion_index": 24.59,
  "avg_commute_min": 19.97,
  "noise_dba": 60.36,
  "health_index": 49.5,
  "overall_score": 74.80,
  "grade": "B+",
  "scores": { "climate": 79, "air_quality": 80, ... }
}
```

**Input rules.**

- Every share is optional; missing fields default to `0`.
- Shares must satisfy `0 ≤ share ≤ 100` (per-mode); the engine
  normalises across modes so partial inputs are valid.
- Extra fields (e.g. `"skateboard": 50`) → `422 Unprocessable Entity`.
- All-zero mix returns the 2022 Toronto Cordon-Count baseline rather
  than erroring — lets clients send `{"mix": {}}` to ask "what's the
  current baseline look like?".

**Determinism.** Identical inputs always produce identical outputs.
Safe to cache by hash of the request body.

## Operational

- `GET /health` — liveness probe (no engine call)
- `GET /` — service metadata + endpoint listing

## Roadmap

Listed in [`main.py`](transitsim_api/main.py) as TODOs:

- `GET /v1/scenarios` — list named presets
- `GET /v1/scenarios/{id}` — fetch + run one preset
- `GET /v1/model` — coefficients, citations, BPR posteriors
- `POST /v1/optimize` — inverse optimisation (wraps `analysis/optimization.py`)

## Tests

```bash
# API unit tests only
pytest api/tests

# Cross-language engine parity (the safety net)
pytest tests/test_parity.py
```

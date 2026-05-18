"""
Unit tests for the public API.

These cover the HTTP / schema layer — input validation, response shape,
status codes, and the engine-integration smoke check.  The
mathematical correctness of the engine itself is covered by
``tests/test_parity.py`` at the repo root, so we don't re-test it here.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from transitsim_api.main import app
from transitsim_api.schemas import SimulateResponse


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app)


# ─── Happy path ────────────────────────────────────────────────────────────

def test_simulate_baseline_returns_documented_grade(client: TestClient) -> None:
    """Cordon-Count 2022 baseline scores ~52 / C — confirms engine wiring."""
    r = client.post("/v1/simulate", json={
        "mix": {"car": 34, "bus": 18, "subway": 31, "cycling": 6, "pedestrian": 9, "other": 2},
    })
    assert r.status_code == 200, r.text
    body = r.json()
    # round-trip through the response schema so we catch any field-level drift
    parsed = SimulateResponse.model_validate(body)
    assert parsed.grade == "C"
    assert 50.0 < parsed.overall_score < 55.0


def test_simulate_transformto_2050_documented_grade(client: TestClient) -> None:
    """TransformTO 2050 preset scores ~74.8 / B+ (post-fc4dee5 recalibration)."""
    r = client.post("/v1/simulate", json={
        "mix": {"car": 5, "bus": 20, "subway": 40, "cycling": 20, "pedestrian": 13, "other": 2},
    })
    assert r.status_code == 200
    body = r.json()
    assert body["grade"] == "B+"
    assert 74.0 < body["overall_score"] < 76.0


def test_simulate_all_zeros_falls_back_to_baseline(client: TestClient) -> None:
    """All-zero mix returns baseline rather than raising — matches engine behaviour."""
    r = client.post("/v1/simulate", json={"mix": {}})
    assert r.status_code == 200
    body = r.json()
    # baseline mix is car=34 → check the normalised echo
    assert body["mix"]["car"] == pytest.approx(34.0)


def test_simulate_partial_input_normalises(client: TestClient) -> None:
    """Two-mode input is normalised to 100 % total."""
    r = client.post("/v1/simulate", json={"mix": {"car": 1, "subway": 1}})
    assert r.status_code == 200
    body = r.json()
    assert body["mix"]["car"] == pytest.approx(50.0)
    assert body["mix"]["subway"] == pytest.approx(50.0)


def test_simulate_response_contains_all_documented_fields(client: TestClient) -> None:
    """Belt-and-braces: ensure every field promised in the schema is present."""
    r = client.post("/v1/simulate", json={"mix": {"subway": 100}})
    assert r.status_code == 200
    body = r.json()
    for required in (
        "mix", "co2_tonnes", "pm25_tonnes", "pm25_ambient", "nox_tonnes",
        "congestion_index", "avg_commute_min", "avg_speed_kmh",
        "noise_dba", "health_index", "productivity_index", "equity_index",
        "cost_mday", "overall_score", "grade", "scores",
    ):
        assert required in body, f"missing field: {required}"
    for sub in ("climate", "air_quality", "congestion", "health",
                "productivity", "noise", "equity"):
        assert sub in body["scores"], f"missing radar sub-score: {sub}"


def test_simulate_is_deterministic(client: TestClient) -> None:
    """Same input → same output, byte-for-byte (engine is a pure function)."""
    payload = {"mix": {"car": 25, "bus": 25, "subway": 25, "cycling": 25}}
    r1 = client.post("/v1/simulate", json=payload).json()
    r2 = client.post("/v1/simulate", json=payload).json()
    assert r1 == r2


# ─── Input validation ─────────────────────────────────────────────────────

def test_simulate_rejects_negative_share(client: TestClient) -> None:
    r = client.post("/v1/simulate", json={"mix": {"car": -10, "subway": 110}})
    assert r.status_code == 422
    assert "greater than or equal to 0" in r.text.lower() or "ge=0" in r.text.lower()


def test_simulate_rejects_share_over_100(client: TestClient) -> None:
    r = client.post("/v1/simulate", json={"mix": {"car": 200}})
    assert r.status_code == 422


def test_simulate_rejects_unknown_mode(client: TestClient) -> None:
    """Extra fields → 422.  Catches client-side typos before they silently 0-out."""
    r = client.post("/v1/simulate", json={"mix": {"car": 50, "skateboard": 50}})
    assert r.status_code == 422


def test_simulate_rejects_non_numeric_share(client: TestClient) -> None:
    r = client.post("/v1/simulate", json={"mix": {"car": "lots"}})
    assert r.status_code == 422


def test_simulate_rejects_missing_mix(client: TestClient) -> None:
    r = client.post("/v1/simulate", json={})
    assert r.status_code == 422


# ─── Operational endpoints ───────────────────────────────────────────────

def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_root_lists_endpoints(client: TestClient) -> None:
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "TransitSim API"
    assert "POST /v1/simulate" in body["endpoints"]


def test_openapi_schema_is_valid(client: TestClient) -> None:
    """FastAPI generates this for us — confirm it's served and well-formed."""
    r = client.get("/openapi.json")
    assert r.status_code == 200
    spec = r.json()
    assert spec["info"]["title"] == "TransitSim API"
    assert "/v1/simulate" in spec["paths"]

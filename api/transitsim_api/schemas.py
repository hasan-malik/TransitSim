"""
Pydantic schemas for the TransitSim public API.

Every request and response is fully typed so:
- FastAPI auto-generates a complete OpenAPI/Swagger document at /docs
- Invalid input (wrong types, negative shares, unknown modes) is rejected
  with a 422 + a precise error message *before* it reaches the engine
- Future SDK clients can codegen against the published schema

Naming: snake_case throughout, matching the Python engine.  When a JS
client consumes the API it will deserialise into JS objects whose keys
are also snake_case — that's a one-time convention choice we're making
for the public contract.
"""

from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

# ─── Shared constants ──────────────────────────────────────────────────────
# Mirrors analysis.engine.MODES.  Re-stated here (not imported) so that the
# OpenAPI schema doesn't carry a phantom dependency on the engine module.
MODES: tuple[str, ...] = ("car", "bus", "subway", "cycling", "pedestrian", "other")

# Non-negative percentage share for a single mode.  Allowed range
# [0, 100]; the engine normalises across modes anyway, but we cap at 100
# to reject obviously-broken payloads (e.g. somebody sending raw trip
# counts in the millions).
ShareFloat = Annotated[float, Field(ge=0.0, le=100.0)]


# ─── Request body ───────────────────────────────────────────────────────────

class ModalMix(BaseModel):
    """Six-dimensional modal-share vector.

    Each field is an optional percentage; missing fields default to 0.
    The engine normalises the vector so partial inputs (e.g. only
    setting ``car`` and ``subway``) are valid.  If *all* fields are
    zero, the engine falls back to the 2022 Toronto Cordon Count
    baseline rather than raising — this preserves the JS engine's
    behaviour and lets clients send ``{}`` to ask "what's the baseline?".
    """

    model_config = ConfigDict(extra="forbid", json_schema_extra={
        "example": {
            "car": 5, "bus": 20, "subway": 40,
            "cycling": 20, "pedestrian": 13, "other": 2,
        },
    })

    car:        ShareFloat = 0.0
    bus:        ShareFloat = 0.0
    subway:     ShareFloat = 0.0
    cycling:    ShareFloat = 0.0
    pedestrian: ShareFloat = 0.0
    other:      ShareFloat = 0.0

    def as_engine_dict(self) -> dict[str, float]:
        return {m: getattr(self, m) for m in MODES}


class SimulateRequest(BaseModel):
    """Body of ``POST /v1/simulate``."""

    model_config = ConfigDict(extra="forbid")

    mix: ModalMix


# ─── Response ───────────────────────────────────────────────────────────────

class RadarScores(BaseModel):
    """Integer-rounded 0–100 sub-scores used by the radar chart on the web app."""

    climate:      int
    air_quality:  int
    congestion:   int
    health:       int
    productivity: int
    noise:        int
    equity:       int


class SimulateResponse(BaseModel):
    """Full output of one simulation run.

    All numeric fields are deterministic functions of the input mix —
    identical inputs always return identical outputs, which makes the
    response trivially cacheable by request-body hash.
    """

    # Normalised modal split (sums to 100).
    mix: ModalMix

    # ─── Emissions (tonnes / day) ──────────────────────────────────────
    co2_tonnes:   float = Field(description="Daily CO₂-equivalent emissions, tonnes/day")
    pm25_tonnes:  float = Field(description="Daily PM2.5 emitted into downtown air, tonnes/day")
    pm25_ambient: float = Field(description="Estimated ambient PM2.5 concentration, μg/m³")
    nox_tonnes:   float = Field(description="Daily NOx emissions, tonnes/day")

    # ─── Mobility ──────────────────────────────────────────────────────
    congestion_index: float = Field(description="0–100, 100 = saturated road network")
    avg_commute_min:  float = Field(description="One-way mean commute time over 4.8 km, minutes")
    avg_speed_kmh:    float = Field(description="Mode-share-weighted average speed, km/h")

    # ─── Livability / health ───────────────────────────────────────────
    noise_dba:          float = Field(description="dB(A) area-weighted noise level")
    health_index:       float = Field(description="0–100 active-transport METs index")
    productivity_index: float = Field(description="0–100 productivity index (commute-stress adjusted)")
    equity_index:       float = Field(description="0–100 transit-equity index")

    # ─── Economy ───────────────────────────────────────────────────────
    cost_mday: float = Field(description="Full-cost societal CAD/day, in millions")

    # ─── Composite ─────────────────────────────────────────────────────
    overall_score: float = Field(description="0–100 composite sustainability score")
    grade:         str   = Field(description="Letter grade A+ → F derived from overall_score")
    scores:        RadarScores



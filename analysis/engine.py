"""
engine.py — Python port of the TransitSim metrics engine.

This is a faithful, vectorisable re-implementation of
``src/models/metrics-engine.js``.  Keeping a single source of truth in
Python lets the calibration, validation, and optimization notebooks all
exercise the *exact* model the web app ships.

The only behavioural difference vs. the JS engine is that the BPR
volume-delay coefficients (alpha, beta, gamma) and the free-flow speed
are injected as parameters, so the Bayesian calibration can estimate
them and the validation notebook can sweep them.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
import numpy as np

MODES = ["car", "bus", "subway", "cycling", "pedestrian", "other"]

# ─── Research-sourced constants (mirrors metrics-engine.js) ──────────────────
DAILY_TRIPS = 620_000
AVG_TRIP_KM = 4.8
ROAD_LANE_KM = 520
ROAD_CAPACITY_M2 = ROAD_LANE_KM * 3.5 * 1000  # lane-km × 3.5 m × 1000 m/km

EMISSION_G_PER_PAX_KM = dict(car=142, bus=72, subway=14, cycling=5, pedestrian=0, other=55)
PM25_G_PER_PAX_KM = dict(car=0.052, bus=0.031, subway=0.002, cycling=0.001, pedestrian=0.0, other=0.015)
NOX_G_PER_PAX_KM = dict(car=0.18, bus=0.14, subway=0.01, cycling=0.0, pedestrian=0.0, other=0.08)
BASE_SPEED_KMH = dict(car=19, bus=12, subway=35, cycling=17, pedestrian=5, other=30)
ROAD_M2_PER_PERSON = dict(car=32, bus=1.4, subway=0, cycling=5, pedestrian=2, other=1.2)
NOISE_DB = dict(car=71, bus=74, subway=8, cycling=42, pedestrian=38, other=62)
HEALTH_METS = dict(car=0.9, bus=1.5, subway=2.1, cycling=7.8, pedestrian=3.5, other=1.6)
COST_PER_PAX_KM = dict(car=0.72, bus=0.35, subway=0.26, cycling=0.07, pedestrian=0.02, other=0.30)

BASELINE_MIX = dict(car=34, bus=18, subway=31, cycling=6, pedestrian=9, other=2)

# Textbook Bureau of Public Roads coefficients — the *prior* mean for calibration.
DEFAULT_BPR = dict(alpha=0.15, beta=4.0, gamma=3.5, v_free=33.0)


@dataclass
class BPRParams:
    """Bureau of Public Roads volume-delay coefficients."""
    alpha: float = 0.15
    beta: float = 4.0
    gamma: float = 3.5
    v_free: float = 33.0  # free-flow car speed (km/h) — the V/C→0 asymptote

    def as_dict(self) -> dict:
        return asdict(self)


def bpr_congestion_factor(vc_ratio, bpr: BPRParams):
    """
    Augmented BPR multiplier:  congFactor = 1 + alpha · gamma · (V/C)^beta.

    Actual speed = free-flow speed / congFactor.  ``vc_ratio`` may be a
    scalar or a NumPy array (vectorised for the calibration likelihood).
    """
    vc = np.asarray(vc_ratio, dtype=float)
    return 1.0 + bpr.alpha * bpr.gamma * np.power(vc, bpr.beta)


def bpr_speed(vc_ratio, bpr: BPRParams):
    """Predicted congested car speed (km/h) at a given V/C ratio."""
    return bpr.v_free / bpr_congestion_factor(vc_ratio, bpr)


def _normalize(mix: dict) -> dict:
    total = sum(mix.values())
    if total == 0:
        return dict(BASELINE_MIX)
    return {k: v / total * 100.0 for k, v in mix.items()}


def calculate_metrics(transit_mix: dict, bpr: BPRParams | None = None) -> dict:
    """
    Pure-function port of ``calculateMetrics`` from the JS engine.

    Parameters
    ----------
    transit_mix : dict   raw modal-share values (need not sum to 100)
    bpr         : BPRParams   volume-delay coefficients (default = textbook)
    """
    bpr = bpr or BPRParams()
    mix = _normalize({m: transit_mix.get(m, 0) for m in MODES})

    def trips(m):
        return DAILY_TRIPS * mix[m] / 100.0

    co2_tonnes = sum(trips(m) * AVG_TRIP_KM * EMISSION_G_PER_PAX_KM[m] / 1e6 for m in MODES)
    pm25_tonnes = sum(trips(m) * AVG_TRIP_KM * PM25_G_PER_PAX_KM[m] / 1e6 for m in MODES)
    pm25_ambient = 4.0 + pm25_tonnes * 5000.0
    nox_tonnes = sum(trips(m) * AVG_TRIP_KM * NOX_G_PER_PAX_KM[m] / 1e6 for m in MODES)

    road_demand = sum(trips(m) * ROAD_M2_PER_PERSON[m] for m in MODES)
    congestion_index = min(100.0, max(0.0, road_demand / ROAD_CAPACITY_M2 * 100.0))

    # Augmented BPR — V/C taken as the (clamped) congestion index on [0,1].
    cong_factor = float(bpr_congestion_factor(congestion_index / 100.0, bpr))

    def mode_speed(m):
        s = BASE_SPEED_KMH[m]
        return s / cong_factor if m in ("car", "bus") else s

    avg_commute_min = sum(mix[m] / 100.0 * (AVG_TRIP_KM / mode_speed(m)) * 60.0 for m in MODES)
    weighted_speed = sum(mix[m] / 100.0 * mode_speed(m) for m in MODES)

    noise_linear = sum(mix[m] / 100.0 * 10 ** (NOISE_DB[m] / 10.0) for m in MODES)
    noise_dba = 10.0 * np.log10(noise_linear)

    health_mets = sum(mix[m] / 100.0 * HEALTH_METS[m] for m in MODES)
    health_index = min(100.0, max(0.0, health_mets / 7.8 * 100.0))

    cost_mday = sum(trips(m) * AVG_TRIP_KM * COST_PER_PAX_KM[m] / 1e6 for m in MODES)

    time_loss = max(0.0, (avg_commute_min - 15.0) * 0.5)
    cong_loss = congestion_index * 0.12
    health_gain = max(0.0, (health_index - 30.0) * 0.2)
    productivity_index = min(100.0, max(0.0, 100.0 - time_loss - cong_loss + health_gain))

    equity_index = min(100.0, (mix["subway"] + mix["bus"] + mix["cycling"] + mix["pedestrian"]) * 0.8
                       + mix["other"] * 0.4)

    co2_score = max(0.0, 100.0 - co2_tonnes / 200.0 * 100.0)
    air_score = max(0.0, 100.0 - (pm25_ambient - 4.0) / 25.0 * 100.0)
    cong_score = 100.0 - congestion_index
    noise_score = max(0.0, 100.0 - (noise_dba - 35.0) / 40.0 * 100.0)

    overall = min(100.0, max(0.0,
        co2_score * 0.25 + air_score * 0.20 + cong_score * 0.20
        + health_index * 0.15 + productivity_index * 0.10
        + noise_score * 0.05 + equity_index * 0.05))

    return dict(
        mix=mix,
        co2_tonnes=co2_tonnes, pm25_tonnes=pm25_tonnes, pm25_ambient=pm25_ambient,
        nox_tonnes=nox_tonnes, congestion_index=congestion_index,
        avg_commute_min=avg_commute_min, avg_speed_kmh=weighted_speed,
        noise_dba=float(noise_dba), health_index=health_index,
        productivity_index=productivity_index, equity_index=equity_index,
        cost_mday=cost_mday, overall_score=overall,
    )

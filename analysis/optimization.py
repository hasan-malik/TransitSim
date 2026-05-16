"""
optimization.py — inverse policy design for TransitSim.

The web app answers the *forward* question: "given this modal split,
what happens?"  This module answers the *inverse* question:

    "What modal split MINIMISES CO2 (or full-cost) subject to a commute-time
     ceiling, an equity floor, and political-feasibility bounds?"

Two solvers, used together:

1. ``optimize_convex`` — a convex relaxation solved with CVXPY.  Emissions
   are linear in the modal-share vector; with car/bus speeds frozen at a
   fixed congestion operating point, the commute-time and equity
   constraints are linear too, so the feasible set is a polytope and the
   solution is the GLOBAL optimum of the relaxation.

2. ``optimize_nonlinear`` — SLSQP refinement that re-introduces the BPR
   congestion feedback (less driving -> less congestion -> faster cars),
   warm-started from the convex solution.

Reporting both is deliberate: the convex solve is fast and globally
optimal but conservative on travel time; the nonlinear solve is exact for
this model but only locally optimal.  They bracket the true answer.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import numpy as np
import cvxpy as cp
from scipy.optimize import minimize

from engine import (
    MODES, AVG_TRIP_KM, BASE_SPEED_KMH, HEALTH_METS, EMISSION_G_PER_PAX_KM,
    COST_PER_PAX_KM, DAILY_TRIPS, BASELINE_MIX, BPRParams, calculate_metrics,
    bpr_congestion_factor,
)


@dataclass
class PolicyTargets:
    """Constraints defining a feasible, politically-plausible modal split."""
    name: str = "balanced"
    objective: str = "co2"          # "co2" or "cost"
    max_commute_min: float = 24.0   # average one-way commute ceiling
    min_equity: float = 55.0        # equity sub-score floor (0-100)
    car_min: float = 0.05           # cars cannot be banned outright
    car_max: float = 0.34           # cannot EXCEED today's car share
    bus_min: float = 0.08           # surface-transit coverage floor
    pedestrian_max: float = 0.20    # 4.8 km mean trip => walking is capped
    cycling_max: float = 0.42       # Amsterdam-tier ceiling
    bounds: dict = field(default_factory=dict)  # optional per-mode (lo, hi)


def _emission_vector():
    return np.array([EMISSION_G_PER_PAX_KM[m] for m in MODES], dtype=float)


def _cost_vector():
    return np.array([COST_PER_PAX_KM[m] for m in MODES], dtype=float)


def _time_vector(cong_factor: float):
    """One-way minutes per mode at a fixed congestion operating point."""
    t = []
    for m in MODES:
        speed = BASE_SPEED_KMH[m]
        if m in ("car", "bus"):
            speed = speed / cong_factor
        t.append(AVG_TRIP_KM / speed * 60.0)
    return np.array(t, dtype=float)


def _equity_vector():
    # equity = 0.8·(subway+bus+cycling+ped) + 0.4·other, in percentage points
    w = {"car": 0.0, "bus": 0.8, "subway": 0.8, "cycling": 0.8,
         "pedestrian": 0.8, "other": 0.4}
    return np.array([w[m] * 100.0 for m in MODES], dtype=float)


def optimize_convex(targets: PolicyTargets, bpr: BPRParams | None = None) -> dict:
    """Solve the convex relaxation with CVXPY. Returns a normalised mix dict."""
    bpr = bpr or BPRParams()

    # Freeze the congestion operating point at today's baseline.
    base = calculate_metrics(BASELINE_MIX, bpr)
    cong_factor = float(bpr_congestion_factor(base["congestion_index"] / 100.0, bpr))

    e = _emission_vector() if targets.objective == "co2" else _cost_vector()
    t = _time_vector(cong_factor)
    eq = _equity_vector()

    m = cp.Variable(len(MODES), nonneg=True)
    constraints = [cp.sum(m) == 1, t @ m <= targets.max_commute_min, eq @ m >= targets.min_equity]

    idx = {mode: i for i, mode in enumerate(MODES)}
    constraints += [
        m[idx["car"]] >= targets.car_min,
        m[idx["car"]] <= targets.car_max,
        m[idx["bus"]] >= targets.bus_min,
        m[idx["pedestrian"]] <= targets.pedestrian_max,
        m[idx["cycling"]] <= targets.cycling_max,
    ]
    for mode, (lo, hi) in targets.bounds.items():
        constraints += [m[idx[mode]] >= lo, m[idx[mode]] <= hi]

    prob = cp.Problem(cp.Minimize(e @ m), constraints)
    prob.solve()
    if prob.status not in ("optimal", "optimal_inaccurate"):
        raise RuntimeError(f"convex solve failed: {prob.status}")

    return {mode: float(max(0.0, m.value[i]) * 100.0) for i, mode in enumerate(MODES)}


def optimize_nonlinear(targets: PolicyTargets, x0: dict | None = None,
                       bpr: BPRParams | None = None) -> dict:
    """SLSQP refinement using the full BPR congestion feedback."""
    bpr = bpr or BPRParams()
    idx = {mode: i for i, mode in enumerate(MODES)}

    if x0 is None:
        x0 = {m: BASELINE_MIX[m] / 100.0 for m in MODES}
    x0v = np.array([x0[m] for m in MODES], dtype=float)
    x0v = x0v / x0v.sum()

    def to_mix(x):
        return {MODES[i]: float(x[i]) * 100.0 for i in range(len(MODES))}

    e = _emission_vector() if targets.objective == "co2" else _cost_vector()

    def objective(x):
        return float(e @ np.maximum(x, 0))

    def commute(x):  # >= 0  =>  commute <= ceiling
        return targets.max_commute_min - calculate_metrics(to_mix(x), bpr)["avg_commute_min"]

    def equity(x):   # >= 0  =>  equity >= floor
        return calculate_metrics(to_mix(x), bpr)["equity_index"] - targets.min_equity

    cons = [
        {"type": "eq", "fun": lambda x: float(np.sum(x) - 1.0)},
        {"type": "ineq", "fun": commute},
        {"type": "ineq", "fun": equity},
    ]
    bounds = [(0.0, 1.0)] * len(MODES)
    bounds[idx["car"]] = (targets.car_min, targets.car_max)
    bounds[idx["bus"]] = (targets.bus_min, 1.0)
    bounds[idx["pedestrian"]] = (0.0, targets.pedestrian_max)
    bounds[idx["cycling"]] = (0.0, targets.cycling_max)
    for mode, (lo, hi) in targets.bounds.items():
        bounds[idx[mode]] = (lo, hi)

    res = minimize(objective, x0v, method="SLSQP", bounds=bounds,
                   constraints=cons, options={"maxiter": 400, "ftol": 1e-9})
    x = np.maximum(res.x, 0.0)
    x = x / x.sum()
    return {MODES[i]: float(x[i] * 100.0) for i in range(len(MODES))}


# Three reference policy briefs used to seed the web app's "optimal" presets.
POLICY_LIBRARY = [
    PolicyTargets(name="net_zero_push", objective="co2",
                  max_commute_min=26.0, min_equity=60.0, car_max=0.20),
    PolicyTargets(name="commuter_friendly", objective="co2",
                  max_commute_min=20.0, min_equity=50.0, car_max=0.34),
    PolicyTargets(name="lowest_cost", objective="cost",
                  max_commute_min=24.0, min_equity=55.0, car_max=0.30),
]

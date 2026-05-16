"""
export_results.py — headless pipeline: calibrate -> validate -> optimise.

Runs the full analysis end-to-end and writes a single JSON artefact,
``src/models/calibrated.json``, which the web app imports at build time.
This is the bridge between the Python research layer and the JS engine.

Usage:
    python export_results.py            # full run (~2-4 min)
    python export_results.py --quick    # fewer MCMC draws, skip LOO CV
"""

from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path

import pandas as pd

from calibration import fit, posterior_summary, point_estimate
from validation import loo_cross_validate, scores
from optimization import POLICY_LIBRARY, optimize_convex, optimize_nonlinear
from engine import BPRParams, calculate_metrics

ROOT = Path(__file__).resolve().parent.parent
DATA = Path(__file__).resolve().parent / "data" / "congestion_observations.csv"
OUT_JSON = ROOT / "src" / "models" / "calibrated.json"
OUT_LOCAL = Path(__file__).resolve().parent / "outputs"


def main(quick: bool = False):
    df = pd.read_csv(DATA)
    print(f"Loaded {len(df)} congestion observations.")

    draws = 600 if quick else 2000
    tune = 600 if quick else 2000

    print("Running Bayesian calibration (NUTS)...")
    idata = fit(df, draws=draws, tune=tune, chains=4)
    summary = posterior_summary(idata)
    coeffs = point_estimate(idata)
    print(summary)

    # arviz versions differ on the interval column names
    # (hdi_3%/hdi_97% on <=0.18, eti94_lb/eti94_ub on >=0.19).
    lo_col = next(c for c in summary.columns if c.endswith(("3%", "_lb")))
    hi_col = next(c for c in summary.columns if c.endswith(("97%", "_ub")))
    posterior = {}
    for p in ["alpha", "beta", "gamma", "v_free"]:
        row = summary.loc[p]
        posterior[p] = dict(
            mean=round(float(row["mean"]), 4),
            sd=round(float(row["sd"]), 4),
            hdi_lo=round(float(row[lo_col]), 4),
            hdi_hi=round(float(row[hi_col]), 4),
        )

    val = None
    if not quick:
        print("Running leave-one-out cross-validation...")
        cv = loo_cross_validate(df)
        val = {k: round(v, 4) for k, v in scores(cv).items()}
        cv.to_csv(OUT_LOCAL / "loo_cv.csv", index=False)
        print(f"  LOO scores: {val}")

    bpr = BPRParams(**coeffs)
    print("Running inverse optimization for policy library...")
    optimal = {}
    for tgt in POLICY_LIBRARY:
        convex = optimize_convex(tgt, bpr)
        nonlin = optimize_nonlinear(tgt, x0={k: v / 100 for k, v in convex.items()}, bpr=bpr)
        metrics = calculate_metrics(nonlin, bpr)
        optimal[tgt.name] = dict(
            objective=tgt.objective,
            constraints=dict(max_commute_min=tgt.max_commute_min,
                             min_equity=tgt.min_equity, car_max=tgt.car_max),
            convex_mix={k: round(v, 2) for k, v in convex.items()},
            mix={k: round(v, 2) for k, v in nonlin.items()},
            resulting=dict(
                co2_tonnes=round(metrics["co2_tonnes"], 1),
                avg_commute_min=round(metrics["avg_commute_min"], 2),
                equity_index=round(metrics["equity_index"], 1),
                overall_score=round(metrics["overall_score"], 1),
            ),
        )
        print(f"  {tgt.name}: {optimal[tgt.name]['mix']}")

    artefact = dict(
        _meta=dict(
            generated=str(date.today()),
            pipeline="analysis/export_results.py",
            note="Bayesian-calibrated BPR coefficients + inverse-optimised modal splits. "
                 "Do not hand-edit; regenerate via the analysis pipeline.",
            n_observations=len(df),
            mcmc=dict(draws=draws, tune=tune, chains=4, sampler="NUTS"),
        ),
        bpr=dict(
            alpha=round(coeffs["alpha"], 4),
            beta=round(coeffs["beta"], 4),
            gamma=round(coeffs["gamma"], 4),
            v_free=round(coeffs["v_free"], 4),
        ),
        posterior=posterior,
        validation=val,
        optimal_policies=optimal,
    )

    OUT_JSON.write_text(json.dumps(artefact, indent=2) + "\n")
    (OUT_LOCAL / "calibrated.json").write_text(json.dumps(artefact, indent=2) + "\n")
    print(f"\nWrote {OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--quick", action="store_true", help="fewer draws, skip LOO CV")
    args = ap.parse_args()
    OUT_LOCAL.mkdir(exist_ok=True)
    main(quick=args.quick)

"""
validation.py — out-of-sample validation for the calibrated BPR model.

A posterior that fits its own training data tells you nothing about
predictive skill.  This module runs leave-one-out cross-validation:
for each observed (V/C, speed) pair, refit the Bayesian model on the
*other* points, predict the held-out speed, and score the residual.

Reported metrics: MAE, RMSE, MAPE, and out-of-sample R².
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from calibration import fit, point_estimate
from engine import BPRParams, bpr_speed


def loo_cross_validate(df: pd.DataFrame, draws: int = 800, tune: int = 800,
                       chains: int = 2, seed: int = 42) -> pd.DataFrame:
    """
    Leave-one-out CV. Returns a per-fold table with predicted vs. actual.

    Smaller draw counts than the headline fit — LOO refits the model once
    per observation, so this trades a little MCMC precision for runtime.
    """
    rows = []
    for i in range(len(df)):
        train = df.drop(df.index[i])
        test = df.iloc[i]
        idata = fit(train, draws=draws, tune=tune, chains=chains, seed=seed + i)
        coeffs = point_estimate(idata)
        bpr = BPRParams(**coeffs)
        pred = float(bpr_speed(test["vc_ratio"], bpr))
        rows.append(dict(
            vc_ratio=test["vc_ratio"],
            actual=test["observed_speed_kmh"],
            predicted=pred,
            residual=test["observed_speed_kmh"] - pred,
        ))
    return pd.DataFrame(rows)


def scores(cv: pd.DataFrame) -> dict:
    """Aggregate error metrics from a LOO cross-validation table."""
    actual = cv["actual"].to_numpy()
    pred = cv["predicted"].to_numpy()
    resid = actual - pred
    ss_res = float(np.sum(resid ** 2))
    ss_tot = float(np.sum((actual - actual.mean()) ** 2))
    return dict(
        mae=float(np.mean(np.abs(resid))),
        rmse=float(np.sqrt(np.mean(resid ** 2))),
        mape=float(np.mean(np.abs(resid / actual)) * 100.0),
        r2=1.0 - ss_res / ss_tot,
        n=len(cv),
    )

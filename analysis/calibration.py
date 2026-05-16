"""
calibration.py — Bayesian calibration of the BPR volume-delay coefficients.

The web app ships textbook Bureau of Public Roads coefficients
(alpha=0.15, beta=4, gamma=3.5).  Those were derived for inter-city
highways in 1964; downtown Toronto's surface grid behaves differently.

Here we treat (alpha, beta, gamma, v_free) as *random variables* and infer
their joint posterior from observed (V/C, speed) pairs using the NUTS
sampler in PyMC.  The textbook values become the prior means; the data
pulls them toward whatever actually fits Toronto.

Likelihood
----------
    congFactor = 1 + alpha · gamma · (V/C)^beta
    speed_pred = v_free / congFactor
    speed_obs  ~ Normal(speed_pred, sigma)
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import pymc as pm

PARAMS = ["alpha", "beta", "gamma", "v_free"]


def build_model(vc: np.ndarray, v_obs: np.ndarray) -> pm.Model:
    """Construct the PyMC model for the augmented-BPR speed curve."""
    with pm.Model() as model:
        # Priors centred on the textbook BPR coefficients.
        alpha = pm.LogNormal("alpha", mu=np.log(0.15), sigma=0.6)
        beta = pm.TruncatedNormal("beta", mu=4.0, sigma=1.2, lower=1.5, upper=8.0)
        gamma = pm.LogNormal("gamma", mu=np.log(3.5), sigma=0.6)
        v_free = pm.TruncatedNormal("v_free", mu=33.0, sigma=2.0, lower=25.0, upper=42.0)
        sigma = pm.HalfNormal("sigma", sigma=2.5)

        cong_factor = 1.0 + alpha * gamma * vc ** beta
        speed_pred = pm.Deterministic("speed_pred", v_free / cong_factor)

        pm.Normal("v_obs", mu=speed_pred, sigma=sigma, observed=v_obs)
    return model


def fit(df: pd.DataFrame, draws: int = 2000, tune: int = 2000,
        chains: int = 4, seed: int = 42):
    """
    Run NUTS on the observation table and return the ArviZ InferenceData.

    ``df`` must have columns ``vc_ratio`` and ``observed_speed_kmh``.
    """
    vc = df["vc_ratio"].to_numpy(dtype=float)
    v_obs = df["observed_speed_kmh"].to_numpy(dtype=float)
    with build_model(vc, v_obs):
        idata = pm.sample(
            draws=draws, tune=tune, chains=chains,
            target_accept=0.95, random_seed=seed,
            progressbar=False, idata_kwargs={"log_likelihood": True},
        )
    return idata


def posterior_summary(idata) -> pd.DataFrame:
    """Posterior mean + 94% highest-density interval for each coefficient."""
    import arviz as az
    try:
        return az.summary(idata, var_names=PARAMS, hdi_prob=0.94)
    except TypeError:
        # arviz >= 0.19 renamed the keyword to ci_prob
        return az.summary(idata, var_names=PARAMS, ci_prob=0.94)


def point_estimate(idata) -> dict:
    """Posterior-mean coefficients — the values shipped to the JS engine."""
    post = idata.posterior
    return {p: float(post[p].mean()) for p in PARAMS}

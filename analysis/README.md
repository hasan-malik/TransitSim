# TransitSim — Analysis Layer

A Python research layer that turns TransitSim from a *hand-tuned* simulator
into a **calibrated, validated, and optimised** one. The web app's metrics
engine no longer ships textbook constants — it ships numbers derived here.

| Stage | Method | Tooling | Artefact |
|-------|--------|---------|----------|
| **Calibration** | Bayesian inference of the BPR volume-delay coefficients | PyMC (NUTS / HMC), ArviZ | posterior over `(α, β, γ, v_free)` |
| **Validation** | Leave-one-out cross-validation | scipy, pandas | MAE / RMSE / MAPE / out-of-sample R² |
| **Optimization** | Constrained inverse policy design | CVXPY (convex), scipy SLSQP (nonlinear) | Pareto-optimal modal splits |

Everything funnels into a single build artefact, `src/models/calibrated.json`,
which the JavaScript engine imports directly.

## Pipeline

```
congestion_observations.csv                    (V/C, speed) anchor data
            │
            ▼
   01_bayesian_calibration   ──►  posterior over BPR coefficients (PyMC / NUTS)
            │
            ▼
   02_validation_backtest    ──►  leave-one-out CV — does it generalise?
            │
            ▼
   03_inverse_optimization   ──►  CO₂- / cost-minimal modal splits (CVXPY + SLSQP)
            │
            ▼
   src/models/calibrated.json  ──►  consumed by the React app at build time
```

## Quick start

```bash
cd analysis
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run the full pipeline headless and regenerate src/models/calibrated.json
python export_results.py              # ~2-4 min  (--quick for a fast pass)

# Or explore interactively
jupyter lab notebooks/
```

## Files

| File | Purpose |
|------|---------|
| `engine.py` | Python port of `src/models/metrics-engine.js` — single source of truth for the model, with the BPR coefficients exposed as parameters |
| `calibration.py` | PyMC model + NUTS sampling for the BPR speed curve |
| `validation.py` | Leave-one-out cross-validation and error metrics |
| `optimization.py` | Convex (CVXPY) and nonlinear (SLSQP) inverse-optimization solvers |
| `export_results.py` | Headless pipeline → writes `src/models/calibrated.json` |
| `data/congestion_observations.csv` | Observed downtown-Toronto `(V/C, speed)` anchor points |
| `notebooks/` | Three executed, annotated Jupyter notebooks (the narrative version) |

## Method notes

- **Calibration.** The 1964 BPR coefficients (`α=0.15, β=4, γ=3.5`) are used as
  prior means, not hard facts. NUTS infers a joint posterior from observed
  speed data; the posterior mean is what ships. Result: downtown surface
  congestion is ~3× more severe than the textbook highway model predicts.
- **Validation.** Leave-one-out CV refits the model 14 times, each time
  predicting a held-out point. Reported R² is *out-of-sample*, not a
  training-set fit.
- **Optimization.** The convex relaxation (CVXPY) is globally optimal under a
  frozen congestion operating point; SLSQP then refines it with the full BPR
  feedback loop. Both are reported so the reader can see the bracket.

The anchor dataset is demonstration-grade — assembled from published TomTom,
TTC, Cordon Count, and HCM 6 figures. The methodology is production-ready; only
the data volume is not.

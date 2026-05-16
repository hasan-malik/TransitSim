# TransitSim

**A parameterized urban mobility simulation for downtown Toronto.**

TransitSim is an interactive, research-grade decision-support tool that quantifies the environmental, public-health, congestion, and economic consequences of changing the modal mix of urban transportation. Every coefficient in the model is sourced from peer-reviewed literature, government inventories, or published transit-agency data.

> **Live demo:** [hasan-malik.github.io/TransitSim](https://hasan-malik.github.io/TransitSim/)
> **Author:** [Hasan Malik](https://hasan-malik.github.io)
> **Version:** 1.0 · [MIT Licence](LICENSE)

<img width="1470" height="799" alt="Screenshot 2026-05-16 at 12 51 46 am" src="https://github.com/user-attachments/assets/bfac413e-4743-4d1f-aaa6-1c85dc8e1eb2" />
<img width="1470" height="795" alt="Screenshot 2026-05-16 at 12 52 02 am" src="https://github.com/user-attachments/assets/7e09c107-acbb-47a3-9d27-3a27467f9a1b" />

---

## At a glance

| | |
|---|---|
| Daily person-trips modelled | **620,000** |
| Transport modes | **6** (car, bus, subway, cycling, pedestrian, other) |
| Output metrics | **11** across climate / mobility / livability / economy |
| Cited sources | **16** (NIR, IPCC AR6, TTC, WHO, HCM 6, Cordon Count, …) |
| Reference geography | Toronto downtown core, ≈25 km², 4.8 km mean trip length |

---

## Table of contents

- [Abstract](#abstract)
- [Simulation framework](#simulation-framework)
- [Mathematical model](#mathematical-model)
- [Calibration, validation & optimization](#calibration-validation--optimization)
- [Per-mode coefficient table](#per-mode-coefficient-table)
- [Sub-model details](#sub-model-details)
- [Limitations](#limitations--assumptions)
- [References](#references)
- [Citation](#how-to-cite)
- [Running locally](#running-locally)
- [Project structure](#project-structure)

---

## Abstract

Urban-transportation policy is dominated by mode-share decisions whose downstream consequences — emissions, public health, road congestion, economic productivity — are often debated qualitatively. TransitSim operationalises these consequences as a deterministic, real-time simulation over a Toronto-downtown reference geography (≈25 km², 620,000 daily person-trips, 4.8 km mean trip length [5]). The user manipulates a six-dimensional modal-share vector and the engine returns 11 metrics across four impact families:

- **Climate** — CO₂e, PM2.5, NOₓ
- **Mobility** — commute time, congestion index, weighted speed
- **Livability** — noise dB(A), health METs, equity
- **Economy** — full-cost CAD/day, productivity index

All coefficients derive from public, citable sources (NIR [1], IPCC AR6 WG3 [13], TTC [3], WHO [11][12], HCM 6 [8]). Congestion and travel-time degradation are modelled with the canonical Bureau of Public Roads volume-delay function [10]; noise is computed as a logarithmic energy sum weighted by mode share.

---

## Simulation framework

TransitSim is a static-equilibrium **activity-based mode-share model**. It assumes a fixed total demand (person-trips per day) and a fixed mean trip length; the user is free to redistribute that demand across the available modes. The engine is a pure deterministic function — given the same input vector it always returns the same metrics — which makes it well-suited for policy comparison and sensitivity analysis.

### Inputs
- **Modal-share vector** `m = (mₖ)` for `k ∈ {car, bus, subway, cycling, pedestrian, other}`, normalised so `Σmₖ = 1`.
- **Layer toggles** for the 3D Mapbox/Deck.gl visualisation (traffic, pollution, transit, cycling, trips, heat-map).
- **Preset scenarios** derived from published policy documents (TransformTO Net Zero [15], 15-Minute City [14], BRT, Car-Free Downtown). The **2050 TransformTO Target** preset encodes Toronto's Climate Action Strategy net-zero mobility scenario: car 5 %, subway 40 %, bus 20 %, cycling 20 %, pedestrian 13 %, other 2 %. TransformTO is the City of Toronto's binding decarbonisation strategy [15], adopted by Council, targeting net-zero city-wide emissions by 2040; the 2050 label reflects the modal split considered consistent with deep transport decarbonisation under a mid-century global net-zero pathway. On the composite sustainability scale this scenario scores **A (≈ 79/100)**.

### Outputs
For each metric the engine reports both the absolute value and the percentage delta against the 2022 Cordon-Count baseline [5]. A weighted composite score (0–100) is mapped to a letter grade A+ → F.

---

## Mathematical model

Let `N` be total daily person-trips and `d` the mean trip length. For each mode `k` with share `mₖ` and emission factor `eₖ` (g per pax-km), daily emissions collapse to a linear sum:

```
                    ┌  Equation 1 — Linear emissions summation  ┐
                    │                                            │
       E  =  Σₖ  N · mₖ · d · eₖ        [tonnes / day]
                    │                                            │
                    └────────────────────────────────────────────┘
```

Travel time is computed by mode, with the speed of car and bus degraded by an **augmented BPR volume-delay function** [10]. The strict BPR form `1 + α·(V/C)^β` is multiplied by a γ amplifier to reflect surface-grid downtown conditions where peak-hour delays exceed canonical free-flow values:

```
       v_actual  =  v_free  /  ( 1  +  α · γ · ( V / C )^β )

       α ≈ 0.26,  β ≈ 2.39,  γ ≈ 6.16   (Bayesian-calibrated; see analysis/)
```

Where `V/C` is total mode-weighted road area demanded (m²) — scaled by 1/8 to account for daily trips being distributed across the operating day — divided by total downtown surface capacity (lane-km × 3.5 m × 1000 m/km). The index is clamped to `[0, 100]` before being fed into the BPR formula.

Noise is summed in the energy domain because dB is logarithmic; share-weighted linear pressures are summed and re-converted (per WHO method [11]):

```
       L̄  =  10 · log₁₀ ( Σₖ  mₖ · 10^(Lₖ / 10) )    [dB(A)]
```

Health is expressed as **METs** (Metabolic Equivalent of Task [16]) weighted by mode share, then normalised so 100 % cycling = 100 (the max physically realisable index):

```
       H  =  min ( 100,  ( Σₖ mₖ · METₖ ) / 7.8  · 100 )
```

The composite sustainability grade is a weighted average reflecting policy priorities derived from the IPCC AR6 mitigation framework [13]:

```
       G  =  0.25 · S_co2     +
             0.20 · S_air     +
             0.20 · S_cong    +
             0.15 · S_health  +
             0.10 · S_prod    +
             0.05 · S_noise   +
             0.05 · S_equity
```

Each sub-score is normalised against a calibrated real-world anchor. `S_co₂` reaches zero at 420 t/day — the modelled output of a 100 % car modal mix. `S_air` reaches zero at 15 μg/m³ ambient PM2.5, the WHO 24-hour guideline [12]. The congestion index incorporates a temporal distribution factor (÷ 8) representing the spread of 620,000 daily person-trips across the operating day; without this the daily-aggregate road demand saturates the index for any realistic modal mix. Under these thresholds the 2022 Toronto downtown baseline scores **C (≈ 52/100)**; a car-dominant city scores F; the **2050 TransformTO Target** scenario scores **A (≈ 79/100)**.

---

## Calibration, validation & optimization

The BPR congestion coefficients are **not** hard-coded textbook values, and the
"optimal" scenario presets are **not** hand-picked. Both are produced by a
Python research layer in [`analysis/`](analysis/) and consumed by the JS engine
at build time via [`src/models/calibrated.json`](src/models/calibrated.json).

### 1 — Bayesian calibration of the congestion model

The 1964 Bureau of Public Roads coefficients (`α=0.15, β=4, γ=3.5`) were fit to
inter-city highways. Downtown Toronto's signalised surface grid is a different
regime, so TransitSim treats `(α, β, γ, v_free)` as **random variables** and
infers their joint posterior from observed `(V/C, speed)` data using the **NUTS**
sampler in [PyMC](https://www.pymc.io/). The textbook values become prior means.

```
                ┌─ Likelihood ─────────────────────────────────────┐
   speed_pred = v_free / (1 + α·γ·(V/C)^β)
   speed_obs  ~  Normal(speed_pred, σ)
                └──────────────────────────────────────────────────┘
```

**Result:** the calibration finds downtown surface congestion is roughly **3×
more severe** than the textbook highway model predicts — the effective penalty
`α·γ` rises from `0.53` to `≈1.6`. All chains converge (`R̂ ≈ 1.00`).

### 2 — Out-of-sample validation

A posterior that fits its training data proves nothing. **Leave-one-out
cross-validation** refits the model once per observation and predicts the
held-out point. Reported skill: **MAE ≈ 1.3 km/h, MAPE ≈ 7%, out-of-sample
R² ≈ 0.96**.

### 3 — Inverse policy design (constrained optimization)

The simulator answers the *forward* question. The analysis layer also solves the
*inverse* one — *what modal split minimises CO₂ (or full social cost) subject to
a commute-time ceiling, an equity floor, and political-feasibility bounds?* —
with a **convex relaxation** ([CVXPY](https://www.cvxpy.org/)) refined by
**SLSQP** under the full BPR congestion feedback. The three resulting
optimal splits ship as the **Optimizer ·** scenario presets in the app; the
optimal Net-Zero mix cuts modelled downtown transport CO₂ by **~72%** vs. the
2022 baseline while keeping the average commute under 26 minutes.

> Full methodology, executed Jupyter notebooks, and the regeneration pipeline
> live in [`analysis/`](analysis/). Run `python analysis/export_results.py` to
> rebuild `calibrated.json`.

---

## Per-mode coefficient table

Every column below is hard-coded as a constant in [`src/models/metrics-engine.js`](src/models/metrics-engine.js) and carries an explicit literature source. Numbers reflect Toronto-downtown peak-hour conditions where applicable.

| Mode                      | CO₂e<br>(g / pax-km) | PM2.5<br>(g / pax-km) | NOₓ<br>(g / pax-km) | Speed<br>(km/h) | Road<br>(m² / pax) | Cost<br>(CAD / pax-km) | Sources |
|---------------------------|---------------------:|----------------------:|---------------------:|----------------:|-------------------:|-----------------------:|:-------:|
| Car (gas + EV blend)      | 142                  | 0.052                 | 0.18                 | 19              | 32                 | 0.72                   | [1, 2, 4] |
| Bus (TTC diesel)          | 72                   | 0.031                 | 0.14                 | 12              | 1.4                | 0.35                   | [3] |
| Subway (TTC electric)     | 14                   | 0.002                 | 0.01                 | 35              | 0                  | 0.26                   | [3, 5] |
| Cycling                   | 5                    | 0.001                 | 0.00                 | 17              | 5                  | 0.07                   | [6, 7] |
| Walking                   | 0                    | 0.000                 | 0.00                 | 5               | 2                  | 0.02                   | [8] |
| Other (GO / taxi avg)     | 55                   | 0.015                 | 0.08                 | 30              | 1.2                | 0.30                   | [9] |

### Geographic constants

- **Daily person-trips:** 620,000 (downtown core, City of Toronto Transportation Master Plan [15])
- **Mean trip distance:** 4.8 km [5]
- **Lane-km of road:** 520 (downtown core) [15]
- **Downtown area:** ≈25 km² [15]

### Baseline modal split

The "Status Quo" preset reflects the City of Toronto Cordon Count 2022 [5]: car 34 %, subway 31 %, bus/streetcar 18 %, walking 9 %, cycling 6 %, other 2 %. All deltas reported by the simulator are computed against this baseline.

---

## Sub-model details

### Air quality (ambient PM2.5)
Daily mode-weighted PM2.5 is converted to an estimated downtown ambient concentration through a deliberately simple linear relationship, `PM2.5_ambient = 4 + 56 · ΣE_PM`, where the 4 μg/m³ floor approximates regional background and the 56 μg·m⁻³ per tonne-per-day dispersion coefficient is calibrated so the Cordon-Count baseline mix returns ~8 μg/m³ — consistent with observed Toronto downtown annual averages of 7–9 μg/m³. The air-quality sub-score reaches zero at 15 μg/m³, the WHO 24-hour PM2.5 guideline [12]. **This is not a Gaussian-plume or AERMOD-style dispersion solve** — wind, atmospheric stability, building-canyon effects, and diurnal variation are not modelled.

### Pollution heatmap (visualisation overlay, not engine output)
The red/yellow/green heat-overlay on the 3D map is a separate visual artefact and is **not** the engine's PM2.5 number. It is a Deck.gl `HeatmapLayer` over ~1,400 deterministically-seeded sample points: a coarse city-wide grid, a denser downtown grid, and hand-placed hot-spot clusters along the Gardiner Expressway, Don Valley Parkway, Yonge Street, and Bloor Street corridors. Each point's intensity is modulated live by `0.88 · car_share + 0.12 · bus_share`, reflecting the dominance of surface ICE tailpipe emissions. The overlay is directionally faithful — it brightens with car share and concentrates on real high-traffic arterials — but the underlying sample weights are a parametric spatial proxy, not measured sensor data. Treat the heatmap as a *stylised indicator* of where pollution would worsen, not as a quantitative concentration field.

### Congestion and BPR delay
Road demand is computed as `Σ N·mₖ·rₖ` where `rₖ` is the moving road area per person (table above). Capacity is `520 lane-km × 3.5 m effective lane width × 1000 m/km`. Because N is a daily total, road demand is scaled by 1/8 before forming the V/C ratio — representing the effective distribution of trips across the operating day rather than treating all 620,000 as simultaneous. The BPR function [10] then degrades car and bus speeds non-linearly under load using Bayesian-calibrated coefficients (α ≈ 0.26, β ≈ 2.39, γ ≈ 6.16) fit to observed downtown-Toronto speed data — a doubling of V/C produces a ~5× delay penalty (2^β), compared to the ~16× the 1964 textbook quartic would predict.

### Health & productivity
The Health Index uses CDC MET classifications [16] — cycling 7.8 METs, brisk walking 3.5 METs, transit 2.1 METs (for walk-to-stop activity), driving 0.9 METs. Productivity is then modulated by commute time (each minute over a 15-minute reference costs 0.5 % productivity), congestion stress (0.12 % per index point) and active-mode wellness gains (+0.2 % per health-index point above 30).

---

## Limitations & assumptions

> **A note on scope.** TransitSim is a *policy-comparison instrument*, not a forecast model. The numbers it produces are useful for ranking scenarios against each other; they should not be cited as point predictions for a specific calendar year.

- **Static equilibrium.** Total demand and trip length are held constant. Induced demand (more cars when roads are emptier) and modal substitution elasticities are not modelled.
- **Spatial homogeneity.** The downtown core is treated as a single zone. Origin–destination structure, network topology, and corridor-specific bottlenecks are abstracted away.
- **Linear emissions.** Per-pax-km factors are constant — cold-start emissions, payload effects, weather, and seasonal grid mix are not modelled.
- **Simplified dispersion.** Ambient PM2.5 uses a linear fit, not a CALPUFF/AERMOD-grade plume model.
- **Health is acute, not chronic.** The Health Index captures activity METs only; it does not estimate DALYs, road-injury risk, or PM2.5 morbidity (which would require a HEAT-style epidemiological module [11]).
- **Composite weights are normative.** The 25/20/20/15/10/5/5 weighting scheme reflects the IPCC AR6 climate-first emphasis [13]; alternative weightings (e.g. equity-first) would produce different overall grades.

---

## References

References are listed in citation order. Each entry is hyperlinked to a publicly accessible primary source.

1. Environment and Climate Change Canada (2024). *National Inventory Report 1990–2022: Greenhouse Gas Sources and Sinks in Canada*. ECCC, Government of Canada. Annex 12, Table A12-2. https://www.canada.ca/en/environment-climate-change/services/climate-change/greenhouse-gas-emissions/inventory.html
2. Independent Electricity System Operator (IESO) (2024). *Annual Planning Outlook: Ontario Grid Emissions Intensity*. Average grid intensity ~30 g CO₂e/kWh (2023). https://www.ieso.ca/en/Sector-Participants/Planning-and-Forecasting
3. Toronto Transit Commission (2023). *TTC Sustainability & Responsibility Report 2023*. Fleet composition, energy use, ridership, and per-vehicle emissions. https://www.ttc.ca/transparency-and-accountability/Sustainability
4. TomTom International BV (2024). *TomTom Traffic Index 2023 — Toronto Profile*. Average peak-hour driving speed in downtown core: 19 km/h. https://www.tomtom.com/traffic-index/toronto-traffic/
5. City of Toronto (2022). *Toronto Cordon Count 2022 — Downtown Core Modal Split*. Used as baseline modal split. https://www.toronto.ca/services-payments/streets-parking-transportation/transportation-projects/cordon-count/
6. Chester, M. V., & Horvath, A. (2009). *Environmental assessment of passenger transportation should include infrastructure and supply chains*. Environmental Research Letters, 4(2), 024008. https://doi.org/10.1088/1748-9326/4/2/024008
7. Transport Canada (2022). *Active Transportation Indicators — Cycling Speed and Mode Share*. https://tc.canada.ca/en/programs/funding-programs/active-transportation-fund
8. Transportation Research Board (2016). *Highway Capacity Manual, 6th Edition (HCM 6)*. TRB, National Academies of Sciences. Chapter 16 — Pedestrian flow (avg 5 km/h). https://www.trb.org/Main/Blurbs/175169.aspx
9. Metrolinx (2023). *GO Transit Sustainability Report 2023*. Energy and emissions for regional rail/express bus operations. https://www.metrolinx.com/en/about-us/sustainability
10. Bureau of Public Roads (1964). *Traffic Assignment Manual*. U.S. Department of Commerce. Origin of the BPR volume-delay function (α=0.15, β=4). https://catalog.hathitrust.org/Record/000968011
11. World Health Organization (2018). *Environmental Noise Guidelines for the European Region*. WHO Regional Office for Europe. Used for road-traffic noise dB(A) reference levels. https://www.who.int/europe/publications/i/item/9789289053563
12. World Health Organization (2021). *WHO Global Air Quality Guidelines*. Annual PM2.5 guideline value: 5 μg/m³. https://www.who.int/publications/i/item/9789240034228
13. IPCC (2022). *Climate Change 2022: Mitigation of Climate Change. Contribution of Working Group III to the Sixth Assessment Report*. Cambridge University Press. Chapter 10 (Transport), Table 10.1. https://www.ipcc.ch/report/ar6/wg3/
14. Moreno, C., Allam, Z., Chabaud, D., Gall, C., & Pratlong, F. (2021). *Introducing the "15-Minute City": Sustainability, Resilience and Place Identity in Future Post-Pandemic Cities*. Smart Cities, 4(1), 93–111. https://doi.org/10.3390/smartcities4010006
15. City of Toronto (2021). *TransformTO Net Zero Strategy & Toronto Transportation Master Plan*. Council-adopted strategy targeting net-zero by 2040. https://www.toronto.ca/services-payments/water-environment/environmentally-friendly-city-initiatives/transformto/
16. U.S. Centers for Disease Control and Prevention (2022). *Physical Activity Compendium — Metabolic Equivalent (MET) Values*. CDC, Division of Nutrition, Physical Activity, and Obesity. https://www.cdc.gov/physical-activity-basics/measuring/index.html

---

## How to cite

If you use TransitSim in academic, policy, or journalistic work, please cite:

> Malik, H. (2026). *TransitSim: An Evidence-Based Modal-Share Simulator for Downtown Toronto* (v1.0) [Software]. https://github.com/hasan-malik/TransitSim

BibTeX:

```bibtex
@software{malik2026transitsim,
  author  = {Malik, Hasan},
  title   = {TransitSim: An Evidence-Based Modal-Share
             Simulator for Downtown Toronto},
  year    = {2026},
  version = {1.0},
  url     = {https://github.com/hasan-malik/TransitSim}
}
```

---

## Running locally

**Requirements:** Node 18+, a free Mapbox token ([account.mapbox.com](https://account.mapbox.com/) — no credit card required).

```bash
git clone https://github.com/hasan-malik/TransitSim.git
cd TransitSim
npm install

cp .env.example .env
# then edit .env and paste your VITE_MAPBOX_TOKEN

npm run dev      # local dev server (vite)
npm run build    # production build to /dist
npm run preview  # serve the built bundle locally
```

The Mapbox free tier covers 50,000 map loads / month — ample for personal use.

---

## Project structure

```
src/
├── App.jsx                       — top-level layout & state
├── main.jsx                      — React entry point
├── index.css                     — Tailwind base + custom utilities
├── components/
│   ├── AboutPage.jsx             — full research-documentation page
│   ├── ControlPanel.jsx          — left sidebar (sliders + scenario presets)
│   ├── Header.jsx                — top bar with live KPIs & overall grade
│   ├── Map3D.jsx                 — Deck.gl + Mapbox 3D scene
│   ├── MetricCard.jsx            — radar / delta / metric tiles
│   ├── MetricsPanel.jsx          — right sidebar (sustainability output)
│   └── TransitSlider.jsx         — single mode slider with mode colour
├── data/
│   ├── scenarios.js              — preset modal-share vectors w/ provenance
│   ├── toronto-geo.js            — TTC subway, bus, cycling, road geometry
│   └── trip-generator.js         — animated TripsLayer + pollution grid
├── hooks/
│   └── useMetrics.js             — memoised hook around the engine
└── models/
    ├── metrics-engine.js         — pure-function deterministic model engine
    └── calibrated.json           — Bayesian-calibrated coefficients + optima
                                    (generated; do not hand-edit)

analysis/                         — Python research layer
├── engine.py                     — Python port of the metrics engine
├── calibration.py                — PyMC / NUTS Bayesian calibration
├── validation.py                 — leave-one-out cross-validation
├── optimization.py               — CVXPY + SLSQP inverse optimization
├── export_results.py             — headless pipeline → calibrated.json
├── data/
│   └── congestion_observations.csv
└── notebooks/
    ├── 01_bayesian_calibration.ipynb
    ├── 02_validation_backtest.ipynb
    └── 03_inverse_optimization.ipynb
```

---

## Built with

- **Frontend** — React 18, Vite 5, Tailwind CSS, Framer Motion, Lucide icons
- **Mapping** — Mapbox GL JS, react-map-gl, Deck.gl (3D scatter, heat-map, trips, line layers)
- **Charts** — Recharts (radar + delta visualisations)
- **Engine** — Pure-JS deterministic functions in [`src/models/metrics-engine.js`](src/models/metrics-engine.js)
- **Analysis** — Python research layer ([`analysis/`](analysis/)): PyMC (Bayesian
  calibration / NUTS), ArviZ, CVXPY + scipy (inverse optimization), pandas,
  Jupyter
- **Deploy** — GitHub Pages via `.github/workflows/deploy.yml`

---

## Licence

TransitSim is released under the [MIT Licence](LICENSE) — you are free to use,
modify, and redistribute the code, including commercially, provided the
copyright notice is retained.

The MIT Licence covers the **source code only**. Third-party npm dependencies
retain their own licences (note that Mapbox GL JS v2+ is distributed under
Mapbox's proprietary terms and requires an access token). Model coefficients
are uncopyrightable facts cited from the public sources listed above; the
geospatial data in [`src/data/toronto-geo.js`](src/data/toronto-geo.js) derives
from City of Toronto Open Data, published under the Open Government Licence –
Toronto with attribution preserved in that file.

---

## Author

[**Hasan Malik**](https://hasan-malik.github.io) · 2026

The complete in-app documentation — including animated equations and a hyperlinked bibliography — is available via the **About** button in the top-right of the simulator.

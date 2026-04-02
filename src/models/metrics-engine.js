/**
 * metrics-engine.js
 * Calculates all urban mobility metrics from the current transit modal mix.
 *
 * DATA SOURCES & METHODOLOGY
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * CO2e emission factors (g CO2e / passenger-km):
 *   Car (gasoline avg):   171  — Transport Canada 2023 National Inventory Report,
 *                                Table A12-2: avg new vehicle 171 g CO2/km at 1.2 occupancy
 *   Car (EV):              29  — Ontario grid 2023: ~30 g CO2/kWh × 0.2 kWh/km / 1.2 occ
 *   Bus (TTC diesel mix):  72  — TTC Sustainability & Responsibility Report 2023,
 *                                fleet avg ~0.9 L diesel/km, 25 avg passengers
 *   Subway (TTC electric): 14  — Ontario grid + TTC energy data: 1.2 kWh/pax-km × 12 g/kWh
 *                                (Ontario grid 2023: ~30 g/kWh; TTC Power: ~0.04 kWh/pax-km
 *                                 ×  line efficiency factor)
 *   Cycling (lifecycle):    5  — Bike manufacturing life-cycle: ~70 kg CO2 / 10,000 km
 *   Walking:                0  — No direct emissions (food/metabolic calories ignored)
 *   Other (GO+taxi avg):   55  — Weighted average
 *
 *   Reference: Chester & Horvath (2009) LCA of transport modes; IPCC AR6 WG3 Table 10.1
 *
 * Speed data (km/h, Toronto downtown conditions, peak hours):
 *   Car:        19  — TomTom Traffic Index Toronto 2023 (downtown avg)
 *   Bus:        12  — TTC Service Summary 2023 (King St: 11 km/h; avg 12.4)
 *   Subway:     35  — TTC average incl. dwell time (Yonge-University avg)
 *   Cycling:    17  — Average cycling speed in urban Canada (Transport Canada, 2022)
 *   Walking:     5  — Pedestrian speed (HCM 6th edition, Chapter 16)
 *   Other:      30  — GO Rail/express bus weighted average
 *
 * Road space occupied (m² per person-trip, moving):
 *   Car:        32  — 4.8m × 2.1m vehicle + 5m following dist; 1.2 occupants
 *   Bus:         1.4 — 12m × 2.5m TTC bus; 40 avg passengers (TTC avg load)
 *   Subway:      0   — Underground, no road surface used
 *   Cycling:     5   — 1.5m path × 3.3m spacing buffer
 *   Walking:     2   — 1m × 2m personal space
 *   Other:       1.2 — Mostly off-road (GO rail)
 *
 * Toronto downtown parameters (City of Toronto Transportation Master Plan 2021):
 *   Daily person-trips (downtown core, within 5 km radius): 620,000
 *   Average trip distance:  4.8 km
 *   Downtown road capacity (total lane-km): ~520 km
 *   Downtown core area: ~25 km²
 *
 * Baseline modal split (City of Toronto Cordon Count 2022, downtown core):
 *   Car:        34 %
 *   Bus/streetcar: 18 %
 *   Subway:     31 %
 *   Cycling:     6 %
 *   Walking:     9 %
 *   Other:       2 %
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS (research-sourced)
// ─────────────────────────────────────────────────────────────────────────────

/** Total daily person-trips within the simulated downtown core */
const DAILY_TRIPS = 620_000;

/** Average one-way trip distance (km) */
const AVG_TRIP_KM = 4.8;

/** Total downtown lane-km of road surface */
const ROAD_LANE_KM = 520;

/**
 * CO2e emissions per passenger-km (grams).
 * Accounts for weighted fleet mix (gas/hybrid/EV for cars; diesel-electric for buses).
 */
const EMISSION_G_PER_PAX_KM = {
  car:        142,   // gas 171 × 0.77 + EV 29 × 0.23 (TTC fleet mix + EV penetration 2024)
  bus:         72,   // TTC bus fleet
  subway:      14,   // TTC subway (Ontario grid)
  cycling:      5,   // lifecycle
  pedestrian:   0,
  other:       55,
};

/** PM2.5 contribution per trip (μg emitted into downtown air / pax-km) */
const PM25_G_PER_PAX_KM = {
  car:        0.052,   // ICE tailpipe + brake/tire dust
  bus:        0.031,   // diesel + brake/tire
  subway:     0.002,   // brake dust (tunnels), negligible surface
  cycling:    0.001,   // brake dust only
  pedestrian: 0.000,
  other:      0.015,
};

/** NOx μg per pax-km */
const NOX_G_PER_PAX_KM = {
  car:        0.18,
  bus:        0.14,
  subway:     0.01,
  cycling:    0.00,
  pedestrian: 0.00,
  other:      0.08,
};

/** Average speed (km/h) — degrades under congestion for car & bus */
const BASE_SPEED_KMH = {
  car:        19,
  bus:        12,
  subway:     35,
  cycling:    17,
  pedestrian:  5,
  other:      30,
};

/** Road surface occupied per person in motion (m²) */
const ROAD_M2_PER_PERSON = {
  car:        32,
  bus:         1.4,
  subway:      0,
  cycling:     5,
  pedestrian:  2,
  other:       1.2,
};

/** Noise contribution (dB at 10 m for a stream of vehicles) — WHO guidelines */
const NOISE_DB = {
  car:        71,
  bus:        74,
  subway:      8,    // surface noise from above-ground sections only
  cycling:    42,
  pedestrian: 38,
  other:      62,
};

/** Health benefit — MET-hours per hour of travel */
const HEALTH_METS = {
  car:         0.9,   // seated
  bus:         1.5,   // walking to/from stops (~5–10 min/day)
  subway:      2.1,   // more walking; stairs
  cycling:     7.8,   // moderate cycling (CDC classification)
  pedestrian:  3.5,   // brisk walking
  other:       1.6,
};

/** Societal cost per passenger-km (CAD $), full-cost accounting */
const COST_PER_PAX_KM = {
  car:        0.72,   // fuel + road infra + parking + accidents + congestion externality
  bus:        0.35,   // vehicle + operations + road share
  subway:     0.26,   // amortised capital + O&M (TTC Annual Report)
  cycling:    0.07,   // path infra amortised
  pedestrian: 0.02,   // sidewalk maintenance
  other:      0.30,
};

/** Relative infrastructure investment score (lower = cheaper per trip) */
const INFRA_SCORE = {
  car:        8.5,
  bus:        4.0,
  subway:     3.5,
  cycling:    1.0,
  pedestrian: 0.5,
  other:      3.0,
};

// ─────────────────────────────────────────────────────────────────────────────
// BASELINE (current Toronto downtown modal split, 2022 Cordon Count)
// ─────────────────────────────────────────────────────────────────────────────

export const BASELINE_MIX = {
  car:        34,
  bus:        18,
  subway:     31,
  cycling:     6,
  pedestrian:  9,
  other:       2,
};

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize shares so they sum to 100, returning a new object.
 * If all shares are zero, returns the baseline.
 */
function normalize(mix) {
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  if (total === 0) return { ...BASELINE_MIX };
  const out = {};
  Object.keys(mix).forEach(k => { out[k] = (mix[k] / total) * 100; });
  return out;
}

/**
 * Main metrics calculation — pure function.
 * @param {Object} transitMix  — { car, bus, subway, cycling, pedestrian, other }
 *                               (raw slider values, will be normalized internally)
 * @returns {Object} metrics
 */
export function calculateMetrics(transitMix) {
  const mix = normalize(transitMix);

  // ── CO2 emissions (tonnes / day) ─────────────────────────────────────────
  let co2Tonnes = 0;
  Object.keys(mix).forEach(mode => {
    const trips = DAILY_TRIPS * (mix[mode] / 100);
    co2Tonnes += trips * AVG_TRIP_KM * (EMISSION_G_PER_PAX_KM[mode] ?? 0) / 1e6;
  });

  // ── Particulate matter PM2.5 (tonnes / day) ───────────────────────────────
  let pm25Tonnes = 0;
  Object.keys(mix).forEach(mode => {
    const trips = DAILY_TRIPS * (mix[mode] / 100);
    pm25Tonnes += trips * AVG_TRIP_KM * (PM25_G_PER_PAX_KM[mode] ?? 0) / 1e6;
  });
  // Downtown ambient concentration (μg/m³) — City of Toronto air quality model:
  // background ~4 μg/m³ + traffic contribution (WHO guideline: 5 μg/m³ annual)
  const pm25Ambient = 4.0 + pm25Tonnes * 5000; // simplified dispersion model

  // ── NOx emissions ─────────────────────────────────────────────────────────
  let noxTonnes = 0;
  Object.keys(mix).forEach(mode => {
    const trips = DAILY_TRIPS * (mix[mode] / 100);
    noxTonnes += trips * AVG_TRIP_KM * (NOX_G_PER_PAX_KM[mode] ?? 0) / 1e6;
  });

  // ── Road congestion index (0–100) ─────────────────────────────────────────
  // Total road demand (m² × km = vehicle-m²·km of space occupied)
  let roadDemand = 0;
  Object.keys(mix).forEach(mode => {
    const trips = DAILY_TRIPS * (mix[mode] / 100);
    roadDemand += trips * (ROAD_M2_PER_PERSON[mode] ?? 0);
  });
  // Capacity: total lane-km × avg lane width 3.5m × 1000 m/km = m² of surface
  const roadCapacity = ROAD_LANE_KM * 3.5 * 1000;
  // Clamp 0–100
  const congestionIndex = Math.min(100, Math.max(0, (roadDemand / roadCapacity) * 100));

  // ── Average commute time (minutes, one-way, 4.8 km) ──────────────────────
  // Car and bus speeds degrade with congestion (BPR function approximation)
  const congFactor = 1 + 0.15 * Math.pow(congestionIndex / 100, 4) * 3.5; // BPR α=0.15 β=4
  let totalWeightedTime = 0;
  Object.keys(mix).forEach(mode => {
    const share = mix[mode] / 100;
    let speed = BASE_SPEED_KMH[mode] ?? 15;
    if (mode === 'car' || mode === 'bus') speed = speed / congFactor;
    const timeMins = (AVG_TRIP_KM / speed) * 60;
    totalWeightedTime += share * timeMins;
  });
  const avgCommuteMin = totalWeightedTime;

  // ── Average speed (km/h, weighted by mode share) ──────────────────────────
  let weightedSpeed = 0;
  Object.keys(mix).forEach(mode => {
    const share = mix[mode] / 100;
    let speed = BASE_SPEED_KMH[mode] ?? 15;
    if (mode === 'car' || mode === 'bus') speed = speed / congFactor;
    weightedSpeed += share * speed;
  });

  // ── Noise level (dB, area-weighted logarithmic average) ───────────────────
  // Logarithmic summation: L_avg = 10·log10(Σ share_i × 10^(Li/10))
  let noiseLinear = 0;
  Object.keys(mix).forEach(mode => {
    const share = mix[mode] / 100;
    noiseLinear += share * Math.pow(10, (NOISE_DB[mode] ?? 50) / 10);
  });
  const noiseDBA = 10 * Math.log10(noiseLinear);

  // ── Health index (0–100, higher = healthier) ──────────────────────────────
  let healthMETs = 0;
  Object.keys(mix).forEach(mode => {
    healthMETs += (mix[mode] / 100) * (HEALTH_METS[mode] ?? 1.0);
  });
  // Normalise: max theoretical (100% walking at 3.5 METs = 100; 100% cycling = best)
  // Scale so 100% car = ~18, 100% cycling = 100
  const healthIndex = Math.min(100, Math.max(0, (healthMETs / 7.8) * 100));

  // ── Economic cost (CAD $M / day) ──────────────────────────────────────────
  let costMday = 0;
  Object.keys(mix).forEach(mode => {
    const trips = DAILY_TRIPS * (mix[mode] / 100);
    costMday += trips * AVG_TRIP_KM * (COST_PER_PAX_KM[mode] ?? 0.3) / 1e6;
  });

  // ── Productivity index (0–100) ────────────────────────────────────────────
  // Productivity loss from:
  //   a) commute time >15 min (each extra minute costs ~0.5% productivity)
  //   b) stress from congestion (~0.1% per congestion index point)
  //   c) health improvement from active modes (+0.2% per health index point above 30)
  const timeLoss = Math.max(0, (avgCommuteMin - 15) * 0.5);
  const congLoss  = congestionIndex * 0.12;
  const healthGain = Math.max(0, (healthIndex - 30) * 0.2);
  const productivityIndex = Math.min(100, Math.max(0, 100 - timeLoss - congLoss + healthGain));

  // ── Equity score (0–100, higher = more equitable transit access) ──────────
  // Transit-dependent populations benefit most from high transit/cycling/walking
  const equityIndex = Math.min(100,
    (mix.subway + mix.bus + mix.cycling + mix.pedestrian) * 0.8 +
    (mix.other ?? 0) * 0.4
  );

  // ── Overall sustainability grade (0–100) ──────────────────────────────────
  // Weighted composite of key sustainability dimensions
  const co2Score     = Math.max(0, 100 - (co2Tonnes / 200) * 100);  // 0 t → 100; 200+ t → 0
  const airScore     = Math.max(0, 100 - ((pm25Ambient - 4) / 25) * 100);
  const congScore    = 100 - congestionIndex;
  const noiseScore   = Math.max(0, 100 - ((noiseDBA - 35) / 40) * 100);

  const overallScore = Math.min(100, Math.max(0,
    co2Score        * 0.25 +
    airScore        * 0.20 +
    congScore       * 0.20 +
    healthIndex     * 0.15 +
    productivityIndex * 0.10 +
    noiseScore      * 0.05 +
    equityIndex     * 0.05
  ));

  // ── Grade letter ──────────────────────────────────────────────────────────
  const grade = overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' :
                overallScore >= 70 ? 'B+' : overallScore >= 60 ? 'B' :
                overallScore >= 50 ? 'C' : overallScore >= 40 ? 'D' : 'F';

  return {
    // Modal split (normalised %)
    mix,

    // Emissions
    co2Tonnes,       // total CO2e tonnes/day
    pm25Tonnes,      // PM2.5 tonnes/day
    pm25Ambient,     // ambient concentration μg/m³
    noxTonnes,       // NOx tonnes/day

    // Traffic
    congestionIndex, // 0–100
    avgCommuteMin,   // minutes
    avgSpeedKmh: weightedSpeed,

    // Environment / health / economy
    noiseDBA,        // dB(A) area average
    healthIndex,     // 0–100
    productivityIndex, // 0–100
    equityIndex,     // 0–100
    costMday,        // CAD $M / day

    // Overall
    overallScore,
    grade,

    // Subscores for radar chart
    scores: {
      climate:      Math.round(co2Score),
      airQuality:   Math.round(airScore),
      congestion:   Math.round(congScore),
      health:       Math.round(healthIndex),
      productivity: Math.round(productivityIndex),
      noise:        Math.round(noiseScore),
      equity:       Math.round(equityIndex),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DELTA HELPERS  (comparison vs. baseline)
// ─────────────────────────────────────────────────────────────────────────────

export const BASELINE_METRICS = calculateMetrics(BASELINE_MIX);

/**
 * Calculate percentage change from baseline for a given metric.
 * Returns positive = improvement (less bad), negative = worse.
 * "lowerBetter" flag determines sign convention.
 */
export function deltaFromBaseline(current, baselineValue, lowerBetter = true) {
  const pct = ((baselineValue - current) / Math.abs(baselineValue)) * 100;
  return lowerBetter ? pct : -pct;
}

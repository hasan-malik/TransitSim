/**
 * trip-generator.js
 * Generates animated vehicle trip data for the deck.gl TripsLayer.
 *
 * Each trip: { mode, path: [[lng,lat],...], timestamps: [seconds,...], color: [r,g,b] }
 *
 * Trips follow the actual Toronto downtown street grid:
 *   – Cars travel along N-S streets then turn onto E-W streets (realistic grid navigation)
 *   – Buses follow their named route corridors exactly
 *   – Subway trains follow TTC line coordinates
 *   – Cyclists follow the cycling network
 *   – Pedestrians take short direct paths
 *
 * Uses a seeded PRNG so the animation is deterministic (same every page load).
 */

import {
  SUBWAY_LINES,
  BUS_ROUTES,
  CYCLING_NETWORK,
  NS_STREETS,
  EW_STREETS,
  PEDESTRIAN_HUBS,
} from './toronto-geo.js';

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Duration of one full animation loop (seconds of simulated time) */
export const LOOP_LENGTH = 3600;   // 1 simulated hour

/** Average speed multiplied per mode (km/h) */
const SPEEDS = {
  car:        19,
  bus:        12,
  subway:     35,
  cycling:    17,
  pedestrian:  5,
};

/** Trip colours [R, G, B] */
const COLORS = {
  car:        [249, 115,  22],   // orange
  bus:        [251, 191,  36],   // amber
  subway:     [ 56, 189, 248],   // sky blue
  cycling:    [ 74, 222, 128],   // green
  pedestrian: [192, 132, 252],   // purple
};

/** Trail lengths (seconds) — longer = more ghosting visible on map */
export const TRAIL_LENGTHS = {
  car:        60,
  bus:        80,
  subway:     200,
  cycling:    100,
  pedestrian:  40,
};

// ─────────────────────────────────────────────────────────────────────────────
// SEEDED PRNG  (Mulberry32 — deterministic)
// ─────────────────────────────────────────────────────────────────────────────

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GEOMETRY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Haversine distance in metres between two [lng, lat] points */
function distM([lng1, lat1], [lng2, lat2]) {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Build timestamps array given path points and speed (km/h). */
function buildTimestamps(path, speedKmh) {
  const speedMs = (speedKmh * 1000) / 3600; // m/s
  const ts = [0];
  for (let i = 1; i < path.length; i++) {
    const d = distM(path[i - 1], path[i]);
    ts.push(ts[ts.length - 1] + d / speedMs);
  }
  return ts;
}

/** Interpolate evenly-spaced sub-points between two coordinates (N segments). */
function interpolate([lng1, lat1], [lng2, lat2], steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([lng1 + (lng2 - lng1) * t, lat1 + (lat2 - lat1) * t]);
  }
  return pts;
}

/** Snap a longitude to the nearest N-S street and return that street object. */
function nearestNS(lng) {
  return NS_STREETS.reduce((prev, curr) =>
    Math.abs(curr.lng - lng) < Math.abs(prev.lng - lng) ? curr : prev
  );
}

/** Snap a latitude to the nearest E-W street and return that street object. */
function nearestEW(lat) {
  return EW_STREETS.reduce((prev, curr) =>
    Math.abs(curr.lat - lat) < Math.abs(prev.lat - lat) ? curr : prev
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIP BUILDERS — one per mode
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a single car trip that follows the Toronto street grid:
 *   start → nearest N-S street → nearest E-W street → end
 */
function carTrip(rng, startOffset) {
  // Pick random bounding box within downtown core
  const lngMin = -79.440, lngMax = -79.355;
  const latMin =  43.635, latMax =  43.684;

  const startLng = lngMin + rng() * (lngMax - lngMin);
  const startLat = latMin + rng() * (latMax - latMin);
  const endLng   = lngMin + rng() * (lngMax - lngMin);
  const endLat   = latMin + rng() * (latMax - latMin);

  const ns = nearestNS((startLng + endLng) / 2);
  const ew = nearestEW((startLat + endLat) / 2);

  // Build L-shaped grid path
  const seg1 = interpolate([startLng, startLat], [ns.lng, startLat], 6);
  const seg2 = interpolate([ns.lng, startLat],   [ns.lng, ew.lat],   8);
  const seg3 = interpolate([ns.lng, ew.lat],     [endLng, ew.lat],   6);

  const path = [...seg1, ...seg2.slice(1), ...seg3.slice(1)];
  const timestamps = buildTimestamps(path, SPEEDS.car).map(t => t + startOffset);

  return { mode: 'car', path, timestamps, color: COLORS.car };
}

/**
 * Generate a bus trip along an existing route corridor,
 * starting at a random position along the route.
 */
function busTrip(routeKey, rng, startOffset) {
  const route = Object.values(BUS_ROUTES)[routeKey % Object.keys(BUS_ROUTES).length];
  const pts = route.path;

  // Random start index along route
  const startIdx = Math.floor(rng() * (pts.length - 2));
  const direction = rng() > 0.5 ? 1 : -1; // eastbound or westbound

  let path = [];
  if (direction === 1) {
    path = pts.slice(startIdx);
  } else {
    path = pts.slice(0, startIdx + 1).reverse();
  }

  // Interpolate between each pair of route stops for smooth motion
  const smoothPath = [];
  for (let i = 0; i < path.length - 1; i++) {
    const pts_ = interpolate(path[i], path[i + 1], 8);
    smoothPath.push(...(i === 0 ? pts_ : pts_.slice(1)));
  }

  const timestamps = buildTimestamps(smoothPath, SPEEDS.bus).map(t => t + startOffset);

  return { mode: 'bus', path: smoothPath, timestamps, color: COLORS.bus };
}

/**
 * Generate a subway train trip along a TTC line.
 * One train follows the full path in one direction.
 */
function subwayTrip(lineKey, direction, startOffset) {
  const line = SUBWAY_LINES[lineKey];
  const pts = direction === 1 ? line.path : [...line.path].reverse();

  // Smooth between each station pair
  const smoothPath = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const seg = interpolate(pts[i], pts[i + 1], 12);
    smoothPath.push(...(i === 0 ? seg : seg.slice(1)));
  }

  const timestamps = buildTimestamps(smoothPath, SPEEDS.subway).map(t => t + startOffset);

  return { mode: 'subway', path: smoothPath, timestamps, color: line.color };
}

/**
 * Generate a cycling trip along the cycling network or a direct downtown path.
 */
function cyclingTrip(rng, startOffset) {
  const networkKeys = Object.keys(CYCLING_NETWORK);
  const route = CYCLING_NETWORK[networkKeys[Math.floor(rng() * networkKeys.length)]];
  const pts = route.path;

  const direction = rng() > 0.5 ? 1 : -1;
  const basePts = direction === 1 ? pts : [...pts].reverse();

  const smoothPath = [];
  for (let i = 0; i < basePts.length - 1; i++) {
    const seg = interpolate(basePts[i], basePts[i + 1], 5);
    smoothPath.push(...(i === 0 ? seg : seg.slice(1)));
  }

  const timestamps = buildTimestamps(smoothPath, SPEEDS.cycling).map(t => t + startOffset);

  return { mode: 'cycling', path: smoothPath, timestamps, color: COLORS.cycling };
}

/**
 * Generate a pedestrian trip between two nearby hubs or random points.
 */
function pedestrianTrip(rng, startOffset) {
  const hubs = PEDESTRIAN_HUBS;
  const from = hubs[Math.floor(rng() * hubs.length)].position;

  // Walk to a nearby hub or a random nearby point
  const useFarHub = rng() > 0.4;
  let to;
  if (useFarHub) {
    to = hubs[Math.floor(rng() * hubs.length)].position;
  } else {
    to = [
      from[0] + (rng() - 0.5) * 0.012,
      from[1] + (rng() - 0.5) * 0.008,
    ];
  }

  const path = interpolate(from, to, 10);
  const timestamps = buildTimestamps(path, SPEEDS.pedestrian).map(t => t + startOffset);

  return { mode: 'pedestrian', path, timestamps, color: COLORS.pedestrian };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate all animated trips based on current modal mix.
 *
 * Trip counts scale with each mode's share.
 * All trips have start offsets spread across LOOP_LENGTH so there's
 * always activity throughout the simulation window.
 *
 * @param {Object} transitMix  { car, bus, subway, cycling, pedestrian, other }
 * @returns {Array} trips for deck.gl TripsLayer
 */
export function generateTrips(transitMix) {
  const rng = mulberry32(0xdeadbeef); // fixed seed → deterministic

  const total  = Object.values(transitMix).reduce((a, b) => a + b, 0) || 100;
  const shares = {};
  Object.keys(transitMix).forEach(k => { shares[k] = transitMix[k] / total; });

  // ── Trip counts (tuned for visual density without overwhelming the GPU) ────
  const N_CAR   = Math.round(shares.car        * 320);
  const N_BUS   = Math.round(shares.bus        * 140);
  const N_SUB   = Math.round(shares.subway     * 60);
  const N_CYC   = Math.round(shares.cycling    * 200);
  const N_PED   = Math.round(shares.pedestrian * 280);

  const trips = [];

  // ── Cars ──────────────────────────────────────────────────────────────────
  for (let i = 0; i < N_CAR; i++) {
    const offset = rng() * LOOP_LENGTH;
    trips.push(carTrip(rng, offset));
  }

  // ── Buses ─────────────────────────────────────────────────────────────────
  for (let i = 0; i < N_BUS; i++) {
    const offset = rng() * LOOP_LENGTH;
    trips.push(busTrip(i, rng, offset));
  }

  // ── Subway trains (multiple per line, staggered) ──────────────────────────
  const subwayLineKeys = Object.keys(SUBWAY_LINES);
  // Each line gets trains every ~6 simulated minutes = 360 s
  const TRAIN_HEADWAY = 360;
  subwayLineKeys.forEach(key => {
    const trainsPerLine = Math.max(1, Math.round(N_SUB / subwayLineKeys.length));
    for (let i = 0; i < trainsPerLine; i++) {
      const offset = (i * TRAIN_HEADWAY) % LOOP_LENGTH;
      trips.push(subwayTrip(key, 1, offset));
      trips.push(subwayTrip(key, -1, (offset + TRAIN_HEADWAY / 2) % LOOP_LENGTH));
    }
  });

  // ── Cyclists ──────────────────────────────────────────────────────────────
  for (let i = 0; i < N_CYC; i++) {
    const offset = rng() * LOOP_LENGTH;
    trips.push(cyclingTrip(rng, offset));
  }

  // ── Pedestrians ───────────────────────────────────────────────────────────
  for (let i = 0; i < N_PED; i++) {
    const offset = rng() * LOOP_LENGTH;
    trips.push(pedestrianTrip(rng, offset));
  }

  return trips;
}

// ─────────────────────────────────────────────────────────────────────────────
// POLLUTION HEATMAP POINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a static grid of pollution sample points for HeatmapLayer.
 * Weights are proportional to road traffic density at each location
 * (derived from car + bus concentration along major corridors).
 *
 * Call once; update weights via the layer's `getWeight` accessor when mix changes.
 */
export function generatePollutionGrid() {
  const rng = mulberry32(0xc0ffee);
  const pts = [];

  // Coarse city-wide grid
  for (let lat = 43.620; lat <= 43.720; lat += 0.005) {
    for (let lng = -79.460; lng <= -79.330; lng += 0.005) {
      pts.push({ position: [lng, lat], baseWeight: 0.3 + rng() * 0.7 });
    }
  }

  // Dense downtown grid (higher resolution where it matters)
  for (let lat = 43.635; lat <= 43.685; lat += 0.0025) {
    for (let lng = -79.440; lng <= -79.355; lng += 0.0025) {
      pts.push({ position: [lng, lat], baseWeight: 0.5 + rng() * 0.5 });
    }
  }

  // Hot-spots along major arterials (Gardiner, DVP, Yonge, etc.)
  const hotSpots = [
    // Gardiner Expressway
    ...Array.from({ length: 20 }, (_, i) => ({
      position: [-79.455 + i * 0.005, 43.634 + rng() * 0.002],
      baseWeight: 1.0,
    })),
    // DVP
    ...Array.from({ length: 15 }, (_, i) => ({
      position: [-79.341 + rng() * 0.002, 43.652 + i * 0.003],
      baseWeight: 0.9,
    })),
    // Yonge
    ...Array.from({ length: 15 }, (_, i) => ({
      position: [-79.379 + rng() * 0.001, 43.640 + i * 0.003],
      baseWeight: 0.8,
    })),
    // Bloor
    ...Array.from({ length: 15 }, (_, i) => ({
      position: [-79.450 + i * 0.006, 43.670 + rng() * 0.001],
      baseWeight: 0.7,
    })),
  ];
  pts.push(...hotSpots);

  return pts;
}

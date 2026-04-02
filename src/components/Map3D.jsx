/**
 * Map3D.jsx
 * Core 3D map using DeckGL + Mapbox GL JS.
 *
 * Layers (in draw order):
 *   1. Mapbox dark base map + 3D buildings (fill-extrusion from OSM data)
 *   2. MAJOR_ROADS — PathLayer coloured by congestion level
 *   3. SUBWAY_LINES — PathLayer with glow effect (wide semi-transparent + thin bright)
 *   4. BUS_ROUTES  — PathLayer amber
 *   5. CYCLING_NETWORK — PathLayer green
 *   6. STATION dots — ScatterplotLayer
 *   7. POLLUTION HeatmapLayer (car + bus weighted)
 *   8. TRIPS TripsLayer — animated moving vehicles
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import Map from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import {
  SUBWAY_LINES,
  BUS_ROUTES,
  CYCLING_NETWORK,
  MAJOR_ROADS,
  ALL_STATIONS,
  INITIAL_VIEW_STATE,
} from '../data/toronto-geo.js';
import { generateTrips, generatePollutionGrid, LOOP_LENGTH } from '../data/trip-generator.js';

// Trail lengths per mode (seconds of visible history on map)
const TRAIL_LENGTHS = { car: 60, bus: 90, subway: 220, cycling: 110, pedestrian: 45 };

// ─── Constants ────────────────────────────────────────────────────────────────
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';
const ANIMATION_SPEED = 1.8; // simulated seconds per real second × 60fps factor

// Pre-generate pollution grid once (static geometry, only weights change)
const POLLUTION_GRID = generatePollutionGrid();

// ─── Helper: lerp colour between green/yellow/red based on value 0–100 ────────
function congestionColor(c) {
  if (c < 40) return [34 + c * 2, 197 - c * 2, 94, 200];
  if (c < 70) return [250, 200 - (c - 40) * 2, 20, 200];
  return [239, 68, 68, 220];
}

// ─── Missing token banner ──────────────────────────────────────────────────────
function TokenBanner() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface-900 text-center px-8 z-50">
      <div className="text-5xl">🗺️</div>
      <h2 className="text-2xl font-bold text-white">Mapbox Token Required</h2>
      <p className="text-slate-400 max-w-md text-sm leading-relaxed">
        This simulation uses Mapbox GL JS for the photorealistic 3D map.
        <br /><br />
        <span className="text-accent-cyan font-mono text-xs">
          cp .env.example .env
        </span>
        &nbsp;then add your free token from{' '}
        <span className="text-accent-cyan">account.mapbox.com</span>
        &nbsp;(no credit card needed).
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Map3D({ transitMix, activeLayers, metrics }) {
  const [simTime, setSimTime] = useState(0);
  const animFrameRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  // ── Animation loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = (ts) => {
      if (lastTimestampRef.current !== null) {
        const delta = ts - lastTimestampRef.current; // ms
        setSimTime(t => (t + (delta / 1000) * ANIMATION_SPEED * 60) % LOOP_LENGTH);
      }
      lastTimestampRef.current = ts;
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      lastTimestampRef.current = null;
    };
  }, []);

  // ── Generate trips (re-generates when modal mix changes) ────────────────────
  const trips = useMemo(() => generateTrips(transitMix), [
    // Stringify to avoid unnecessary re-gens on reference equality changes
    transitMix.car, transitMix.bus, transitMix.subway,
    transitMix.cycling, transitMix.pedestrian,
  ]);

  // ── Pollution heatmap weights (update live with mix changes) ─────────────────
  const pollutionData = useMemo(() => {
    const total = Object.values(transitMix).reduce((a, b) => a + b, 0) || 100;
    const carShare = transitMix.car / total;
    const busShare = transitMix.bus / total;
    // CO2-weighted intensity: car dominates surface-level emissions
    const intensity = carShare * 0.88 + busShare * 0.12;
    return POLLUTION_GRID.map(p => ({
      position: p.position,
      weight: p.baseWeight * intensity,
    }));
  }, [transitMix.car, transitMix.bus]);

  // ── Congestion colour for roads ─────────────────────────────────────────────
  const roadColor = useMemo(() => congestionColor(metrics.congestionIndex), [metrics.congestionIndex]);

  // ── Build DeckGL layer stack ────────────────────────────────────────────────
  const layers = useMemo(() => {
    const L = [];

    // 1. Major roads — coloured by congestion
    if (activeLayers.traffic) {
      MAJOR_ROADS.forEach((road, i) => {
        L.push(new PathLayer({
          id: `road-${i}`,
          data: [road],
          getPath: d => d.path,
          getColor: roadColor,
          getWidth: road.type === 'highway' ? 6 : 3,
          widthUnits: 'pixels',
          widthMinPixels: road.type === 'highway' ? 3 : 1.5,
          capRounded: true,
          jointRounded: true,
          opacity: 0.7,
          pickable: true,
          onHover: ({ object, x, y }) => {
            setTooltip(object ? { text: object.name, x, y } : null);
          },
        }));
      });
    }

    // 2. Subway lines — glow (wide + narrow stack)
    if (activeLayers.transit) {
      Object.entries(SUBWAY_LINES).forEach(([key, line]) => {
        // Outer glow
        L.push(new PathLayer({
          id: `subway-glow-${key}`,
          data: [{ path: line.path, name: line.name }],
          getPath: d => d.path,
          getColor: [...line.color, 35],
          getWidth: 18,
          widthUnits: 'pixels',
          capRounded: true,
          jointRounded: true,
          opacity: 1,
        }));
        // Core line
        L.push(new PathLayer({
          id: `subway-core-${key}`,
          data: [{ path: line.path, name: line.name }],
          getPath: d => d.path,
          getColor: [...line.color, 230],
          getWidth: 3.5,
          widthUnits: 'pixels',
          widthMinPixels: 2,
          capRounded: true,
          jointRounded: true,
          pickable: true,
          onHover: ({ object, x, y }) => {
            setTooltip(object ? { text: line.name, x, y } : null);
          },
        }));
      });
    }

    // 3. Bus / streetcar routes
    if (activeLayers.transit) {
      Object.entries(BUS_ROUTES).forEach(([key, route]) => {
        L.push(new PathLayer({
          id: `bus-${key}`,
          data: [{ path: route.path, name: route.name }],
          getPath: d => d.path,
          getColor: [251, 191, 36, 180],
          getWidth: 2.5,
          widthUnits: 'pixels',
          widthMinPixels: 1.5,
          capRounded: true,
          pickable: true,
          onHover: ({ object, x, y }) => {
            setTooltip(object ? { text: route.name, x, y } : null);
          },
        }));
      });
    }

    // 4. Cycling network
    if (activeLayers.cycling) {
      Object.entries(CYCLING_NETWORK).forEach(([key, path]) => {
        // Glow
        L.push(new PathLayer({
          id: `bike-glow-${key}`,
          data: [{ path: path.path }],
          getPath: d => d.path,
          getColor: [74, 222, 128, 25],
          getWidth: 10,
          widthUnits: 'pixels',
          capRounded: true,
        }));
        // Line
        L.push(new PathLayer({
          id: `bike-line-${key}`,
          data: [{ path: path.path, name: path.name }],
          getPath: d => d.path,
          getColor: [74, 222, 128, 210],
          getWidth: 2.5,
          widthUnits: 'pixels',
          widthMinPixels: 1.5,
          capRounded: true,
          pickable: true,
          onHover: ({ object, x, y }) => {
            setTooltip(object ? { text: path.name, x, y } : null);
          },
        }));
      });
    }

    // 5. Transit stations
    if (activeLayers.transit) {
      // Outer halo
      L.push(new ScatterplotLayer({
        id: 'stations-halo',
        data: ALL_STATIONS,
        getPosition: d => d.position,
        getFillColor: d => [...d.color, 40],
        getRadius: d => d.type === 'subway' ? 160 : 90,
        radiusUnits: 'meters',
        radiusMinPixels: 4,
        stroked: false,
      }));
      // Core dot
      L.push(new ScatterplotLayer({
        id: 'stations-core',
        data: ALL_STATIONS,
        getPosition: d => d.position,
        getFillColor: d => [...d.color, 230],
        getRadius: d => d.type === 'subway' ? 60 : 35,
        radiusUnits: 'meters',
        radiusMinPixels: 3,
        radiusMaxPixels: 10,
        stroked: true,
        getLineColor: [255, 255, 255, 160],
        getLineWidth: 1.5,
        lineWidthUnits: 'pixels',
        pickable: true,
        onHover: ({ object, x, y }) => {
          setTooltip(object ? { text: object.name, x, y } : null);
        },
      }));
    }

    // 6. Pollution heatmap
    if (activeLayers.heatmap && (transitMix.car > 0 || transitMix.bus > 0)) {
      L.push(new HeatmapLayer({
        id: 'pollution-heat',
        data: pollutionData,
        getPosition: d => d.position,
        getWeight: d => d.weight,
        radiusPixels: 55,
        intensity: 1.8,
        threshold: 0.03,
        colorRange: [
          [0,   220, 50,  0  ],   // transparent clean
          [0,   220, 50,  80 ],   // green (clean)
          [255, 230, 0,  140 ],   // yellow (moderate)
          [255, 140, 0,  190 ],   // orange (unhealthy)
          [220, 30,  30, 230 ],   // red (hazardous)
        ],
        opacity: 0.55,
      }));
    }

    // 7. Animated trips — one TripsLayer per mode (each needs its own trailLength)
    if (activeLayers.trips && trips.length > 0) {
      const byMode = {};
      trips.forEach(t => {
        if (!byMode[t.mode]) byMode[t.mode] = [];
        byMode[t.mode].push(t);
      });

      Object.entries(byMode).forEach(([mode, modeTrips]) => {
        L.push(new TripsLayer({
          id:             `trips-${mode}`,
          data:           modeTrips,
          getPath:        d => d.path,
          getTimestamps:  d => d.timestamps,
          getColor:       d => d.color,
          opacity:        0.88,
          widthMinPixels: mode === 'subway' ? 3 : 1.8,
          widthMaxPixels: mode === 'subway' ? 5 : 3.5,
          capRounded:     true,
          trailLength:    TRAIL_LENGTHS[mode] ?? 80,
          currentTime:    simTime,
          shadowEnabled:  false,
          parameters:     { depthTest: false },
        }));
      });
    }

    return L;
  }, [activeLayers, transitMix, metrics.congestionIndex, pollutionData, simTime, trips, roadColor]);

  // ── Mapbox onLoad: add 3D buildings + atmospheric effects ───────────────────
  const onMapLoad = useCallback((evt) => {
    const map = evt.target;

    // Add dramatic 3D building extrusions from Mapbox composite source
    if (!map.getLayer('3d-buildings')) {
      map.addLayer({
        id:     '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type:   'fill-extrusion',
        minzoom: 12,
        paint: {
          'fill-extrusion-color': [
            'interpolate', ['linear'], ['get', 'height'],
            0,    '#0b1220',
            20,   '#0d1630',
            60,   '#101e40',
            120,  '#132550',
            250,  '#172d65',
          ],
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            12, 0,
            13.5, ['get', 'height'],
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            12, 0,
            13.5, ['get', 'min_height'],
          ],
          'fill-extrusion-opacity': 0.90,
        },
      });
    }

    // Atmospheric fog for depth
    map.setFog({
      color:           'rgb(3, 7, 18)',
      'high-color':    'rgb(6, 16, 42)',
      'horizon-blend': 0.015,
      'space-color':   'rgb(0, 0, 8)',
      'star-intensity': 0.7,
    });

    // Subtle sky gradient
    if (!map.getLayer('sky')) {
      map.addLayer({
        id:   'sky',
        type: 'sky',
        paint: {
          'sky-type': 'gradient',
          'sky-gradient': [
            'interpolate', ['linear'],
            ['sky-radial-progress'],
            0.8, 'rgba(6, 14, 35, 1)',
            1,   'rgba(3, 7, 18, 1)',
          ],
          'sky-gradient-center': [0, 0],
          'sky-gradient-radius': 90,
          'sky-opacity': ['interpolate', ['exponential', 0.5], ['zoom'], 0, 0, 5, 0.3, 12, 1],
        },
      });
    }
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────
  if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes('your_token_here')) {
    return <TokenBanner />;
  }

  return (
    <div className="w-full h-full relative">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={{ dragRotate: true, scrollZoom: true, touchZoom: true, keyboard: true }}
        layers={layers}
        onHover={() => {}} // suppress default cursor change
        getCursor={() => 'crosshair'}
        parameters={{ clearColor: [0.02, 0.05, 0.10, 1] }}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={MAP_STYLE}
          onLoad={onMapLoad}
          antialias={true}
          reuseMaps={true}
        />
      </DeckGL>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-20 glass px-3 py-1.5 rounded-lg text-xs text-white font-medium shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Sim clock overlay */}
      <div className="absolute bottom-4 right-4 glass px-3 py-1.5 rounded-xl text-[10px] font-mono text-slate-400 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        LIVE SIM · {Math.floor((simTime / LOOP_LENGTH) * 60).toString().padStart(2,'0')}:
        {Math.floor(((simTime / LOOP_LENGTH) * 60 % 1) * 60).toString().padStart(2,'0')}
      </div>

      {/* Layer legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-xl flex items-center gap-4">
        {[
          { label: 'Car',        color: '#f97316' },
          { label: 'Bus',        color: '#fbbf24' },
          { label: 'Subway',     color: '#38bdf8' },
          { label: 'Cycling',    color: '#4ade80' },
          { label: 'Walking',    color: '#c084fc' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            <span className="text-[10px] text-slate-400 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

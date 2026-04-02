/**
 * MetricsPanel.jsx
 * Right sidebar showing all calculated urban mobility metrics.
 *
 * Sections:
 *   1. Overall score + grade (animated)
 *   2. Radar chart (7 dimensions, vs baseline)
 *   3. Individual metric cards with animated counters
 *   4. Mode breakdown mini-chart
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis,
} from 'recharts';
import MetricCard from './MetricCard.jsx';
import { BASELINE_METRICS } from '../models/metrics-engine.js';
import { MODE_CONFIG } from './TransitSlider.jsx';

// ─── Grade colour map ─────────────────────────────────────────────────────────
const GRADE_COLORS = {
  'A+': '#4ade80', A: '#86efac', 'B+': '#a3e635',
  B:    '#fbbf24',  C: '#fb923c',  D:  '#f87171', F: '#ef4444',
};

// ─── Radar data builder ───────────────────────────────────────────────────────
function buildRadarData(scores, baselineScores) {
  const dims = [
    { key: 'climate',      label: 'Climate'       },
    { key: 'airQuality',   label: 'Air Quality'   },
    { key: 'congestion',   label: 'Congestion'    },
    { key: 'health',       label: 'Health'        },
    { key: 'productivity', label: 'Productivity'  },
    { key: 'noise',        label: 'Noise'         },
    { key: 'equity',       label: 'Equity'        },
  ];
  return dims.map(d => ({
    dimension: d.label,
    current:   Math.round(scores[d.key] ?? 0),
    baseline:  Math.round(baselineScores[d.key] ?? 0),
  }));
}

// ─── Custom radar tooltip ─────────────────────────────────────────────────────
function RadarTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="glass px-3 py-2 rounded-lg text-[11px]">
      <div className="font-semibold text-white">{d?.dimension}</div>
      <div className="text-sky-400">Current: {d?.current}</div>
      <div className="text-slate-500">Baseline: {d?.baseline}</div>
    </div>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, grade }) {
  const gradeColor = GRADE_COLORS[grade] ?? '#94a3b8';
  const circumference = 2 * Math.PI * 36;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
        {/* Background ring */}
        <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        {/* Progress ring */}
        <motion.circle
          cx="44" cy="44" r="36"
          fill="none"
          stroke={gradeColor}
          strokeWidth="7"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${gradeColor})` }}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${strokeDash} ${circumference - strokeDash}` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={grade}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          className="text-2xl font-black font-mono leading-none"
          style={{ color: gradeColor, textShadow: `0 0 10px ${gradeColor}` }}
        >
          {grade}
        </motion.span>
        <span className="text-[9px] text-slate-500 leading-none mt-0.5">{Math.round(score)}/100</span>
      </div>
    </div>
  );
}

// ─── Mode breakdown bar ───────────────────────────────────────────────────────
function ModeBreakdown({ transitMix }) {
  const total = Object.values(transitMix).reduce((a, b) => a + b, 0) || 1;
  const entries = Object.entries(MODE_CONFIG)
    .map(([mode, cfg]) => ({ mode, cfg, share: (transitMix[mode] ?? 0) / total * 100 }))
    .filter(e => e.share > 0.5)
    .sort((a, b) => b.share - a.share);

  return (
    <div className="space-y-1.5">
      {entries.map(({ mode, cfg, share }) => (
        <div key={mode} className="flex items-center gap-2">
          <span className="text-xs w-4 text-center">{cfg.emoji}</span>
          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.glow}` }}
              animate={{ width: `${share}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{share.toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MetricsPanel({ metrics, comparing, transitMix }) {
  const radarData = useMemo(
    () => buildRadarData(metrics.scores, BASELINE_METRICS.scores),
    [metrics.scores]
  );

  const {
    co2Tonnes, pm25Ambient, noxTonnes, congestionIndex, avgCommuteMin,
    avgSpeedKmh, noiseDBA, healthIndex, productivityIndex, equityIndex,
    costMday, overallScore, grade, deltas,
  } = metrics;

  return (
    <div className="h-full flex flex-col bg-surface-800/50 border-l border-white/5 overflow-y-auto">

      {/* ── Overall score ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Sustainability Score
        </div>
        <div className="flex items-center gap-4">
          <ScoreRing score={overallScore} grade={grade} />
          <div className="flex-1 space-y-2">
            <div className="text-xs text-slate-500">vs. Status Quo baseline (2022)</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {[
                { label: 'Climate', val: deltas?.co2, inv: false },
                { label: 'Air',     val: deltas?.pm25, inv: false },
                { label: 'Flow',    val: deltas?.congestion, inv: false },
                { label: 'Health',  val: deltas?.health, inv: true },
              ].map(({ label, val, inv }) => {
                const good = inv ? (val ?? 0) > 0 : (val ?? 0) > 0;
                return (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{label}</span>
                    <span className={`text-[10px] font-mono font-semibold ${good ? 'text-green-400' : 'text-rose-400'}`}>
                      {(val ?? 0) >= 0 ? '+' : ''}{(val ?? 0).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Radar chart ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Multi-Dimensional Analysis
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="dimension" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 10 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            {/* Baseline */}
            <Radar
              name="Baseline (2022)"
              dataKey="baseline"
              stroke="rgba(148,163,184,0.4)"
              fill="rgba(148,163,184,0.05)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            {/* Current */}
            <Radar
              name="Current Scenario"
              dataKey="current"
              stroke="#38bdf8"
              fill="rgba(56,189,248,0.12)"
              strokeWidth={2}
            />
            <Tooltip content={<RadarTip />} />
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 justify-center text-[10px] text-slate-500 -mt-2">
          <span className="flex items-center gap-1"><span className="w-4 border-t border-sky-400 border-2" /> Current</span>
          <span className="flex items-center gap-1"><span className="w-4 border-t border-slate-500 border border-dashed" /> Baseline</span>
        </div>
      </div>

      {/* ── Mode breakdown ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Mode Share</div>
        <ModeBreakdown transitMix={transitMix} />
      </div>

      {/* ── Metric cards ───────────────────────────────────────────────────── */}
      <div className="flex-1 p-4 space-y-2.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Key Metrics</div>

        <MetricCard
          label="CO₂ Emissions"
          value={co2Tonnes}
          unit="t / day"
          delta={deltas?.co2}
          barValue={(1 - co2Tonnes / 250) * 100}
          barColor={co2Tonnes < 100 ? '#4ade80' : co2Tonnes < 180 ? '#fbbf24' : '#f87171'}
          lowerBetter={true}
          icon="🌡️"
          decimals={1}
          comparing={comparing}
          insight={`${(co2Tonnes * 1000).toFixed(0)} kg CO₂e/day · WHO recommends ≤50 t downtown`}
        />

        <MetricCard
          label="PM2.5 Concentration"
          value={pm25Ambient}
          unit="μg/m³"
          delta={deltas?.pm25}
          barValue={(1 - (pm25Ambient - 4) / 25) * 100}
          barColor={pm25Ambient < 10 ? '#4ade80' : pm25Ambient < 20 ? '#fbbf24' : '#f87171'}
          lowerBetter={true}
          icon="🌬️"
          decimals={1}
          comparing={comparing}
          insight="WHO annual guideline: 5 μg/m³ · 24h guideline: 15 μg/m³"
        />

        <MetricCard
          label="Congestion Index"
          value={congestionIndex}
          unit="/ 100"
          delta={deltas?.congestion}
          barValue={100 - congestionIndex}
          barColor={congestionIndex < 40 ? '#4ade80' : congestionIndex < 70 ? '#fbbf24' : '#f87171'}
          lowerBetter={true}
          icon="🚦"
          decimals={0}
          comparing={comparing}
          insight={
            congestionIndex < 30 ? 'Free flow — minimal delay' :
            congestionIndex < 60 ? 'Moderate — expect some queues' : 'Severe — grid-lock conditions'
          }
        />

        <MetricCard
          label="Avg Commute Time"
          value={avgCommuteMin}
          unit="min"
          delta={deltas?.commute}
          barValue={(1 - (avgCommuteMin - 5) / 40) * 100}
          barColor={avgCommuteMin < 18 ? '#4ade80' : avgCommuteMin < 28 ? '#fbbf24' : '#f87171'}
          lowerBetter={true}
          icon="⏱️"
          decimals={1}
          comparing={comparing}
          insight={`${avgSpeedKmh.toFixed(1)} km/h mean speed · for a 4.8 km trip`}
        />

        <MetricCard
          label="Noise Pollution"
          value={noiseDBA}
          unit="dB(A)"
          delta={deltas?.noise}
          barValue={(1 - (noiseDBA - 35) / 40) * 100}
          barColor={noiseDBA < 55 ? '#4ade80' : noiseDBA < 65 ? '#fbbf24' : '#f87171'}
          lowerBetter={true}
          icon="🔊"
          decimals={0}
          comparing={comparing}
          insight="WHO limit: 53 dB(A) daytime · chronic effects above 65 dB"
        />

        <MetricCard
          label="Population Health"
          value={healthIndex}
          unit="/ 100"
          delta={deltas?.health}
          barValue={healthIndex}
          barColor={healthIndex > 60 ? '#4ade80' : healthIndex > 35 ? '#fbbf24' : '#f87171'}
          lowerBetter={false}
          icon="❤️"
          decimals={0}
          comparing={comparing}
          insight="Physical activity METs per trip · cardiovascular & mental benefits"
        />

        <MetricCard
          label="Economic Productivity"
          value={productivityIndex}
          unit="/ 100"
          delta={deltas?.productivity}
          barValue={productivityIndex}
          barColor={productivityIndex > 70 ? '#4ade80' : productivityIndex > 50 ? '#fbbf24' : '#f87171'}
          lowerBetter={false}
          icon="💼"
          decimals={0}
          comparing={comparing}
          insight="Composite: commute time loss + congestion stress + active-mode benefit"
        />

        <MetricCard
          label="Transit Equity"
          value={equityIndex}
          unit="/ 100"
          delta={undefined}
          barValue={equityIndex}
          barColor={equityIndex > 60 ? '#4ade80' : equityIndex > 35 ? '#fbbf24' : '#f87171'}
          lowerBetter={false}
          icon="⚖️"
          decimals={0}
          comparing={comparing}
          insight="Access for transit-dependent populations (low-income, disabled, elderly)"
        />

        <MetricCard
          label="Societal Cost"
          value={costMday}
          unit="$M / day"
          delta={deltas?.cost}
          barValue={(1 - costMday / 8) * 100}
          barColor={costMday < 3 ? '#4ade80' : costMday < 5.5 ? '#fbbf24' : '#f87171'}
          lowerBetter={true}
          icon="💰"
          decimals={2}
          comparing={comparing}
          insight="Full-cost accounting: infra + operations + externalities (CAD $)"
        />

        <MetricCard
          label="NOx Emissions"
          value={noxTonnes * 1000}
          unit="kg / day"
          delta={undefined}
          barValue={(1 - noxTonnes / 0.2) * 100}
          barColor={noxTonnes < 0.05 ? '#4ade80' : noxTonnes < 0.12 ? '#fbbf24' : '#f87171'}
          lowerBetter={true}
          icon="☁️"
          decimals={1}
          comparing={comparing}
          insight="Nitrogen oxides — precursor to ozone & smog formation"
        />
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/5 text-[9px] text-slate-700 leading-relaxed">
        <div className="font-semibold text-slate-600 mb-1">Sources</div>
        Transport Canada NIR 2023 · TTC Sustainability Report · Toronto Cordon Count 2022 ·
        WHO Environmental Noise Guidelines · City of Toronto TMP 2021 · IPCC AR6 WG3 ·
        Chester & Horvath (2009) LCA of transport
      </div>
    </div>
  );
}

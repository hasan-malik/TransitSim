import React from 'react';
import { motion } from 'framer-motion';
import { Activity, MapPin } from 'lucide-react';

const GRADE_COLORS = {
  'A+': '#4ade80', A: '#86efac', 'B+': '#a3e635',
  B:    '#fbbf24',  C: '#fb923c',  D:   '#f87171',  F: '#ef4444',
};

export default function Header({ metrics, activeScenario, comparing, onToggleCompare }) {
  const gradeColor = GRADE_COLORS[metrics.grade] ?? '#94a3b8';

  return (
    <header className="relative z-20 h-14 flex-shrink-0 glass border-b border-white/5 flex items-center justify-between px-5">
      {/* Left — branding */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-sky-400/10 border border-sky-400/30 flex items-center justify-center">
            <span className="text-base">🚇</span>
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 ping-dot" />
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-tight leading-tight">TransitSim</div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 leading-tight">
            <MapPin size={9} />
            Toronto Downtown · Live Simulation
          </div>
        </div>
      </div>

      {/* Centre — key live stats */}
      <div className="hidden md:flex items-center gap-6">
        <Stat
          label="CO₂ Today"
          value={`${metrics.co2Tonnes.toFixed(0)} t`}
          sub={`${metrics.deltas?.co2 >= 0 ? '−' : '+'}${Math.abs(metrics.deltas?.co2 ?? 0).toFixed(0)}% vs baseline`}
          good={metrics.deltas?.co2 >= 0}
        />
        <Stat
          label="Avg Commute"
          value={`${metrics.avgCommuteMin.toFixed(1)} min`}
          sub={`${metrics.avgSpeedKmh.toFixed(0)} km/h avg`}
          good={(metrics.deltas?.commute ?? 0) >= 0}
        />
        <Stat
          label="Congestion"
          value={`${metrics.congestionIndex.toFixed(0)}%`}
          sub={metrics.congestionIndex < 40 ? 'Free flow' : metrics.congestionIndex < 70 ? 'Moderate' : 'Severe'}
          good={metrics.congestionIndex < 50}
        />
        <Stat
          label="Air Quality"
          value={`${metrics.pm25Ambient.toFixed(1)} μg/m³`}
          sub="PM2.5 (WHO < 5)"
          good={metrics.pm25Ambient < 10}
        />
      </div>

      {/* Right — grade + actions */}
      <div className="flex items-center gap-3">
        {/* Overall grade */}
        <div className="flex flex-col items-center">
          <motion.span
            key={metrics.grade}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            className="text-xl font-black leading-none font-mono"
            style={{ color: gradeColor, textShadow: `0 0 12px ${gradeColor}` }}
          >
            {metrics.grade}
          </motion.span>
          <span className="text-[9px] text-slate-500 leading-none">SCORE</span>
        </div>

        {/* Vertical divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Compare toggle */}
        <button
          onClick={onToggleCompare}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            comparing
              ? 'bg-sky-400/20 text-sky-300 border border-sky-400/30'
              : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          <Activity size={12} />
          {comparing ? 'Comparing' : 'Compare'}
        </button>
      </div>
    </header>
  );
}

function Stat({ label, value, sub, good }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider leading-tight">{label}</span>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm font-bold text-white font-mono leading-tight"
      >
        {value}
      </motion.span>
      <span className={`text-[10px] leading-tight ${good ? 'text-green-400' : 'text-rose-400'}`}>
        {sub}
      </span>
    </div>
  );
}

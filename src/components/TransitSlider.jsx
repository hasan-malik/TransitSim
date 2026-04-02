import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/** Config for each transit mode */
export const MODE_CONFIG = {
  car: {
    label:    'Personal Car',
    emoji:    '🚗',
    color:    '#f97316',
    glow:     'rgba(249,115,22,0.5)',
    desc:     'ICE & EV private vehicles',
    bgClass:  'bg-orange-500',
  },
  bus: {
    label:    'Bus & Streetcar',
    emoji:    '🚌',
    color:    '#fbbf24',
    glow:     'rgba(251,191,36,0.5)',
    desc:     'TTC surface transit',
    bgClass:  'bg-amber-400',
  },
  subway: {
    label:    'Subway & LRT',
    emoji:    '🚇',
    color:    '#38bdf8',
    glow:     'rgba(56,189,248,0.5)',
    desc:     'TTC rapid transit',
    bgClass:  'bg-sky-400',
  },
  cycling: {
    label:    'Cycling',
    emoji:    '🚲',
    color:    '#4ade80',
    glow:     'rgba(74,222,128,0.5)',
    desc:     'Bikes & e-bikes',
    bgClass:  'bg-green-400',
  },
  pedestrian: {
    label:    'Walking',
    emoji:    '🚶',
    color:    '#c084fc',
    glow:     'rgba(192,132,252,0.5)',
    desc:     'Foot travel',
    bgClass:  'bg-purple-400',
  },
  other: {
    label:    'Other / GO Transit',
    emoji:    '🚆',
    color:    '#94a3b8',
    glow:     'rgba(148,163,184,0.4)',
    desc:     'Regional rail, taxi, rideshare',
    bgClass:  'bg-slate-400',
  },
};

/**
 * A single animated slider for one transit mode.
 */
export default function TransitSlider({ mode, value, total, onChange }) {
  const cfg = MODE_CONFIG[mode];
  const pct = Math.round(value);
  const sharePct = total > 0 ? Math.round((value / total) * 100) : 0;

  // Dynamically update the slider track fill colour via CSS variable
  const sliderRef = useRef(null);
  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.style.setProperty('--mode-color', cfg.color);
      sliderRef.current.style.setProperty('--mode-color-glow', cfg.glow);
      sliderRef.current.style.setProperty('--fill-pct', `${pct}%`);

      // Update native slider track gradient (WebKit)
      sliderRef.current.querySelector('input').style.background =
        `linear-gradient(to right, ${cfg.color} ${pct}%, rgba(99,179,237,0.15) ${pct}%)`;
    }
  }, [pct, cfg.color, cfg.glow]);

  return (
    <motion.div
      ref={sliderRef}
      layout
      className="slider-mode group rounded-xl p-3 transition-colors duration-200"
      style={{
        '--mode-color': cfg.color,
        '--mode-color-glow': cfg.glow,
      }}
      whileHover={{ backgroundColor: 'rgba(99,179,237,0.05)' }}
    >
      <div className="flex items-center justify-between mb-2">
        {/* Icon + label */}
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
            style={{ background: `${cfg.color}22`, border: `1px solid ${cfg.color}44` }}
          >
            {cfg.emoji}
          </span>
          <div>
            <div className="text-xs font-semibold text-slate-200 leading-tight">{cfg.label}</div>
            <div className="text-[10px] text-slate-500 leading-tight">{cfg.desc}</div>
          </div>
        </div>

        {/* Value badges */}
        <div className="flex flex-col items-end gap-0.5">
          <motion.span
            key={pct}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold font-mono"
            style={{ color: cfg.color }}
          >
            {pct}
          </motion.span>
          <span className="text-[10px] text-slate-500">
            {sharePct}% share
          </span>
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={e => onChange(mode, Number(e.target.value))}
        className="w-full"
        style={{
          accentColor: cfg.color,
          background: `linear-gradient(to right, ${cfg.color} ${pct}%, rgba(99,179,237,0.15) ${pct}%)`,
        }}
        aria-label={`${cfg.label} modal share`}
      />

      {/* Bar visualization of share vs total */}
      <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: cfg.color }}
          animate={{ width: `${sharePct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

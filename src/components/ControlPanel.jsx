import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, RotateCcw } from 'lucide-react';
import TransitSlider, { MODE_CONFIG } from './TransitSlider.jsx';
import { SCENARIOS } from '../data/scenarios.js';

// Layer toggles config
const LAYER_DEFS = [
  { key: 'trips',    label: 'Live Trips',     icon: '🔴' },
  { key: 'transit',  label: 'Transit Routes', icon: '🔵' },
  { key: 'cycling',  label: 'Cycling Infra',  icon: '🟢' },
  { key: 'traffic',  label: 'Road Traffic',   icon: '🟠' },
  { key: 'heatmap',  label: 'Pollution Heat', icon: '🟣' },
];

export default function ControlPanel({
  transitMix,
  onUpdateMode,
  onApplyScenario,
  activeScenario,
  activeLayers,
  onToggleLayer,
}) {
  const total = Object.values(transitMix).reduce((a, b) => a + b, 0);

  const handleReset = useCallback(() => {
    onApplyScenario('statusQuo');
  }, [onApplyScenario]);

  // Normalised percentage of each mode
  const shares = {};
  Object.keys(transitMix).forEach(k => {
    shares[k] = total > 0 ? (transitMix[k] / total) * 100 : 0;
  });

  return (
    <div className="h-full flex flex-col gap-0 bg-surface-800/50 border-r border-white/5">

      {/* ── Section: Scenarios ───────────────────────────────────────────── */}
      <Section title="Scenarios" icon="⚡">
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(SCENARIOS).map(([key, scenario]) => (
            <ScenarioButton
              key={key}
              scenario={scenario}
              active={activeScenario === key}
              onClick={() => onApplyScenario(key)}
            />
          ))}
        </div>
      </Section>

      {/* ── Section: Modal Mix sliders ───────────────────────────────────── */}
      <Section
        title="Modal Mix"
        icon="🎚️"
        right={
          <div className="flex items-center gap-2">
            {/* Sum indicator */}
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
                Math.abs(total - 100) < 1
                  ? 'bg-green-400/15 text-green-400'
                  : 'bg-amber-400/15 text-amber-400'
              }`}
            >
              Σ = {Math.round(total)}
            </span>
            <button
              onClick={handleReset}
              className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
              title="Reset to baseline"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        }
      >
        {/* Stacked bar showing mix */}
        <MixBar transitMix={transitMix} total={total} />

        {/* Sliders */}
        <div className="flex flex-col gap-0.5 mt-2">
          {Object.keys(MODE_CONFIG).map(mode => (
            <TransitSlider
              key={mode}
              mode={mode}
              value={transitMix[mode] ?? 0}
              total={total}
              onChange={onUpdateMode}
            />
          ))}
        </div>

        <p className="text-[10px] text-slate-600 mt-2 px-1 leading-relaxed">
          Sliders set raw weights; share % = weight / Σ weights.
          Metrics normalise automatically.
        </p>
      </Section>

      {/* ── Section: Layer toggles ───────────────────────────────────────── */}
      <Section title="Map Layers" icon={<Layers size={12} />}>
        <div className="flex flex-col gap-1">
          {LAYER_DEFS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => onToggleLayer(key)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                activeLayers[key]
                  ? 'bg-sky-400/10 text-sky-300 border border-sky-400/20'
                  : 'bg-white/3 text-slate-500 border border-white/5 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">{icon}</span>
                {label}
              </span>
              <span
                className={`w-3 h-3 rounded-full transition-all ${
                  activeLayers[key] ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]' : 'bg-white/10'
                }`}
              />
            </button>
          ))}
        </div>
      </Section>

      {/* Footer spacer */}
      <div className="flex-1" />
      <div className="px-4 pb-3 text-[9px] text-slate-700 leading-relaxed">
        Data: City of Toronto Open Data · TTC GTFS · Transport Canada NIR 2023
      </div>
    </div>
  );
}

// ─── Stacked bar showing current modal mix ─────────────────────────────────────
function MixBar({ transitMix, total }) {
  if (total === 0) return null;

  return (
    <div className="h-3 rounded-full overflow-hidden flex w-full">
      {Object.entries(MODE_CONFIG).map(([mode, cfg]) => {
        const share = (transitMix[mode] ?? 0) / total;
        if (share < 0.005) return null;
        return (
          <motion.div
            key={mode}
            title={`${cfg.label}: ${Math.round(share * 100)}%`}
            animate={{ width: `${share * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ background: cfg.color, minWidth: 1 }}
          />
        );
      })}
    </div>
  );
}

// ─── Scenario button ───────────────────────────────────────────────────────────
function ScenarioButton({ scenario, active, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`relative text-left px-2.5 py-2 rounded-lg text-[11px] transition-all overflow-hidden ${
        active
          ? 'bg-sky-400/15 border border-sky-400/30 text-sky-200'
          : 'bg-white/4 border border-white/8 text-slate-400 hover:text-slate-200 hover:bg-white/8'
      }`}
    >
      {active && (
        <motion.div
          layoutId="scenario-bg"
          className="absolute inset-0 bg-sky-400/8 rounded-lg"
        />
      )}
      <div className="relative z-10">
        <span className="text-base leading-none">{scenario.icon}</span>
        <div className="font-semibold leading-tight mt-0.5">{scenario.label}</div>
      </div>
    </motion.button>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon, right, children }) {
  return (
    <div className="flex-shrink-0 border-b border-white/5">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <span className="text-xs">{icon}</span>
          {title}
        </div>
        {right}
      </div>
      <div className="px-3 pb-3">{children}</div>
    </div>
  );
}

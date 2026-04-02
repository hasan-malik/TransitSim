import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header.jsx';
import Map3D from './components/Map3D.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import MetricsPanel from './components/MetricsPanel.jsx';
import { useMetrics } from './hooks/useMetrics.js';
import { BASELINE_MIX } from './models/metrics-engine.js';
import { SCENARIOS } from './data/scenarios.js';

// ─── Layer visibility defaults ────────────────────────────────────────────────
const DEFAULT_LAYERS = {
  traffic:    true,
  pollution:  true,
  transit:    true,
  cycling:    true,
  trips:      true,
  heatmap:    true,
};

export default function App() {
  const [transitMix, setTransitMix] = useState(BASELINE_MIX);
  const [activeLayers, setActiveLayers] = useState(DEFAULT_LAYERS);
  const [activeScenario, setActiveScenario] = useState('statusQuo');
  const [comparing, setComparing] = useState(false);

  const metrics = useMetrics(transitMix);

  const applyScenario = useCallback((key) => {
    setActiveScenario(key);
    setTransitMix(SCENARIOS[key].mix);
  }, []);

  const toggleLayer = useCallback((key) => {
    setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updateMode = useCallback((mode, value) => {
    setActiveScenario(null); // deselect preset when manually editing
    setTransitMix(prev => ({ ...prev, [mode]: value }));
  }, []);

  return (
    <div className="flex flex-col w-full h-full bg-surface-900 overflow-hidden">
      <Header
        metrics={metrics}
        activeScenario={activeScenario}
        comparing={comparing}
        onToggleCompare={() => setComparing(c => !c)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left panel */}
        <motion.aside
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-[300px] flex-shrink-0 overflow-y-auto"
        >
          <ControlPanel
            transitMix={transitMix}
            onUpdateMode={updateMode}
            onApplyScenario={applyScenario}
            activeScenario={activeScenario}
            activeLayers={activeLayers}
            onToggleLayer={toggleLayer}
          />
        </motion.aside>

        {/* 3D Map (fills remaining space) */}
        <div className="flex-1 relative">
          <AnimatePresence>
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute inset-0"
            >
              <Map3D
                transitMix={transitMix}
                activeLayers={activeLayers}
                metrics={metrics}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right panel */}
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="relative z-10 w-[340px] flex-shrink-0 overflow-y-auto"
        >
          <MetricsPanel
            metrics={metrics}
            comparing={comparing}
            transitMix={transitMix}
          />
        </motion.aside>
      </div>
    </div>
  );
}

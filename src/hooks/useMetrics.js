import { useMemo } from 'react';
import { calculateMetrics, BASELINE_METRICS, deltaFromBaseline } from '../models/metrics-engine.js';

/**
 * Derives all simulation metrics from the current transit modal mix.
 * Pure memoisation — no side-effects.
 */
export function useMetrics(transitMix) {
  return useMemo(() => {
    const m = calculateMetrics(transitMix);
    const b = BASELINE_METRICS;

    // Attach delta-vs-baseline for every key metric
    // positive delta = improvement over baseline
    m.deltas = {
      co2:        deltaFromBaseline(m.co2Tonnes,        b.co2Tonnes,        true),
      pm25:       deltaFromBaseline(m.pm25Ambient,      b.pm25Ambient,      true),
      congestion: deltaFromBaseline(m.congestionIndex,  b.congestionIndex,  true),
      commute:    deltaFromBaseline(m.avgCommuteMin,    b.avgCommuteMin,    true),
      noise:      deltaFromBaseline(m.noiseDBA,         b.noiseDBA,         true),
      health:     deltaFromBaseline(m.healthIndex,      b.healthIndex,      false), // higher = better
      productivity: deltaFromBaseline(m.productivityIndex, b.productivityIndex, false),
      cost:       deltaFromBaseline(m.costMday,         b.costMday,         true),
    };

    m.baseline = b;
    return m;
  }, [transitMix]);
}

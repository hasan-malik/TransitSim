import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

/**
 * Animated number counter using requestAnimationFrame.
 */
function useAnimatedValue(target, decimals = 1) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = prev.current;
    const to = target;
    if (from === to) return;

    const duration = 600; // ms
    const start = performance.now();

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out
      const current = from + (to - from) * ease;
      setDisplay(parseFloat(current.toFixed(decimals)));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        prev.current = to;
      }
    };

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(step);

    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, decimals]);

  return display;
}

const DELTA_THRESHOLD = 0.5; // % — below this, show neutral

/**
 * Individual metric card with animated number, delta indicator, and progress bar.
 *
 * @param {string}   label       — display name
 * @param {number}   value       — current value
 * @param {string}   unit        — unit suffix
 * @param {number}   delta       — % change vs baseline (+ve = improvement)
 * @param {number}   barValue    — 0–100 for the bar (pre-calculated)
 * @param {string}   barColor    — CSS color for the bar
 * @param {boolean}  lowerBetter — determines colour coding
 * @param {string}   icon        — emoji
 * @param {string}   insight     — short explanatory sentence
 * @param {number}   decimals    — display decimal places
 */
export default function MetricCard({
  label, value, unit, delta, barValue, barColor,
  lowerBetter = true, icon, insight, decimals = 1, comparing,
}) {
  const displayed = useAnimatedValue(value, decimals);

  const isNeutral   = Math.abs(delta ?? 0) < DELTA_THRESHOLD;
  const isGood      = (delta ?? 0) > DELTA_THRESHOLD;
  const deltaColor  = isNeutral ? 'text-slate-500' : isGood ? 'text-green-400' : 'text-rose-400';
  const DeltaIcon   = isNeutral ? Minus : isGood ? TrendingUp : TrendingDown;

  return (
    <motion.div
      layout
      className="glass-light rounded-xl p-3 flex flex-col gap-2 border border-white/5 hover:border-white/10 transition-colors"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-[11px] font-medium text-slate-400">{label}</span>
        </div>

        {/* Delta badge (shown when comparing) */}
        {comparing && delta !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx('flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full', deltaColor,
              isGood ? 'bg-green-400/10' : isNeutral ? 'bg-white/5' : 'bg-rose-400/10')}
          >
            <DeltaIcon size={9} />
            {Math.abs(delta ?? 0).toFixed(1)}%
          </motion.div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <motion.span
          key={Math.round(displayed * 10)}
          className="text-xl font-bold font-mono text-white counter-num"
        >
          {displayed.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        </motion.span>
        <span className="text-[11px] text-slate-500 font-medium">{unit}</span>
      </div>

      {/* Bar */}
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full metric-bar"
          style={{ background: barColor }}
          animate={{ width: `${Math.min(100, Math.max(0, barValue))}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Insight text */}
      {insight && (
        <p className="text-[10px] text-slate-600 leading-relaxed">{insight}</p>
      )}
    </motion.div>
  );
}

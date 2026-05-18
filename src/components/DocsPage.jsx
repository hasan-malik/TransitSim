import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';

/* When the API origin changes, update this one line. */
const BASE_URL = 'https://transitsim-api-993396652568.us-central1.run.app';

/* ── Atoms ─────────────────────────────────────────────────────────────── */

function Pill({ children, tone = 'sky' }) {
  const palette = {
    sky:   'text-sky-300 bg-sky-400/10 border-sky-400/20',
    amber: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
  }[tone];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono border ${palette}`}>
      {children}
    </span>
  );
}

function Code({ language, children }) {
  return (
    <div className="my-3 rounded-lg bg-surface-800/70 border border-white/5 overflow-hidden">
      {language && (
        <div className="px-4 py-1.5 border-b border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-[0.2em] text-sky-400/70 font-mono">
          {language}
        </div>
      )}
      <pre className="font-mono text-[12.5px] leading-relaxed text-slate-100 p-4 overflow-x-auto whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-[11px] uppercase tracking-[0.2em] text-sky-400/80 font-mono">{title}</h2>
      {children}
    </section>
  );
}

function Table({ head, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/5">
      <table className="w-full text-[13px]">
        <thead className="bg-surface-700/50 text-[10px] uppercase tracking-wider text-slate-500">
          <tr>{head.map((h) => <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-white/5">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-3 py-2 align-top ${j === 0 ? 'font-mono text-sky-300 whitespace-nowrap' : 'text-slate-300'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function DocsPage({ onBack }) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-surface-900 text-slate-200">
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(56,189,248,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_5%,rgba(167,139,250,0.10),transparent_50%)]" />
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-30 glass border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to simulator
          </button>
          <a
            href={`${BASE_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-sky-300 transition-colors"
          >
            Swagger UI <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative max-w-3xl mx-auto px-6 py-12 space-y-10"
      >
        {/* Intro */}
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">TransitSim API</h1>
            <Pill>v1</Pill>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Request with six transport modes as percentages — and get back all
            13 sustainability metrics, a composite score, and a letter grade —
            live from TransitSim.
          </p>
        </header>

        {/* Endpoint */}
        <Block title="Endpoint">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/60 border border-white/5">
            <Pill>POST</Pill>
            <code className="font-mono text-[13px] text-slate-100 break-all">{BASE_URL}/v1/simulate</code>
          </div>
        </Block>

        {/* Request */}
        <Block title="Request">
          <Code language="json">
{`{
  "mix": {
    "car": 5, "bus": 20, "subway": 40,
    "cycling": 20, "pedestrian": 13, "other": 2
  }
}`}
          </Code>
          <ul className="text-[13px] text-slate-400 space-y-1.5 list-disc pl-5 marker:text-slate-600">
            <li>
              Six modes, each a number <span className="text-slate-300">0–100</span>:{' '}
              <code className="text-sky-300">car</code>, <code className="text-sky-300">bus</code>,{' '}
              <code className="text-sky-300">subway</code>, <code className="text-sky-300">cycling</code>,{' '}
              <code className="text-sky-300">pedestrian</code>, <code className="text-sky-300">other</code>{' '}
              (GO Rail / taxi / regional).
            </li>
            <li>All optional — missing modes default to 0. The vector is normalised, so partial input works.</li>
            <li><code className="text-sky-300">{`{"mix": {}}`}</code> returns the 2022 Toronto baseline.</li>
            <li>Unknown mode names are rejected with <Pill tone="amber">422</Pill>.</li>
          </ul>
        </Block>

        {/* Response */}
        <Block title="Response">
          <Code language="json">
{`{
  "mix": { "car": 5.0, "bus": 20.0, "subway": 40.0,
           "cycling": 20.0, "pedestrian": 13.0, "other": 2.0 },
  "co2_tonnes": 86.93,        "pm25_tonnes": 0.0395,
  "pm25_ambient": 6.21,       "nox_tonnes": 0.124,
  "congestion_index": 24.59,  "avg_commute_min": 19.97,
  "avg_speed_kmh": 24.31,     "noise_dba": 60.36,
  "health_index": 49.5,       "productivity_index": 95.04,
  "equity_index": 76.4,       "cost_mday": 0.59,
  "overall_score": 74.80,     "grade": "B+",
  "scores": { "climate": 79, "air_quality": 80, "congestion": 75,
              "health": 50, "productivity": 95, "noise": 37, "equity": 76 }
}`}
          </Code>
          <Table
            head={['Field', 'Unit', 'Meaning']}
            rows={[
              ['co2_tonnes', 't/day', 'Daily CO₂-equivalent emissions'],
              ['pm25_tonnes', 't/day', 'Daily PM2.5 emitted'],
              ['pm25_ambient', 'μg/m³', 'Ambient PM2.5 concentration'],
              ['nox_tonnes', 't/day', 'Daily nitrogen-oxide emissions'],
              ['congestion_index', '0–100', 'Road-network saturation'],
              ['avg_commute_min', 'min', 'Weighted one-way commute (4.8 km)'],
              ['avg_speed_kmh', 'km/h', 'Weighted average travel speed'],
              ['noise_dba', 'dB(A)', 'Area-averaged noise level'],
              ['health_index', '0–100', 'Active-transport health score'],
              ['productivity_index', '0–100', 'Commute-adjusted productivity proxy'],
              ['equity_index', '0–100', 'Share of public + active modes'],
              ['cost_mday', 'M$/day', 'Full societal cost (CAD)'],
              ['overall_score', '0–100', 'IPCC-AR6-weighted composite'],
              ['grade', 'string', 'A+ ≥90 · A ≥80 · B+ ≥70 · B ≥60 · C ≥50 · D ≥40 · F'],
            ]}
          />
          <p className="text-[13px] text-slate-500">
            <code className="text-sky-300">scores</code> holds the seven integer sub-scores behind the
            radar chart. All other numeric fields are full-precision floats.
          </p>
        </Block>

        {/* Examples */}
        <Block title="Examples">
          <Code language="bash">
{`curl -s ${BASE_URL}/v1/simulate \\
  -H 'Content-Type: application/json' \\
  -d '{"mix":{"car":34,"bus":18,"subway":31,"cycling":6,"pedestrian":9,"other":2}}'`}
          </Code>
          <Code language="javascript">
{`const res = await fetch('${BASE_URL}/v1/simulate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mix: { car: 34, bus: 18, subway: 31, cycling: 6, pedestrian: 9, other: 2 },
  }),
});
const metrics = await res.json();   // metrics.grade, metrics.overall_score`}
          </Code>
        </Block>

        {/* Status codes */}
        <Block title="Status codes">
          <Table
            head={['Code', 'Meaning']}
            rows={[
              ['200', 'Success — body carries all metrics'],
              ['422', 'Invalid input — bad share, unknown mode, or malformed JSON'],
              ['500', 'Engine error — body is {"detail":"internal_error"}'],
            ]}
          />
        </Block>

        {/* Interactive */}
        <Block title="Interactive">
          <ul className="text-[13px] space-y-1 font-mono">
            <li>
              <a className="text-sky-300 hover:text-sky-200" href={`${BASE_URL}/docs`} target="_blank" rel="noopener noreferrer">/docs</a>
              <span className="text-slate-500"> — Swagger UI, try requests in-browser</span>
            </li>
            <li>
              <a className="text-sky-300 hover:text-sky-200" href={`${BASE_URL}/redoc`} target="_blank" rel="noopener noreferrer">/redoc</a>
              <span className="text-slate-500"> — Redoc reading view</span>
            </li>
            <li>
              <a className="text-sky-300 hover:text-sky-200" href={`${BASE_URL}/openapi.json`} target="_blank" rel="noopener noreferrer">/openapi.json</a>
              <span className="text-slate-500"> — raw OpenAPI 3.1 spec</span>
            </li>
          </ul>
        </Block>
      </motion.main>

      <footer className="relative max-w-3xl mx-auto px-6 py-8 text-[11px] text-slate-600 font-mono border-t border-white/5">
        © 2026 Hasan Malik · TransitSim API v1.0 · MIT Licence
      </footer>
    </div>
  );
}

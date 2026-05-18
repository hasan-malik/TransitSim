import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Code2, Terminal, Cpu, Layers, Workflow,
  AlertCircle, GitBranch, Github, ExternalLink, ListChecks,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
 * Reusable atoms (matched to AboutPage.jsx so the two pages feel like one site)
 * ──────────────────────────────────────────────────────────────────────────── */

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

function Section({ id, eyebrow, title, icon: Icon, children }) {
  return (
    <motion.section
      id={id}
      {...fade}
      className="relative max-w-5xl mx-auto px-8 py-16 border-b border-white/5"
    >
      <div className="flex items-center gap-2 mb-3">
        {Icon && (
          <span className="w-7 h-7 rounded-md bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-300">
            <Icon size={14} />
          </span>
        )}
        <span className="text-[11px] uppercase tracking-[0.2em] text-sky-400/80 font-mono">
          {eyebrow}
        </span>
      </div>
      <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-8">
        {title}
      </h2>
      <div className="prose prose-invert prose-slate max-w-none text-slate-300 leading-relaxed">
        {children}
      </div>
    </motion.section>
  );
}

function Pill({ children, tone = 'sky' }) {
  const palette = {
    sky:    'text-sky-300    bg-sky-400/10    border-sky-400/20',
    green:  'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
    amber:  'text-amber-300  bg-amber-400/10  border-amber-400/20',
    slate:  'text-slate-300  bg-white/5       border-white/10',
  }[tone] ?? 'text-sky-300 bg-sky-400/10 border-sky-400/20';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono border ${palette}`}>
      {children}
    </span>
  );
}

function CodeBlock({ children, language, caption }) {
  return (
    <figure className="my-6 rounded-xl bg-surface-800/70 border border-white/5 overflow-hidden">
      {language && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
          <span className="text-[10px] uppercase tracking-[0.2em] text-sky-400/80 font-mono">
            {language}
          </span>
        </div>
      )}
      <pre className="font-mono text-[13px] leading-relaxed text-slate-100 p-5 overflow-x-auto whitespace-pre">
        {children}
      </pre>
      {caption && (
        <figcaption className="px-5 py-3 border-t border-white/5 text-xs text-slate-500 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function EndpointHeader({ method, path }) {
  const tone = method === 'GET' ? 'green' : method === 'POST' ? 'sky' : 'slate';
  return (
    <div className="not-prose flex items-center gap-3 my-4 p-3 rounded-lg bg-surface-800/60 border border-white/5">
      <Pill tone={tone}>{method}</Pill>
      <code className="font-mono text-sm text-slate-100">{path}</code>
    </div>
  );
}

function FieldRow({ name, type, desc }) {
  return (
    <tr className="border-t border-white/5">
      <td className="px-4 py-3 font-mono text-sky-300 text-[13px] whitespace-nowrap">{name}</td>
      <td className="px-4 py-3 font-mono text-slate-400 text-[12px] whitespace-nowrap">{type}</td>
      <td className="px-4 py-3 text-slate-300 text-[13px] leading-snug">{desc}</td>
    </tr>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Local-dev placeholder.  When the API is deployed (Cloud Run / App Runner),
 * swap this for the public origin in one place.
 * ──────────────────────────────────────────────────────────────────────────── */
const BASE_URL = 'https://transitsim-api-993396652568.us-central1.run.app';

/* ─────────────────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────────────────── */

export default function DocsPage({ onBack }) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-surface-900 text-slate-200">
      {/* ── Decorative background ─────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(56,189,248,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(167,139,250,0.14),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,179,237,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── Sticky top bar ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 glass border-b border-white/5">
        <div className="max-w-5xl mx-auto px-8 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to simulator
          </button>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
            <a href="#quickstart" className="hover:text-sky-300">Quickstart</a>
            <a href="#endpoint"   className="hover:text-sky-300">Endpoint</a>
            <a href="#response"   className="hover:text-sky-300">Response</a>
            <a href="#examples"   className="hover:text-sky-300">Examples</a>
            <a href="#errors"     className="hover:text-sky-300">Errors</a>
            <a href="#versioning" className="hover:text-sky-300">Versioning</a>
          </div>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative max-w-5xl mx-auto px-8 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-sky-300 bg-sky-400/10 border border-sky-400/30 uppercase tracking-wider">
              Developer Docs · TransitSim API
            </span>
            <Pill>v1</Pill>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[0.95] mb-5">
            One endpoint.
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              The whole simulator.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl leading-relaxed mb-8">
            TransitSim's public API exposes the same deterministic engine that
            powers the simulator you just used. Send a six-mode modal-share
            vector, get all 13 sustainability metrics, a composite score, and a
            letter grade back. No auth, no rate limits, no surprises.
          </p>

          <div className="flex flex-wrap gap-2">
            <Pill tone="green">Pure function</Pill>
            <Pill tone="green">Deterministic outputs</Pill>
            <Pill tone="sky">OpenAPI 3.1</Pill>
            <Pill tone="sky">JSON in / JSON out</Pill>
            <Pill tone="slate">Bayesian-calibrated BPR</Pill>
          </div>
        </motion.div>
      </section>

      {/* ── QUICKSTART ────────────────────────────────────────────────────── */}
      <Section id="quickstart" eyebrow="01 — Quickstart" title="Send your first request" icon={Terminal}>
        <p>
          Run the API locally then hit it with <code className="text-sky-300">curl</code>.
          A hosted public origin will be added here once the service is deployed
          to Cloud Run; the request/response shapes won't change.
        </p>

        <CodeBlock language="bash" caption="From the repo root. Adds the api/ extras group and serves on :8000.">
{`pip install -e '.[api,dev]'
uvicorn transitsim_api.main:app --reload --app-dir api`}
        </CodeBlock>

        <CodeBlock language="bash" caption="The TransformTO 2050 modal split — returns grade B+ (~74.8 / 100).">
{`curl -s ${BASE_URL}/v1/simulate \\
  -H 'Content-Type: application/json' \\
  -d '{"mix":{"car":5,"bus":20,"subway":40,"cycling":20,"pedestrian":13,"other":2}}' \\
  | jq '.grade, .overall_score'`}
        </CodeBlock>

        <p>
          Prefer interactive exploration? FastAPI auto-generates a Swagger UI
          and a Redoc page from the same OpenAPI schema:
        </p>

        <ul className="not-prose mt-4 space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <ExternalLink size={12} className="text-sky-400" />
            <code className="text-sky-300">{BASE_URL}/docs</code>
            <span className="text-slate-500">— Swagger UI (try requests in-page)</span>
          </li>
          <li className="flex items-center gap-2">
            <ExternalLink size={12} className="text-sky-400" />
            <code className="text-sky-300">{BASE_URL}/redoc</code>
            <span className="text-slate-500">— Redoc (cleaner reading view)</span>
          </li>
          <li className="flex items-center gap-2">
            <ExternalLink size={12} className="text-sky-400" />
            <code className="text-sky-300">{BASE_URL}/openapi.json</code>
            <span className="text-slate-500">— raw OpenAPI 3.1 spec for SDK codegen</span>
          </li>
        </ul>
      </Section>

      {/* ── ENDPOINT ──────────────────────────────────────────────────────── */}
      <Section id="endpoint" eyebrow="02 — The Endpoint" title="POST /v1/simulate" icon={Cpu}>
        <p>
          A single endpoint covers the entire simulator because the engine is
          itself a pure function of the modal-share vector. Given the same
          input, it always returns the same output — safe to cache, safe to
          retry, safe to load-test.
        </p>

        <EndpointHeader method="POST" path="/v1/simulate" />

        <h3 className="text-white text-xl font-semibold mt-8 mb-3">Request body</h3>

        <CodeBlock language="json">
{`{
  "mix": {
    "car":        5,
    "bus":        20,
    "subway":     40,
    "cycling":    20,
    "pedestrian": 13,
    "other":      2
  }
}`}
        </CodeBlock>

        <div className="not-prose my-6 overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead className="bg-surface-700/60 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Field</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <FieldRow name="mix.car"        type="number 0–100"   desc="Percentage of person-trips made by car (gas + EV blend)" />
              <FieldRow name="mix.bus"        type="number 0–100"   desc="Bus / streetcar (TTC surface fleet)" />
              <FieldRow name="mix.subway"     type="number 0–100"   desc="Subway / LRT (TTC electric, off-road)" />
              <FieldRow name="mix.cycling"    type="number 0–100"   desc="Cycling" />
              <FieldRow name="mix.pedestrian" type="number 0–100"   desc="Walking" />
              <FieldRow name="mix.other"      type="number 0–100"   desc="GO Rail / taxi / regional express (weighted average)" />
            </tbody>
          </table>
        </div>

        <p>
          <strong>All fields are optional</strong> — missing ones default to 0.
          The engine normalises the vector so partial inputs are valid (sending
          only <code className="text-sky-300">car</code> and{' '}
          <code className="text-sky-300">subway</code> still works). An all-zero
          mix returns the 2022 Toronto Cordon-Count baseline rather than
          erroring, so <code className="text-sky-300">{`{"mix": {}}`}</code> is
          a valid "what does today look like?" query.
        </p>
        <p>
          Unknown modes are rejected with <Pill tone="amber">422</Pill> to catch
          typos client-side instead of silently 0-ing them out.
        </p>
      </Section>

      {/* ── RESPONSE ──────────────────────────────────────────────────────── */}
      <Section id="response" eyebrow="03 — Response" title="All 13 metrics, plus the composite" icon={Layers}>
        <p>
          Every successful request returns the same shape. Numeric fields are
          full-precision floats; the radar sub-scores are integer-rounded for
          the chart on the simulator UI.
        </p>

        <CodeBlock language="json" caption="Truncated for readability. mix is echoed back normalised.">
{`{
  "mix": { "car": 5.0, "bus": 20.0, "subway": 40.0, "cycling": 20.0,
           "pedestrian": 13.0, "other": 2.0 },

  "co2_tonnes":         86.93,
  "pm25_tonnes":        0.0395,
  "pm25_ambient":       6.21,
  "nox_tonnes":         0.124,

  "congestion_index":   24.59,
  "avg_commute_min":    19.97,
  "avg_speed_kmh":      24.31,

  "noise_dba":          60.36,
  "health_index":       49.5,
  "productivity_index": 95.04,
  "equity_index":       76.4,
  "cost_mday":          0.59,

  "overall_score":      74.80,
  "grade":              "B+",

  "scores": {
    "climate":      79,
    "air_quality":  80,
    "congestion":   75,
    "health":       50,
    "productivity": 95,
    "noise":        37,
    "equity":       76
  }
}`}
        </CodeBlock>

        <h3 className="text-white text-xl font-semibold mt-8 mb-3">Field reference</h3>
        <div className="not-prose my-4 overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead className="bg-surface-700/60 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Field</th>
                <th className="text-left px-4 py-3 font-medium">Unit</th>
                <th className="text-left px-4 py-3 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody>
              <FieldRow name="co2_tonnes"         type="t / day"   desc="Daily CO₂-equivalent emissions from in-mix transport" />
              <FieldRow name="pm25_tonnes"        type="t / day"   desc="Daily PM2.5 emitted into downtown air" />
              <FieldRow name="pm25_ambient"       type="μg / m³"   desc="Estimated ambient PM2.5 concentration (WHO 24h guideline: 15)" />
              <FieldRow name="nox_tonnes"         type="t / day"   desc="Daily nitrogen-oxide emissions" />
              <FieldRow name="congestion_index"   type="0–100"     desc="Road-network saturation; BPR delay kicks in above ~60" />
              <FieldRow name="avg_commute_min"    type="minutes"   desc="Mode-share-weighted one-way commute over 4.8 km" />
              <FieldRow name="avg_speed_kmh"      type="km/h"      desc="Mode-share-weighted average speed (car/bus degraded by BPR)" />
              <FieldRow name="noise_dba"          type="dB(A)"     desc="Area-averaged noise level (logarithmic energy sum)" />
              <FieldRow name="health_index"       type="0–100"     desc="CDC MET-based active-transport score (100 = 100% cycling)" />
              <FieldRow name="productivity_index" type="0–100"     desc="Commute / congestion adjusted productivity proxy" />
              <FieldRow name="equity_index"       type="0–100"     desc="Transit-equity score: share of public + active modes" />
              <FieldRow name="cost_mday"          type="CAD M$/day" desc="Full-cost societal expenditure across modes" />
              <FieldRow name="overall_score"      type="0–100"     desc="IPCC-AR6-weighted composite of the seven sub-scores" />
              <FieldRow name="grade"              type="string"    desc="Letter grade — A+ ≥ 90, A ≥ 80, B+ ≥ 70, B ≥ 60, C ≥ 50, D ≥ 40, F otherwise" />
            </tbody>
          </table>
        </div>
        <p>
          For the full derivation of each metric — emission factors, the BPR
          volume-delay model, the noise summation, the calibration anchors —
          see the <a className="text-sky-400 hover:text-sky-300" href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>About page</a>.
        </p>
      </Section>

      {/* ── EXAMPLES ──────────────────────────────────────────────────────── */}
      <Section id="examples" eyebrow="04 — Examples" title="Same call, three languages" icon={Code2}>
        <p>The endpoint is plain JSON — any HTTP client works.</p>

        <h3 className="text-white text-xl font-semibold mt-8 mb-3">curl</h3>
        <CodeBlock language="bash">
{`curl -s ${BASE_URL}/v1/simulate \\
  -H 'Content-Type: application/json' \\
  -d '{"mix":{"car":34,"bus":18,"subway":31,"cycling":6,"pedestrian":9,"other":2}}' \\
  | jq '{grade, overall_score, co2_tonnes}'`}
        </CodeBlock>

        <h3 className="text-white text-xl font-semibold mt-8 mb-3">JavaScript (fetch)</h3>
        <CodeBlock language="javascript">
{`const res = await fetch('${BASE_URL}/v1/simulate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mix: { car: 34, bus: 18, subway: 31, cycling: 6, pedestrian: 9, other: 2 },
  }),
});
const metrics = await res.json();
console.log(metrics.grade, metrics.overall_score);   // "C" 52.19`}
        </CodeBlock>

        <h3 className="text-white text-xl font-semibold mt-8 mb-3">Python (requests)</h3>
        <CodeBlock language="python">
{`import requests

r = requests.post(
    "${BASE_URL}/v1/simulate",
    json={"mix": {"car": 34, "bus": 18, "subway": 31,
                  "cycling": 6, "pedestrian": 9, "other": 2}},
    timeout=5,
)
r.raise_for_status()
metrics = r.json()
print(metrics["grade"], metrics["overall_score"])   # C 52.19`}
        </CodeBlock>
      </Section>

      {/* ── ERRORS ────────────────────────────────────────────────────────── */}
      <Section id="errors" eyebrow="05 — Errors" title="Validation + status codes" icon={AlertCircle}>
        <p>The API uses standard HTTP status codes.</p>

        <div className="not-prose my-6 overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead className="bg-surface-700/60 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody>
              <FieldRow name="200 OK"             type="success"  desc="Simulation ran; response body carries all 13 metrics + composite" />
              <FieldRow name="422 Unprocessable"  type="client"   desc="Validation failed — invalid share (negative, >100, non-numeric), unknown mode, or malformed JSON" />
              <FieldRow name="500 Internal"       type="server"   desc={'Unhandled engine exception. The response body is `{"detail":"internal_error"}`; full traceback is logged server-side'} />
            </tbody>
          </table>
        </div>

        <h3 className="text-white text-xl font-semibold mt-6 mb-3">Example 422</h3>
        <CodeBlock language="json" caption="Sending mix.car: -10 — Pydantic produces a precise, locatable error.">
{`{
  "detail": [
    {
      "type": "greater_than_equal",
      "loc": ["body", "mix", "car"],
      "msg":  "Input should be greater than or equal to 0",
      "input": -10,
      "ctx":   { "ge": 0.0 }
    }
  ]
}`}
        </CodeBlock>
      </Section>

      {/* ── VERSIONING ────────────────────────────────────────────────────── */}
      <Section id="versioning" eyebrow="06 — Versioning" title="What v1 promises" icon={GitBranch}>
        <ul>
          <li>
            <strong>Path-prefix versioning.</strong> Every product endpoint
            lives under <code className="text-sky-300">/v1/</code>. Operational
            endpoints (<code className="text-sky-300">/health</code>,{' '}
            <code className="text-sky-300">/</code>) stay unversioned.
          </li>
          <li>
            <strong>Additive within a major version.</strong> New fields may
            appear in v1 responses; existing fields will not be removed,
            renamed, or have their semantics changed. Clients should ignore
            unknown fields.
          </li>
          <li>
            <strong>Calibration changes are not breaking changes.</strong> If
            the Bayesian calibration is re-run with new observations, numeric
            outputs may shift slightly — that's an engine refinement, not an
            API change. Downstream cache invalidation is your job.
          </li>
          <li>
            <strong>Roadmap (planned, not yet shipping).</strong>
            <div className="not-prose mt-3 grid gap-2">
              <RoadmapItem method="GET"  path="/v1/scenarios"      desc="List named presets (status_quo, transformto_2050, brt, …)" />
              <RoadmapItem method="GET"  path="/v1/scenarios/{id}" desc="Fetch one preset and return its full metrics" />
              <RoadmapItem method="GET"  path="/v1/model"          desc="Per-mode coefficient table, BPR posteriors, full citation list" />
              <RoadmapItem method="POST" path="/v1/optimize"       desc="Inverse optimisation — find the mix that minimises CO₂ under commute/equity constraints" />
            </div>
          </li>
        </ul>
      </Section>

      {/* ── COLOPHON ──────────────────────────────────────────────────────── */}
      <Section id="colophon" eyebrow="Built with" title="Stack" icon={Workflow}>
        <ul>
          <li><strong>Server</strong> — FastAPI 0.110+ on uvicorn, async-ready (the simulate endpoint itself is sync because the engine is CPU-bound and finishes in &lt;2 ms)</li>
          <li><strong>Schema</strong> — Pydantic v2; OpenAPI 3.1 auto-generated, served at <code className="text-sky-300">/openapi.json</code></li>
          <li><strong>Engine</strong> — Pure-Python port of the JS engine, kept in lock-step by <code className="text-sky-300">tests/test_parity.py</code> (cross-language fixture-based parity)</li>
          <li><strong>Image</strong> — Multi-stage <code className="text-sky-300">python:3.12-slim-bookworm</code>, non-root user, scales-to-zero on Cloud Run / App Runner</li>
          <li><strong>CI</strong> — GitHub Actions: ruff lint → pytest (API unit + cross-language parity) → Docker build + health-gated smoke test</li>
        </ul>

        <div className="not-prose mt-10 flex flex-wrap gap-3">
          <a
            href="https://github.com/hasanmalik/TransitSim"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-slate-200 transition-colors"
          >
            <Github size={14} /> Source on GitHub
          </a>
          <a
            href={`${BASE_URL}/docs`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-400/15 hover:bg-sky-400/25 border border-sky-400/30 text-sm text-sky-200 transition-colors"
          >
            <ListChecks size={14} /> Open Swagger UI
          </a>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-slate-200 transition-colors"
          >
            <ArrowLeft size={14} /> Return to simulator
          </button>
        </div>
      </Section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="max-w-5xl mx-auto px-8 py-10 text-center text-[11px] text-slate-600 font-mono">
        © 2026 Hasan Malik · TransitSim API v1.0 · MIT Licence
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Small components
 * ──────────────────────────────────────────────────────────────────────────── */

function RoadmapItem({ method, path, desc }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/40 border border-white/5">
      <Pill tone={method === 'GET' ? 'green' : 'sky'}>{method}</Pill>
      <code className="font-mono text-sm text-slate-100 whitespace-nowrap flex-shrink-0">{path}</code>
      <span className="text-[13px] text-slate-400">— {desc}</span>
    </div>
  );
}

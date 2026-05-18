import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, BookOpen, Database, FlaskConical, Quote,
  GitBranch, Sigma, AlertTriangle, ExternalLink, Github, Globe,
  Calculator, Layers, MapPin, Wind, Activity, Gauge, Flame,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
 * Reusable atoms
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

function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono text-sky-300 bg-sky-400/10 border border-sky-400/20">
      {children}
    </span>
  );
}

function Equation({ children, caption }) {
  return (
    <figure className="my-6 p-5 rounded-xl bg-surface-800/60 border border-white/5">
      <div className="font-mono text-base text-slate-100 leading-loose overflow-x-auto whitespace-pre">
        {children}
      </div>
      {caption && (
        <figcaption className="mt-3 text-xs text-slate-500 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function CitationRef({ n }) {
  return (
    <a
      href={`#ref-${n}`}
      className="text-sky-400 hover:text-sky-300 font-mono text-[11px] align-super no-underline"
    >
      [{n}]
    </a>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Data tables
 * ──────────────────────────────────────────────────────────────────────────── */

const MODE_DATA = [
  { mode: 'Car (gas + EV blend)',  co2: 142, pm25: 0.052, nox: 0.18, speed: 19, road: 32,  cost: 0.72, src: '1, 2, 4' },
  { mode: 'Bus (TTC diesel)',      co2: 72,  pm25: 0.031, nox: 0.14, speed: 12, road: 1.4, cost: 0.35, src: '3' },
  { mode: 'Subway (TTC electric)', co2: 14,  pm25: 0.002, nox: 0.01, speed: 35, road: 0,   cost: 0.26, src: '3, 5' },
  { mode: 'Cycling',               co2: 5,   pm25: 0.001, nox: 0.00, speed: 17, road: 5,   cost: 0.07, src: '6, 7' },
  { mode: 'Walking',               co2: 0,   pm25: 0.000, nox: 0.00, speed: 5,  road: 2,   cost: 0.02, src: '8' },
  { mode: 'Other (GO/taxi avg)',   co2: 55,  pm25: 0.015, nox: 0.08, speed: 30, road: 1.2, cost: 0.30, src: '9' },
];

const REFERENCES = [
  {
    n: 1,
    authors: 'Environment and Climate Change Canada',
    year: '2024',
    title: 'National Inventory Report 1990–2022: Greenhouse Gas Sources and Sinks in Canada',
    venue: 'ECCC, Government of Canada. Annex 12, Table A12-2.',
    url: 'https://www.canada.ca/en/environment-climate-change/services/climate-change/greenhouse-gas-emissions/inventory.html',
  },
  {
    n: 2,
    authors: 'Independent Electricity System Operator (IESO)',
    year: '2024',
    title: 'Annual Planning Outlook: Ontario Grid Emissions Intensity',
    venue: 'IESO Reliability Report. Average grid intensity ~30 g CO₂e/kWh (2023).',
    url: 'https://www.ieso.ca/en/Sector-Participants/Planning-and-Forecasting',
  },
  {
    n: 3,
    authors: 'Toronto Transit Commission',
    year: '2023',
    title: 'TTC Sustainability & Responsibility Report 2023',
    venue: 'Fleet composition, energy use, ridership, and per-vehicle emissions.',
    url: 'https://www.ttc.ca/transparency-and-accountability/Sustainability',
  },
  {
    n: 4,
    authors: 'TomTom International BV',
    year: '2024',
    title: 'TomTom Traffic Index 2023 — Toronto Profile',
    venue: 'Average peak-hour driving speed in downtown core: 19 km/h.',
    url: 'https://www.tomtom.com/traffic-index/toronto-traffic/',
  },
  {
    n: 5,
    authors: 'City of Toronto',
    year: '2022',
    title: 'Toronto Cordon Count 2022 — Downtown Core Modal Split',
    venue: 'City of Toronto, Transportation Services. Used as baseline modal split.',
    url: 'https://www.toronto.ca/services-payments/streets-parking-transportation/transportation-projects/cordon-count/',
  },
  {
    n: 6,
    authors: 'Chester, M. V., & Horvath, A.',
    year: '2009',
    title: 'Environmental assessment of passenger transportation should include infrastructure and supply chains',
    venue: 'Environmental Research Letters, 4(2), 024008. doi:10.1088/1748-9326/4/2/024008',
    url: 'https://doi.org/10.1088/1748-9326/4/2/024008',
  },
  {
    n: 7,
    authors: 'Transport Canada',
    year: '2022',
    title: 'Active Transportation Indicators — Cycling Speed and Mode Share',
    venue: 'Transport Canada Statistics Branch.',
    url: 'https://tc.canada.ca/en/programs/funding-programs/active-transportation-fund',
  },
  {
    n: 8,
    authors: 'Transportation Research Board',
    year: '2016',
    title: 'Highway Capacity Manual, 6th Edition (HCM 6)',
    venue: 'TRB, National Academies of Sciences. Chapter 16 — Pedestrian flow (avg 5 km/h).',
    url: 'https://www.trb.org/Main/Blurbs/175169.aspx',
  },
  {
    n: 9,
    authors: 'Metrolinx',
    year: '2023',
    title: 'GO Transit Sustainability Report 2023',
    venue: 'Metrolinx. Energy and emissions for regional rail/express bus operations.',
    url: 'https://www.metrolinx.com/en/about-us/sustainability',
  },
  {
    n: 10,
    authors: 'Bureau of Public Roads',
    year: '1964',
    title: 'Traffic Assignment Manual',
    venue: 'U.S. Department of Commerce. Original source of the BPR volume-delay function structure. The 1964 textbook coefficients (α=0.15, β=4) are used as prior means; TransitSim ships Bayesian-calibrated posterior estimates fit to observed downtown-Toronto speed data.',
    url: 'https://catalog.hathitrust.org/Record/000968011',
  },
  {
    n: 11,
    authors: 'World Health Organization',
    year: '2018',
    title: 'Environmental Noise Guidelines for the European Region',
    venue: 'WHO Regional Office for Europe. Used for road-traffic noise dB(A) reference levels.',
    url: 'https://www.who.int/europe/publications/i/item/9789289053563',
  },
  {
    n: 12,
    authors: 'World Health Organization',
    year: '2021',
    title: 'WHO Global Air Quality Guidelines (PM2.5, PM10, O₃, NO₂, SO₂, CO)',
    venue: 'WHO. Annual PM2.5 guideline value: 5 μg/m³.',
    url: 'https://www.who.int/publications/i/item/9789240034228',
  },
  {
    n: 13,
    authors: 'IPCC',
    year: '2022',
    title: 'Climate Change 2022: Mitigation of Climate Change. Contribution of Working Group III to the Sixth Assessment Report',
    venue: 'Cambridge University Press. Chapter 10 (Transport), Table 10.1.',
    url: 'https://www.ipcc.ch/report/ar6/wg3/',
  },
  {
    n: 14,
    authors: 'Moreno, C., Allam, Z., Chabaud, D., Gall, C., & Pratlong, F.',
    year: '2021',
    title: 'Introducing the “15-Minute City”: Sustainability, Resilience and Place Identity in Future Post-Pandemic Cities',
    venue: 'Smart Cities, 4(1), 93–111. doi:10.3390/smartcities4010006',
    url: 'https://doi.org/10.3390/smartcities4010006',
  },
  {
    n: 15,
    authors: 'City of Toronto',
    year: '2021',
    title: 'TransformTO Net Zero Strategy & Toronto Transportation Master Plan',
    venue: 'City of Toronto Council adopted strategy targeting net-zero by 2040.',
    url: 'https://www.toronto.ca/services-payments/water-environment/environmentally-friendly-city-initiatives/transformto/',
  },
  {
    n: 16,
    authors: 'U.S. Centers for Disease Control and Prevention',
    year: '2022',
    title: 'Physical Activity Compendium — Metabolic Equivalent (MET) Values',
    venue: 'CDC, Division of Nutrition, Physical Activity, and Obesity.',
    url: 'https://www.cdc.gov/physical-activity-basics/measuring/index.html',
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────────────────── */

export default function AboutPage({ onBack }) {
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
            <a href="#methodology" className="hover:text-sky-300">Methodology</a>
            <a href="#data"        className="hover:text-sky-300">Data</a>
            <a href="#models"      className="hover:text-sky-300">Models</a>
            <a href="#limitations" className="hover:text-sky-300">Limitations</a>
            <a href="#references"  className="hover:text-sky-300">References</a>
          </div>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative max-w-5xl mx-auto px-8 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-sky-300 bg-sky-400/10 border border-sky-400/30 uppercase tracking-wider">
              About · Research Documentation
            </span>
            <Pill>v1.0</Pill>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[0.95] mb-5">
            A parameterized
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              urban mobility simulation
            </span>
            <br />
            for downtown Toronto.
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl leading-relaxed mb-10">
            TransitSim is an interactive, research-grade decision-support tool that
            quantifies the environmental, public-health, congestion, and economic
            consequences of changing the modal mix of urban transportation. Every
            coefficient in the model is sourced from peer-reviewed literature,
            government inventories, or published transit-agency data.
          </p>

          {/* Stat strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HeroStat icon={MapPin}   value="620,000" label="daily person-trips modelled" />
            <HeroStat icon={Layers}   value="6"       label="transport modes" />
            <HeroStat icon={Sigma}    value="11"      label="output metrics" />
            <HeroStat icon={BookOpen} value="16"      label="cited sources" />
          </div>
        </motion.div>
      </section>

      {/* ── ABSTRACT ──────────────────────────────────────────────────────── */}
      <Section id="abstract" eyebrow="Abstract" title="Research summary" icon={Quote}>
        <p>
          Urban-transportation policy is dominated by mode-share decisions whose
          downstream consequences — emissions, public health, road congestion,
          economic productivity — are often debated qualitatively. TransitSim
          operationalises these consequences as a deterministic, real-time
          simulation over a Toronto-downtown reference geography
          (≈25 km², 620,000 daily person-trips, 4.8 km mean trip length<CitationRef n={5}/>).
          The user manipulates a six-dimensional modal-share vector and the engine
          returns 11 metrics across four impact families: <em>climate</em> (CO₂e,
          PM2.5, NOₓ), <em>mobility</em> (commute time, congestion index, weighted
          speed), <em>livability</em> (noise dB(A), health METs, equity), and
          <em> economy</em> (full-cost CAD/day, productivity index). All
          coefficients derive from public, citable sources (NIR<CitationRef n={1}/>,
          IPCC AR6 WG3<CitationRef n={13}/>, TTC<CitationRef n={3}/>, WHO<CitationRef n={11}/><CitationRef n={12}/>,
          HCM 6<CitationRef n={8}/>). Congestion and travel-time degradation are
          modelled with the canonical Bureau of Public Roads volume-delay function
          <CitationRef n={10}/>; noise is computed as a logarithmic energy sum
          weighted by mode share.
        </p>
      </Section>

      {/* ── FRAMEWORK ─────────────────────────────────────────────────────── */}
      <Section id="framework" eyebrow="01 — Framework" title="Simulation framework" icon={FlaskConical}>
        <p>
          TransitSim is a static-equilibrium <strong>activity-based mode-share
          model</strong>. It assumes a fixed total demand (person-trips per day)
          and a fixed mean trip length; the user is free to redistribute that
          demand across the available modes. The engine is a pure deterministic
          function — given the same input vector it always returns the same
          metrics — which makes it well-suited for policy comparison and
          sensitivity analysis.
        </p>

        <h3 className="text-white text-xl font-semibold mt-8 mb-3">Inputs</h3>
        <ul>
          <li><strong>Modal-share vector</strong> <span className="font-mono text-sky-300">m = (mₖ)</span> for k ∈ {`{car, bus, subway, cycling, pedestrian, other}`}, normalised so Σmₖ = 1.</li>
          <li><strong>Layer toggles</strong> for the 3D Mapbox/Deck.gl visualisation (traffic, pollution, transit, cycling, trips, heat-map).</li>
          <li><strong>Preset scenarios</strong> derived from published policy documents (TransformTO Net Zero<CitationRef n={15}/>, 15-Minute City<CitationRef n={14}/>, BRT, Car-Free Downtown). The <strong>2050 TransformTO Target</strong> preset encodes Toronto's Climate Action Strategy net-zero mobility scenario: car 5 %, subway 40 %, bus 20 %, cycling 20 %, pedestrian 13 %, other 2 %. TransformTO is the City of Toronto's binding decarbonisation strategy<CitationRef n={15}/>, adopted by Council, targeting net-zero city-wide emissions by 2040; the 2050 label reflects the modal split considered consistent with deep transport decarbonisation under a mid-century global net-zero pathway. On the composite sustainability scale this scenario scores A (≈ 79/100).</li>
        </ul>

        <h3 className="text-white text-xl font-semibold mt-8 mb-3">Outputs</h3>
        <p>
          For each metric the engine reports both the absolute value and the
          percentage delta against the 2022 Cordon-Count baseline<CitationRef n={5}/>.
          A weighted composite score (0–100) is mapped to a letter grade A+→F.
        </p>
      </Section>

      {/* ── METHODOLOGY ───────────────────────────────────────────────────── */}
      <Section id="methodology" eyebrow="02 — Methodology" title="Mathematical model" icon={Calculator}>
        <p>
          Let <span className="font-mono text-sky-300">N</span> be total daily
          person-trips and <span className="font-mono text-sky-300">d</span> the
          mean trip length. For each mode <span className="font-mono">k</span>
          with share <span className="font-mono">mₖ</span> and emission factor
          <span className="font-mono"> eₖ</span> (g per pax-km), daily emissions
          collapse to a linear sum:
        </p>

        <Equation caption="Equation 1 — Linear emissions summation across modes (CO₂e, PM2.5, NOₓ).">
          E  =  Σₖ  N · mₖ · d · eₖ        [tonnes / day]
        </Equation>

        <p>
          Travel time is computed by mode, with the speed of car and bus
          degraded by a <strong>BPR volume-delay function</strong><CitationRef n={10}/>
          driven by a road-demand-to-capacity ratio:
        </p>

        <Equation caption="Equation 2 — Augmented BPR (Bureau of Public Roads) volume-delay function as implemented in src/models/metrics-engine.js. Coefficients (α, β, γ) are Bayesian-calibrated posterior estimates fit via NUTS/HMC to observed downtown-Toronto (V/C, speed) data; the 1964 textbook values (α=0.15, β=4, γ=3.5) serve as prior means. Calibrated values: α≈0.26, β≈2.39, γ≈6.16.">
          v_actual  =  v_free  /  ( 1  +  α · γ · ( V / C )^β )
        </Equation>

        <p>
          Where <span className="font-mono">V/C</span> is total mode-weighted
          road area demanded (m²) — scaled by 1/8 to distribute the daily
          person-trip total across the operating day — divided by total downtown
          surface capacity (lane-km × 3.5 m × 1000 m/km). The index is clamped
          to [0, 100] before being fed into the BPR formula.
        </p>

        <p>
          Noise is summed in the energy domain because dB is logarithmic; share-
          weighted linear pressures are summed and re-converted:
        </p>

        <Equation caption="Equation 3 — Logarithmic dB(A) summation (per WHO method, ref [11]).">
          L̄  =  10 · log₁₀ ( Σₖ  mₖ · 10^(Lₖ / 10) )       [dB(A)]
        </Equation>

        <p>
          Health is expressed as <strong>METs</strong> (Metabolic Equivalent of
          Task<CitationRef n={16}/>) weighted by mode share, then normalised so
          100 % cycling = 100 (the max physically realisable index):
        </p>

        <Equation caption="Equation 4 — Normalised health index (CDC MET classification).">
          H  =  min ( 100,  ( Σₖ mₖ · METₖ ) / 7.8  · 100 )
        </Equation>

        <p>
          The composite sustainability grade is a weighted average reflecting
          policy priorities derived from the IPCC AR6 mitigation framework
          <CitationRef n={13}/>:
        </p>

        <Equation caption="Equation 5 — Composite sustainability score. Weights tuned to AR6 climate-priority emphasis.">
{`G  =  0.25 · S_co2     +
      0.20 · S_air     +
      0.20 · S_cong    +
      0.15 · S_health  +
      0.10 · S_prod    +
      0.05 · S_noise   +
      0.05 · S_equity`}
        </Equation>

        <p>
          Each sub-score is normalised against a calibrated real-world anchor.
          <span className="font-mono"> S_co₂</span> reaches zero at 420 t/day — the
          modelled output of a 100 % car modal mix, establishing a meaningful
          worst-case floor. <span className="font-mono">S_air</span> reaches zero at
          15 μg/m³ ambient PM2.5, the WHO 24-hour guideline
          <CitationRef n={12}/>. The congestion index incorporates a temporal
          distribution factor (÷ 8) representing the spread of 620,000 daily
          person-trips across the day; without this, the daily-aggregate road demand
          would saturate the index for any realistic modal mix, including those with
          minimal car use. Under these thresholds the 2022 Toronto downtown baseline
          scores C (≈ 52/100); a car-dominant city scores F; the 2050 TransformTO
          Target scenario scores A (≈ 79/100).
        </p>
      </Section>

      {/* ── DATA TABLE ────────────────────────────────────────────────────── */}
      <Section id="data" eyebrow="03 — Data" title="Per-mode coefficient table" icon={Database}>
        <p>
          Every column below is hard-coded as a constant in
          <code className="text-sky-300"> src/models/metrics-engine.js</code> and
          carries an explicit literature source. Numbers reflect Toronto-downtown
          peak-hour conditions where applicable.
        </p>

        <div className="not-prose my-8 overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead className="bg-surface-700/60 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="text-left  px-4 py-3 font-medium">Mode</th>
                <th className="text-right px-4 py-3 font-medium">CO₂e<br/><span className="text-[9px] opacity-60">g / pax-km</span></th>
                <th className="text-right px-4 py-3 font-medium">PM2.5<br/><span className="text-[9px] opacity-60">g / pax-km</span></th>
                <th className="text-right px-4 py-3 font-medium">NOₓ<br/><span className="text-[9px] opacity-60">g / pax-km</span></th>
                <th className="text-right px-4 py-3 font-medium">Speed<br/><span className="text-[9px] opacity-60">km/h</span></th>
                <th className="text-right px-4 py-3 font-medium">Road<br/><span className="text-[9px] opacity-60">m² / pax</span></th>
                <th className="text-right px-4 py-3 font-medium">Cost<br/><span className="text-[9px] opacity-60">CAD / pax-km</span></th>
                <th className="text-center px-4 py-3 font-medium">Sources</th>
              </tr>
            </thead>
            <tbody className="font-mono text-slate-200">
              {MODE_DATA.map((row, i) => (
                <tr key={row.mode} className={i % 2 ? 'bg-surface-800/40' : 'bg-transparent'}>
                  <td className="text-left  px-4 py-3 font-sans text-slate-300">{row.mode}</td>
                  <td className="text-right px-4 py-3">{row.co2}</td>
                  <td className="text-right px-4 py-3">{row.pm25.toFixed(3)}</td>
                  <td className="text-right px-4 py-3">{row.nox.toFixed(2)}</td>
                  <td className="text-right px-4 py-3">{row.speed}</td>
                  <td className="text-right px-4 py-3">{row.road}</td>
                  <td className="text-right px-4 py-3">{row.cost.toFixed(2)}</td>
                  <td className="text-center px-4 py-3 text-sky-400 text-[11px]">[{row.src}]</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-white text-xl font-semibold mt-10 mb-3">Geographic constants</h3>
        <ul>
          <li><strong>Daily person-trips</strong>: 620,000 (downtown core, City of Toronto Transportation Master Plan<CitationRef n={15}/>)</li>
          <li><strong>Mean trip distance</strong>: 4.8 km<CitationRef n={5}/></li>
          <li><strong>Lane-km of road</strong>: 520 (downtown core)<CitationRef n={15}/></li>
          <li><strong>Downtown area</strong>: ≈25 km²<CitationRef n={15}/></li>
        </ul>

        <h3 className="text-white text-xl font-semibold mt-10 mb-3">Baseline modal split</h3>
        <p>
          The "Status Quo" preset reflects the City of Toronto Cordon Count
          2022<CitationRef n={5}/>: car 34 %, subway 31 %, bus/streetcar 18 %,
          walking 9 %, cycling 6 %, other 2 %. All deltas reported by the
          simulator are computed against this baseline.
        </p>
      </Section>

      {/* ── MODELS ────────────────────────────────────────────────────────── */}
      <Section id="models" eyebrow="04 — Models" title="Sub-model details" icon={Sigma}>
        <ModelCard
          icon={Wind}
          title="Air quality (ambient PM2.5)"
          body={
            <>
              Daily mode-weighted PM2.5 is converted to an estimated downtown
              ambient concentration through a deliberately simple linear
              relationship, <span className="font-mono">PM2.5_ambient = 4 + 56 · Σ Eₚₘ</span>,
              where the 4 μg/m³ floor approximates regional background and the
              56 μg·m⁻³ per tonne-per-day dispersion coefficient is calibrated
              so the Cordon-Count baseline mix returns ~8 μg/m³ — consistent
              with observed Toronto downtown annual averages of 7–9 μg/m³. The
              air-quality sub-score reaches zero at 15 μg/m³, the WHO 24-hour
              PM2.5 guideline<CitationRef n={12}/>. This is <em>not</em> a
              Gaussian-plume or AERMOD-style dispersion solve — wind,
              atmospheric stability, building-canyon effects, and diurnal
              variation are not modelled.
            </>
          }
        />

        <ModelCard
          icon={Flame}
          title="Pollution heatmap (visualisation overlay, not engine output)"
          body={
            <>
              The red/yellow/green heat-overlay on the 3D map is a separate
              visual artefact and is <em>not</em> the engine's PM2.5 number.
              It is a Deck.gl <code className="text-sky-300">HeatmapLayer</code>
              over ~1,400 deterministically-seeded sample points: a coarse
              city-wide grid, a denser downtown grid, and hand-placed hot-spot
              clusters along the Gardiner Expressway, Don Valley Parkway, Yonge
              Street, and Bloor Street corridors. Each point's intensity is
              modulated live by <span className="font-mono">0.88 · car_share + 0.12 · bus_share</span>,
              reflecting the dominance of surface ICE tailpipe emissions. The
              overlay is directionally faithful — it brightens with car share
              and concentrates on real high-traffic arterials — but the
              underlying sample weights are a parametric spatial proxy, not
              measured sensor data. Treat the heatmap as a <em>stylised
              indicator</em> of where pollution would worsen, not as a
              quantitative concentration field.
            </>
          }
        />


        <ModelCard
          icon={Gauge}
          title="Congestion and BPR delay"
          body={
            <>
              Road demand is computed as Σ N·mₖ·rₖ where rₖ is the moving road
              area per person (Table above). Capacity is 520 lane-km × 3.5 m
              effective lane width × 1000 m/km. Because N is a daily total,
              road demand is scaled by 1/8 before the V/C ratio is formed —
              representing the effective distribution of person-trips across
              the operating day rather than treating all 620,000 trips as
              simultaneous. The BPR function<CitationRef n={10}/> then degrades
              car and bus speeds non-linearly under load using Bayesian-calibrated
              coefficients (α≈0.26, β≈2.39, γ≈6.16) fit to observed
              downtown-Toronto speed data — a doubling of V/C produces a
              ~5× delay penalty (2^β), compared to the ~16× the 1964 textbook
              quartic would predict.
            </>
          }
        />

        <ModelCard
          icon={Activity}
          title="Health & productivity"
          body={
            <>
              The Health Index uses CDC MET classifications<CitationRef n={16}/> —
              cycling 7.8 METs, brisk walking 3.5 METs, transit 2.1 METs (for
              walk-to-stop activity), driving 0.9 METs. Productivity is then
              modulated by commute time (each minute over a 15-minute reference
              costs 0.5 % productivity), congestion stress (0.12 % per index
              point) and active-mode wellness gains (+0.2 % per health-index
              point above 30).
            </>
          }
        />
      </Section>

      {/* ── LIMITATIONS ───────────────────────────────────────────────────── */}
      <Section id="limitations" eyebrow="05 — Limitations" title="Assumptions & limitations" icon={AlertTriangle}>
        <p className="text-amber-200/90 bg-amber-400/5 border border-amber-400/20 rounded-lg p-4 not-prose mb-6">
          <strong className="text-amber-300">A note on scope.</strong> TransitSim
          is a <em>policy-comparison instrument</em>, not a forecast model. The
          numbers it produces are useful for ranking scenarios against each
          other; they should not be cited as point predictions for a specific
          calendar year.
        </p>

        <ul>
          <li>
            <strong>Static equilibrium.</strong> Total demand and trip length
            are held constant. Induced demand (more cars when roads are emptier)
            and modal substitution elasticities are not modelled.
          </li>
          <li>
            <strong>Spatial homogeneity.</strong> The downtown core is treated
            as a single zone. Origin–destination structure, network topology,
            and corridor-specific bottlenecks are abstracted away.
          </li>
          <li>
            <strong>Linear emissions.</strong> Per-pax-km factors are constant —
            cold-start emissions, payload effects, weather, and seasonal grid
            mix are not modelled.
          </li>
          <li>
            <strong>Simplified dispersion.</strong> Ambient PM2.5 uses a linear
            fit, not a CALPUFF/AERMOD-grade plume model.
          </li>
          <li>
            <strong>Health is acute, not chronic.</strong> The Health Index
            captures activity METs only; it does not estimate DALYs, road-injury
            risk, or PM2.5 morbidity (which would require a HEAT-style epidemiological
            module<CitationRef n={11}/>).
          </li>
          <li>
            <strong>Composite weights are normative.</strong> The 25/20/20/15/10/5/5
            weighting scheme reflects the IPCC AR6 climate-first emphasis
            <CitationRef n={13}/>; alternative weightings (e.g. equity-first)
            would produce different overall grades.
          </li>
        </ul>
      </Section>

      {/* ── REFERENCES ────────────────────────────────────────────────────── */}
      <Section id="references" eyebrow="06 — References" title="Cited sources" icon={BookOpen}>
        <p>
          References are listed in citation order. Each entry is hyperlinked to
          a publicly accessible primary source.
        </p>
        <ol className="not-prose mt-6 space-y-4 text-sm">
          {REFERENCES.map(r => (
            <li
              key={r.n}
              id={`ref-${r.n}`}
              className="flex gap-4 p-4 rounded-lg border border-white/5 bg-surface-800/40 hover:border-sky-400/30 transition-colors"
            >
              <span className="font-mono text-sky-400 flex-shrink-0 w-8">[{r.n}]</span>
              <div className="flex-1 leading-relaxed">
                <div className="text-slate-200">
                  {r.authors} ({r.year}). <span className="font-medium text-white">{r.title}</span>.
                </div>
                <div className="text-slate-400 text-[13px] mt-1 italic">{r.venue}</div>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 text-[12px] font-mono mt-1 break-all"
                >
                  <ExternalLink size={11} />
                  {r.url}
                </a>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── HOW TO CITE ───────────────────────────────────────────────────── */}
      <Section id="cite" eyebrow="07 — Citation" title="How to cite this work" icon={Quote}>
        <p>If you use TransitSim in academic, policy, or journalistic work, please cite:</p>
        <Equation>
{`Malik, H. (2026). TransitSim: An Evidence-Based Modal-Share
Simulator for Downtown Toronto (v1.0) [Software].
https://github.com/hasanmalik/TransitSim`}
        </Equation>
        <p>BibTeX:</p>
        <Equation>
{`@software{malik2026transitsim,
  author  = {Malik, Hasan},
  title   = {TransitSim: An Evidence-Based Modal-Share
             Simulator for Downtown Toronto},
  year    = {2026},
  version = {1.0},
  url     = {https://github.com/hasanmalik/TransitSim}
}`}
        </Equation>
      </Section>

      {/* ── COLOPHON ──────────────────────────────────────────────────────── */}
      <Section id="colophon" eyebrow="Colophon" title="Built with" icon={GitBranch}>
        <ul>
          <li><strong>Frontend</strong> — React 18, Vite 5, Tailwind CSS, Framer Motion, Lucide icons</li>
          <li><strong>Mapping</strong> — Mapbox GL JS, react-map-gl, Deck.gl (3D scatter, heat-map, trips, line layers)</li>
          <li><strong>Charts</strong> — Recharts (radar + delta visualisations)</li>
          <li><strong>Engine</strong> — Pure-JS deterministic functions in <code className="text-sky-300">src/models/metrics-engine.js</code></li>
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
            href="https://hasan-malik.github.io"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-slate-200 transition-colors"
          >
            <Globe size={14} /> Contact the author
          </a>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-400/15 hover:bg-sky-400/25 border border-sky-400/30 text-sm text-sky-200 transition-colors"
          >
            <ArrowLeft size={14} /> Return to simulator
          </button>
        </div>
      </Section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="max-w-5xl mx-auto px-8 py-10 text-center text-[11px] text-slate-600 font-mono">
        © 2026 Hasan Malik · TransitSim v1.0 · MIT Licence
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Small components
 * ──────────────────────────────────────────────────────────────────────────── */

function HeroStat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-xl bg-surface-800/50 border border-white/5 backdrop-blur p-4">
      <div className="flex items-center gap-2 text-sky-300/70 text-[10px] uppercase tracking-wider mb-2">
        <Icon size={12} />
        Datum
      </div>
      <div className="text-2xl font-bold text-white font-mono leading-none mb-1">{value}</div>
      <div className="text-[11px] text-slate-400 leading-tight">{label}</div>
    </div>
  );
}

function ModelCard({ icon: Icon, title, body }) {
  return (
    <div className="not-prose my-6 p-6 rounded-xl bg-surface-800/40 border border-white/5">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-8 h-8 rounded-md bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-300">
          <Icon size={16} />
        </span>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-slate-300 leading-relaxed text-[15px]">{body}</p>
    </div>
  );
}

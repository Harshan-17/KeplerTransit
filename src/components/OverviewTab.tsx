import React, { useState } from 'react';
import { SpaceHero } from './SpaceHero';
import {
  Globe,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Image as ImageIcon,
  ArrowRight,
  ExternalLink,
  Layers,
  Thermometer,
  Clock,
  Radio,
  Orbit,
  Sun,
  Activity,
} from 'lucide-react';
import { DatasetOverview, TransitTelemetry } from '../types/kepler';

interface OverviewTabProps {
  overview: DatasetOverview | null;
  loading: boolean;
  onExploreFilter: (preset: string) => void;
  onSelectCandidate: (id: string | number) => void;
  activeTransit?: TransitTelemetry | null;
  featuredList?: TransitTelemetry[];
  onSelectTransit?: (item: TransitTelemetry) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  overview,
  loading,
  onExploreFilter,
  onSelectCandidate,
  activeTransit,
  featuredList,
  onSelectTransit,
}) => {
  const [selectedFigure, setSelectedFigure] = useState<string | null>(null);

  const figures = [
    {
      title: '1. Classification Distribution',
      file: '01_classification_distribution.png',
      desc: 'Distribution of Confirmed, Candidate, and False Positive dispositions across the Kepler dataset.',
    },
    {
      title: '2. Radius by Classification',
      file: '02_radius_by_classification.png',
      desc: 'Box plot comparison of planetary radius (R⊕) across archive classifications.',
    },
    {
      title: '3. Period by Classification',
      file: '03_period_by_classification.png',
      desc: 'Orbital period spread across Kepler disposition groups.',
    },
    {
      title: '4. Radius vs Transit Depth',
      file: '04_radius_vs_transit_depth.png',
      desc: 'Scatter comparison highlighting the quadratic ΔF/F relationship.',
    },
    {
      title: '5. Period vs Temperature',
      file: '05_period_vs_temperature.png',
      desc: 'Inverse relationship between orbital distance and equilibrium temperature.',
    },
    {
      title: '6. Period vs Transit Duration',
      file: '06_period_vs_transit_duration.png',
      desc: 'Orbital mechanics showing how wider orbits result in longer transit durations.',
    },
    {
      title: '7. Star vs Planet Temperature',
      file: '07_star_vs_planet_temperature.png',
      desc: 'Stellar radiative temperature impact on planet thermal equilibrium.',
    },
    {
      title: '8. Correlation Heatmap',
      file: '08_correlation_heatmap.png',
      desc: 'Complete correlation matrix across all 12 key numerical Kepler features.',
    },
  ];

  return (
    <div className="w-full animate-fade-in">
      {/* Cinematic Full-Viewport 3D Space Hero with Real-Time Transit Countdown & Interactive Planet */}
      <SpaceHero
        onExploreFilter={onExploreFilter}
        onSelectCandidate={onSelectCandidate}
        activeTransit={activeTransit}
        featuredList={featuredList}
        onSelectTransit={onSelectTransit}
      />

      {/* Scroll-Driven Planetary Narrative & Astrophysical Milestones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-2 space-y-8">
        {/* Section Kicker */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-cyan-500/15">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1.5">
              <Orbit className="w-3.5 h-3.5 animate-spin-slow text-cyan-400" />
              <span>Observatory Exploration Narrative</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">Kepler Science Journey</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              How Kepler Discovers Distant Worlds
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Scroll through the line-of-sight transit sequence: from stellar radiative equilibrium to photometric dip detection, surface displacement, and habitability characterization.
            </p>
          </div>
        </div>

        {/* 4-Stage Scroll Storytelling Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stage 1: Central Host Star */}
          <div className="p-5 rounded-2xl bg-[#080d19]/90 border border-amber-500/20 space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between text-amber-400 text-xs font-mono">
              <span className="font-bold tracking-wider">01. STELLAR ORIGIN</span>
              <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-base font-bold text-white font-mono">
              Radiative Host Star
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              The host star sits at the coordinate center. Its spectral class and effective temperature (~{activeTransit?.candidate.stellar_effective_temperature_k || 5770} K) dictate the circumstellar habitable zone boundary where liquid surface water can survive.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-amber-300">
              Radius: {activeTransit?.candidate.stellar_radius_solar_radii || 1.0} R☉
            </div>
          </div>

          {/* Stage 2: Transit Ingress & Chord */}
          <div className="p-5 rounded-2xl bg-[#080d19]/90 border border-cyan-500/20 space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center justify-between text-cyan-400 text-xs font-mono">
              <span className="font-bold tracking-wider">02. TRANSIT CHORD</span>
              <Activity className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-base font-bold text-white font-mono">
              Photometric Attenuation
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              As the exoplanet crosses the line of sight, it blocks stellar flux by ΔF/F ≈ (Rp/R*)² ({activeTransit?.candidate.transit_depth_ppm || 420} ppm). High-cadence Kepler sensors register this periodic limb-darkened dip.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-cyan-300">
              Duration: {activeTransit?.candidate.transit_duration_hours || 3.2} hrs
            </div>
          </div>

          {/* Stage 3: Atmospheric & Terrain Shader */}
          <div className="p-5 rounded-2xl bg-[#080d19]/90 border border-indigo-500/20 space-y-3 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
            <div className="flex items-center justify-between text-indigo-400 text-xs font-mono">
              <span className="font-bold tracking-wider">03. SURFACE & ATMOSPHERE</span>
              <Globe className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-base font-bold text-white font-mono">
              Interactive GLSL Shader
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              The revolving 3D planet computes procedural vertex displacement shaders in real-time, responding to cursor deformation and showing thermal day/night terminator transitions.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-indigo-300">
              Equilibrium Temp: {activeTransit?.candidate.equilibrium_temperature_k || 288} K
            </div>
          </div>

          {/* Stage 4: Machine Learning Vetting */}
          <div className="p-5 rounded-2xl bg-[#080d19]/90 border border-emerald-500/20 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-mono">
              <span className="font-bold tracking-wider">04. ML SCREENING</span>
              <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-base font-bold text-white font-mono">
              Algorithmic Prioritization
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              A 200-tree balanced Random Forest classifier evaluates 12 astrophysical features (Transit SNR, period, depth, radius) to reject false positives and assign follow-up priority scores.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-emerald-300">
              Archive Accuracy: 89.84% (F1: 0.90)
            </div>
          </div>
        </div>
      </div>

      {/* Main Disposition KPI Grid and Research Telemetry */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Telemetry Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-cyan-500/15">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
              NASA Kepler DR25 Mission Archive
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5">
              Authoritative Catalog Telemetry
            </h2>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Real data from 9,201 analyzed Kepler Objects of Interest (KOIs)
          </p>
        </div>

        {/* Main Disposition KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="observatory-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-mono uppercase tracking-wider text-[11px]">Kepler Records</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {loading ? '...' : (overview?.totalObjects ?? 9201).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            9,201 KOIs analyzed in mission archive
          </p>
        </div>

        {/* Confirmed */}
        <div className="observatory-panel p-5 rounded-2xl border-l-2 border-l-emerald-500">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2 font-semibold font-mono uppercase tracking-wider text-[11px]">
            <span>Confirmed Worlds</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-300 font-mono">
            {loading ? '...' : (overview?.dispositionCounts.CONFIRMED ?? 2292).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-mono">
            <span>Archive Share</span>
            <span className="font-semibold text-emerald-400">
              {overview?.dispositionPercentages.CONFIRMED ?? 24.9}%
            </span>
          </div>
        </div>

        {/* Candidates */}
        <div className="observatory-panel p-5 rounded-2xl border-l-2 border-l-amber-500">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-2 font-semibold font-mono uppercase tracking-wider text-[11px]">
            <span>Active Candidates</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-300 font-mono">
            {loading ? '...' : (overview?.dispositionCounts.CANDIDATE ?? 2185).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-mono">
            <span>Screening Queue</span>
            <span className="font-semibold text-amber-400">
              {overview?.dispositionPercentages.CANDIDATE ?? 23.7}%
            </span>
          </div>
        </div>

        {/* False Positives */}
        <div className="observatory-panel p-5 rounded-2xl border-l-2 border-l-rose-500">
          <div className="flex items-center justify-between text-rose-400 text-xs mb-2 font-semibold font-mono uppercase tracking-wider text-[11px]">
            <span>False Positives</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-300 font-mono">
            {loading ? '...' : (overview?.dispositionCounts.FALSE_POSITIVE ?? 4724).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-mono">
            <span>Eclipsing / Artifacts</span>
            <span className="font-semibold text-rose-400">
              {overview?.dispositionPercentages.FALSE_POSITIVE ?? 51.3}%
            </span>
          </div>
        </div>
      </div>

      {/* Disposition Percentage Bar */}
      <div className="observatory-panel p-6 rounded-2xl">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
          <span>Kepler Archive Disposition Distribution</span>
          <span className="text-slate-500 font-normal">
            {overview?.totalObjects ?? 9201} Monitored Signatures
          </span>
        </h3>
        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${overview?.dispositionPercentages.CONFIRMED ?? 24.9}%` }}
            className="bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer"
            title={`Confirmed: ${overview?.dispositionPercentages.CONFIRMED ?? 24.9}%`}
          />
          <div
            style={{ width: `${overview?.dispositionPercentages.CANDIDATE ?? 23.7}%` }}
            className="bg-amber-500 hover:bg-amber-400 transition-all cursor-pointer"
            title={`Candidate: ${overview?.dispositionPercentages.CANDIDATE ?? 23.7}%`}
          />
          <div
            style={{ width: `${overview?.dispositionPercentages.FALSE_POSITIVE ?? 51.3}%` }}
            className="bg-rose-500 hover:bg-rose-400 transition-all cursor-pointer"
            title={`False Positive: ${overview?.dispositionPercentages.FALSE_POSITIVE ?? 51.3}%`}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Confirmed: {overview?.dispositionPercentages.CONFIRMED ?? 24.9}% ({overview?.dispositionCounts.CONFIRMED ?? 2292})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Candidate: {overview?.dispositionPercentages.CANDIDATE ?? 23.7}% ({overview?.dispositionCounts.CANDIDATE ?? 2185})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>False Positive: {overview?.dispositionPercentages.FALSE_POSITIVE ?? 51.3}% ({overview?.dispositionCounts.FALSE_POSITIVE ?? 4724})</span>
          </div>
        </div>
      </div>

      {/* Key Astrophysical Metrics */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Astrophysical Parameter Telemetry (Cleaned Dataset)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Radius */}
          <div className="observatory-panel p-5 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2 font-mono uppercase tracking-wider">
              <Globe className="w-4 h-4" /> Planetary Radius (R⊕)
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {overview?.summaryStats.radius.median ?? '2.39'} R⊕
              </span>
              <span className="text-xs text-slate-400 font-mono">median</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 space-y-1 font-mono">
              <div>Average: {overview?.summaryStats.radius.avg ?? '102.89'} R⊕</div>
              <div>Baseline Earth: 1.0 R⊕</div>
            </div>
          </div>

          {/* Period */}
          <div className="observatory-panel p-5 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-2 font-mono uppercase tracking-wider">
              <Clock className="w-4 h-4" /> Orbital Period (days)
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {overview?.summaryStats.period.median ?? '9.3'} d
              </span>
              <span className="text-xs text-slate-400 font-mono">median</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 space-y-1 font-mono">
              <div>Average: {overview?.summaryStats.period.avg ?? '74.3'} days</div>
              <div>Min: {overview?.summaryStats.period.min ?? '0.24'} days</div>
            </div>
          </div>

          {/* Temp */}
          <div className="observatory-panel p-5 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-2 font-mono uppercase tracking-wider">
              <Thermometer className="w-4 h-4" /> Equilibrium Temp (K)
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {overview?.summaryStats.temperature.median ?? '878'} K
              </span>
              <span className="text-xs text-slate-400 font-mono">median</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 space-y-1 font-mono">
              <div>Habitable window: 240 K to 330 K</div>
              <div>Average: {overview?.summaryStats.temperature.avg ?? '1,085'} K</div>
            </div>
          </div>

          {/* Transit Depth */}
          <div className="observatory-panel p-5 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-2 font-mono uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" /> Transit Depth (ppm)
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {overview?.summaryStats.transitDepth.median?.toLocaleString() ?? '421'} ppm
              </span>
              <span className="text-xs text-slate-400 font-mono">median</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 space-y-1 font-mono">
              <div>Average: {overview?.summaryStats.transitDepth.avg?.toLocaleString() ?? '23,791'} ppm</div>
              <div>Earth-Sun dip: ~84 ppm</div>
            </div>
          </div>

          {/* SNR */}
          <div className="observatory-panel p-5 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2 font-mono uppercase tracking-wider">
              <Radio className="w-4 h-4" /> Transit SNR (σ)
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {overview?.summaryStats.snr.median ?? '23.0'}
              </span>
              <span className="text-xs text-slate-400 font-mono">median</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 space-y-1 font-mono">
              <div>Detection threshold: &gt; 7.1σ</div>
              <div>Average: {overview?.summaryStats.snr.avg ?? '259.9'}</div>
            </div>
          </div>

          {/* Stellar Temp */}
          <div className="observatory-panel p-5 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-2 font-mono uppercase tracking-wider">
              <Thermometer className="w-4 h-4" /> Host Star Temp (K)
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {overview?.summaryStats.stellarTemp.median ?? '5,767'} K
              </span>
              <span className="text-xs text-slate-400 font-mono">median</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 space-y-1 font-mono">
              <div>Solar benchmark: ~5,778 K (G-type)</div>
              <div>Average: {overview?.summaryStats.stellarTemp.avg ?? '5,706'} K</div>
            </div>
          </div>
        </div>
      </div>

      {/* Original Research Visualizations Gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Kepler Research Visualizations (Matplotlib Research Pipeline)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              High-resolution observational figures generated by <code className="text-cyan-400 font-mono">visualizations.py</code> during mission archive processing
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {figures.map((fig) => (
            <div
              key={fig.file}
              onClick={() => setSelectedFigure(fig.file)}
              className="observatory-card-interactive hud-corner-tl hud-corner-br rounded-xl overflow-hidden cursor-pointer group"
            >
              <div className="aspect-[4/3] bg-[#020409] overflow-hidden relative border-b border-slate-800/80">
                <img
                  src={`/figures/${fig.file}`}
                  alt={fig.title}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback visual if image load fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-cyan-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <span className="bg-[#020409]/90 text-cyan-300 text-xs px-2.5 py-1 rounded-full font-semibold border border-cyan-500/50 flex items-center gap-1 font-mono">
                    <ExternalLink className="w-3 h-3" /> INSPECT FIGURE
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors font-mono">
                  {fig.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-sans">
                  {fig.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Image Modal */}
      {selectedFigure && (
        <div
          onClick={() => setSelectedFigure(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="observatory-panel hud-corner-tl hud-corner-br rounded-2xl max-w-4xl w-full p-4 overflow-hidden relative shadow-2xl border border-cyan-500/30"
          >
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
              <span className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                OBSERVATORY ARCHIVE FIGURE: {selectedFigure}
              </span>
              <button
                onClick={() => setSelectedFigure(null)}
                className="text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-mono cursor-pointer transition-colors"
              >
                CLOSE [ESC]
              </button>
            </div>
            <div className="bg-[#020409] rounded-xl p-3 flex items-center justify-center max-h-[75vh] overflow-auto border border-slate-800">
              <img
                src={`/figures/${selectedFigure}`}
                alt="Selected Figure"
                className="max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

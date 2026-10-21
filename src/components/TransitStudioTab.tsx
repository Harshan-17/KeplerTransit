import React, { useState, useEffect, useRef } from 'react';
import {
  Orbit,
  Activity,
  Calendar,
  Sliders,
  Sparkles,
  Info,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sun,
  Globe,
  Radio,
  Gauge,
  Compass,
} from 'lucide-react';
import { KeplerRecord } from '../types/kepler';

interface TransitStudioTabProps {
  initialCandidate?: KeplerRecord | null;
}

export const TransitStudioTab: React.FC<TransitStudioTabProps> = ({ initialCandidate }) => {
  // Configurable transit simulation parameters
  const [planetRadius, setPlanetRadius] = useState<number>(2.5); // Earth radii
  const [starRadius, setStarRadius] = useState<number>(1.0); // Solar radii
  const [orbitalPeriod, setOrbitalPeriod] = useState<number>(9.5); // days
  const [transitDuration, setTransitDuration] = useState<number>(3.2); // hours
  const [impactParameter, setImpactParameter] = useState<number>(0.2); // 0 to 1
  const [refEpoch, setRefEpoch] = useState<number>(170.5); // BKJD
  const [noiseLevel, setNoiseLevel] = useState<number>(35); // ppm

  // Animation playback state for the orbital simulator
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simPhase, setSimPhase] = useState<number>(0.5); // 0 = pre-ingress, 0.5 = mid-transit, 1 = post-egress
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialCandidate) {
      if (initialCandidate.planetary_radius_earth_radii > 0) setPlanetRadius(initialCandidate.planetary_radius_earth_radii);
      if (initialCandidate.stellar_radius_solar_radii > 0) setStarRadius(initialCandidate.stellar_radius_solar_radii);
      if (initialCandidate.orbital_period_days > 0) setOrbitalPeriod(initialCandidate.orbital_period_days);
      if (initialCandidate.transit_duration_hours > 0) setTransitDuration(initialCandidate.transit_duration_hours);
      if (initialCandidate.impact_parameter >= 0) setImpactParameter(initialCandidate.impact_parameter);
      if (initialCandidate.transit_epoch_bkjd > 0) setRefEpoch(initialCandidate.transit_epoch_bkjd);
    }
  }, [initialCandidate]);

  // Orbital simulation animation loop
  useEffect(() => {
    if (!isPlaying) return;
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      // Cycle through transit window smoothly in ~8 seconds
      setSimPhase((prev) => (prev + dt * 0.12) % 1.0);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying]);

  // Presets
  const presets = [
    {
      name: 'Earth-Sun Analog',
      desc: 'Terrestrial world orbiting G-dwarf',
      radius: 1.0,
      star: 1.0,
      period: 365.25,
      duration: 13.0,
      impact: 0.1,
      epoch: 120.0,
    },
    {
      name: 'Hot Jupiter (Scorcher)',
      desc: 'Massive gas giant with deep 1% dip',
      radius: 11.2,
      star: 1.1,
      period: 3.5,
      duration: 2.8,
      impact: 0.3,
      epoch: 155.2,
    },
    {
      name: 'K01408.01',
      desc: 'Top ML Priority Earth-size Candidate',
      radius: 1.36,
      star: 0.55,
      period: 14.53,
      duration: 3.31,
      impact: 0.76,
      epoch: 145.42,
    },
    {
      name: 'Kepler-226 c',
      desc: 'Confirmed multi-planet Super-Earth',
      radius: 2.55,
      star: 0.91,
      period: 5.35,
      duration: 3.03,
      impact: 0.09,
      epoch: 171.81,
    },
  ];

  // Physics calculations
  // R_sun in Earth radii approx = 109.1
  const rStarEarthRadii = starRadius * 109.1;
  const radiusRatio = planetRadius / (rStarEarthRadii || 1);
  const transitDepthFraction = Math.pow(radiusRatio, 2);
  const transitDepthPpm = Math.round(transitDepthFraction * 1e6);

  // Generate synthetic curve points
  const spanHours = Math.max(10, transitDuration * 2.5);
  const halfDur = transitDuration / 2;
  const numPoints = 140;
  const curvePoints: { time: number; flux: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const t = -spanHours / 2 + (i / (numPoints - 1)) * spanHours;
    let flux = 1.0;
    if (Math.abs(t) < halfDur) {
      // Geometric dip with quadratic limb darkening profile approximation
      const u = Math.abs(t) / halfDur;
      const limb = 1 - 0.28 * Math.pow(u, 2);
      flux = 1.0 - transitDepthFraction * limb;
    }
    // Photometric noise
    const noise = ((i % 5) - 2) * 0.000004 * (noiseLevel / 50);
    curvePoints.push({
      time: parseFloat(t.toFixed(2)),
      flux: parseFloat((flux + noise).toFixed(6)),
    });
  }

  // Active simulated time based on phase: maps [0, 1] to [-spanHours/2, +spanHours/2]
  const currentSimTime = -spanHours / 2 + simPhase * spanHours;
  const isInsideTransit = Math.abs(currentSimTime) < halfDur;
  const currentLimb = isInsideTransit ? (1 - 0.28 * Math.pow(Math.abs(currentSimTime) / halfDur, 2)) : 0;
  const currentInstantFlux = isInsideTransit ? 1.0 - transitDepthFraction * currentLimb : 1.0;

  // Upcoming transits calculation (Ephemeris: t_n = t_0 + n * P)
  const nowMs = Date.now();
  const currentJD = (nowMs / 86400000) + 2440587.5;
  const currentBKJD = currentJD - 2454833.0;
  const nStart = Math.ceil((currentBKJD - refEpoch) / (orbitalPeriod || 1));
  const upcoming = [0, 1, 2, 3, 4].map((offset) => {
    const n = nStart + offset;
    const bkjd = refEpoch + n * orbitalPeriod;
    const daysAway = bkjd - currentBKJD;
    return {
      n,
      bkjd: parseFloat(bkjd.toFixed(3)),
      daysAway: parseFloat(daysAway.toFixed(1)),
    };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Observatory Laboratory Context Header */}
      <div className="observatory-panel hud-corner-tl hud-corner-br rounded-2xl p-6 shadow-xl border border-cyan-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
              <Orbit className="w-4 h-4 text-cyan-400" />
              <span>ORBITAL RESEARCH LABORATORY</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span>PHOTOMETRIC LIGHT CURVE SYNTHESIZER</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight font-mono">
              Planetary Transit Simulator & Ephemeris Predictor
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed font-sans">
              As an exoplanet orbits across the host star&apos;s stellar disc, the obscured surface area produces a periodic reduction in apparent flux. The transit depth directly reveals the radius ratio <code className="text-cyan-400 font-mono">ΔF/F ≈ (R_p / R_*)²</code>, while the orbital period governs prospective transit scheduling <code className="text-cyan-400 font-mono">t_n = t_0 + n × P</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause Simulator' : 'Resume Simulator'}</span>
            </button>
            <button
              onClick={() => setSimPhase(0.5)}
              className="px-3 py-2 rounded-xl bg-[#020409]/90 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset to Mid-Transit Alignment"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mid-Transit</span>
            </button>
          </div>
        </div>

        {/* Astrophysical Preset Selectors */}
        <div className="mt-5 pt-4 border-t border-slate-800/70 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 font-semibold mr-1 uppercase text-[11px]">System Presets:</span>
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setPlanetRadius(p.radius);
                setStarRadius(p.star);
                setOrbitalPeriod(p.period);
                setTransitDuration(p.duration);
                setImpactParameter(p.impact);
                setRefEpoch(p.epoch);
                setSimPhase(0.5);
              }}
              className="px-3 py-1.5 rounded-lg observatory-card-interactive text-xs font-medium text-slate-200 hover:border-cyan-400 hover:text-cyan-200 transition-all cursor-pointer"
              title={p.desc}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Unified Orbital Research Scene: Star + Transit Disk + Synchronized Light Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Integrated Telemetry Controls */}
        <div className="lg:col-span-4 observatory-panel p-5 rounded-2xl space-y-5 border border-cyan-500/15">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white font-mono">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Instrument Parameters</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">
              Live Synthesis
            </span>
          </div>

          {/* Planet Radius */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Planetary Radius (R_p)</span>
              <span className="font-bold text-cyan-300">{planetRadius} R⊕</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.1"
              value={planetRadius}
              onChange={(e) => setPlanetRadius(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.5 R⊕ (Sub-Earth)</span>
              <span>20 R⊕ (Super-Jupiter)</span>
            </div>
          </div>

          {/* Stellar Radius */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Stellar Radius (R_*)</span>
              <span className="font-bold text-amber-300">{starRadius} R☉</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.05"
              value={starRadius}
              onChange={(e) => setStarRadius(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.3 R☉ (M-Dwarf)</span>
              <span>2.5 R☉ (A-Star)</span>
            </div>
          </div>

          {/* Orbital Period */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Orbital Period (P)</span>
              <span className="font-bold text-indigo-300">{orbitalPeriod} days</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="100"
              step="0.5"
              value={orbitalPeriod}
              onChange={(e) => setOrbitalPeriod(parseFloat(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />
          </div>

          {/* Transit Duration */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Transit Duration (T_dur)</span>
              <span className="font-bold text-emerald-300">{transitDuration} hours</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="16"
              step="0.1"
              value={transitDuration}
              onChange={(e) => setTransitDuration(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Impact Parameter */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Impact Parameter (b)</span>
              <span className="font-bold text-slate-200">{impactParameter}</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.95"
              step="0.05"
              value={impactParameter}
              onChange={(e) => setImpactParameter(parseFloat(e.target.value))}
              className="w-full accent-slate-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.0 (Equatorial transit)</span>
              <span>1.0 (Grazing edge)</span>
            </div>
          </div>

          {/* Photometric Noise */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Photometric Noise Simulation</span>
              <span className="text-slate-400">{noiseLevel} ppm</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
          </div>

          {/* Derived Real-time Telemetry Readouts */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Radius Ratio (R_p / R_*)</span>
              <span className="text-white font-bold">{radiusRatio.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Calculated Transit Depth</span>
              <span className="text-cyan-300 font-bold">{transitDepthPpm.toLocaleString()} ppm</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Geometric Flux Drop</span>
              <span className="text-emerald-300 font-bold">{((transitDepthPpm / 1e6) * 100).toFixed(4)}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Morphological Regime</span>
              <span className="text-amber-300 font-semibold">
                {planetRadius < 1.5 ? 'Terrestrial (Rocky)' : planetRadius < 4 ? 'Sub-Neptune' : 'Gas Giant'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Orbital Eclipse Stage & Synchronized Light Curve */}
        <div className="lg:col-span-8 space-y-6">
          {/* A. 2D Visual Transit Projection Stage */}
          <div className="observatory-panel p-6 rounded-2xl border border-cyan-500/20 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Transit Geometry Projection & Limb-Darkened Disc
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">
                  Phase: <strong className="text-cyan-300 font-mono">{(simPhase * 100).toFixed(0)}%</strong>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                  isInsideTransit ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50' : 'bg-slate-900 text-slate-400'
                }`}>
                  {isInsideTransit ? 'Transit Ingress Active' : 'Out-of-Transit Baseline'}
                </span>
              </div>
            </div>

            {/* Simulated 2D Observatory Disc Visualizer */}
            <div className="h-64 w-full bg-[#02050c] rounded-xl relative flex items-center justify-center overflow-hidden border border-slate-800/90 shadow-inner">
              {/* Star Background Starfield Dots */}
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

              {/* Host Star with Realistic Radial Limb Darkening */}
              <div
                style={{
                  width: `${Math.min(200, Math.max(90, starRadius * 120))}px`,
                  height: `${Math.min(200, Math.max(90, starRadius * 120))}px`,
                }}
                className="relative rounded-full transition-all duration-300 flex items-center justify-center shadow-2xl shadow-amber-500/25"
              >
                {/* Limb Darkened Gradient */}
                <div className="absolute inset-0 rounded-full bg-gradient-radial from-amber-200 via-amber-400 to-amber-700 shadow-[0_0_60px_rgba(245,158,11,0.4)]" />

                {/* Star center core glow */}
                <div className="absolute inset-4 rounded-full bg-radial from-white via-amber-200 to-transparent opacity-75" />

                {/* Transit Chords Line (Impact Parameter Track) */}
                <div
                  style={{
                    transform: `translateY(${impactParameter * 45}px)`,
                  }}
                  className="absolute left-[-40px] right-[-40px] h-[1px] border-b border-dashed border-cyan-400/30 pointer-events-none"
                />
              </div>

              {/* Orbiting Transiting Planet */}
              {(() => {
                // Map simPhase [0, 1] across the viewport width
                const trackWidth = 520;
                const planetX = -trackWidth / 2 + simPhase * trackWidth;
                const planetY = impactParameter * 45;
                const planetPixelSize = Math.max(8, Math.min(48, planetRadius * 3.2));

                return (
                  <div
                    style={{
                      transform: `translate(${planetX}px, ${planetY}px)`,
                      width: `${planetPixelSize}px`,
                      height: `${planetPixelSize}px`,
                    }}
                    className="absolute rounded-full bg-[#050914] border-2 border-cyan-400/80 shadow-[0_0_15px_rgba(56,189,248,0.4)] pointer-events-none transition-transform duration-75 flex items-center justify-center"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-300/80" />
                  </div>
                );
              })()}

              {/* Phase Slider Control Bar at bottom of simulator */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3 bg-[#020409]/85 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 text-[11px] shrink-0">Orbital Phase:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={simPhase}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setSimPhase(parseFloat(e.target.value));
                  }}
                  className="flex-1 accent-cyan-400 cursor-pointer"
                />
                <span className="text-cyan-300 text-[11px] w-12 text-right">
                  {currentSimTime >= 0 ? `+${currentSimTime.toFixed(1)}h` : `${currentSimTime.toFixed(1)}h`}
                </span>
              </div>
            </div>
          </div>

          {/* B. Synchronized Photometric Light Curve Graph */}
          <div className="observatory-panel p-5 rounded-2xl border border-cyan-500/20 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Relative Flux Light Curve [ppm]
                </h3>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Current Flux: <strong className="text-cyan-300">{currentInstantFlux.toFixed(6)}</strong>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div className="h-60 w-full bg-[#020409]/95 rounded-xl p-4 border border-slate-800/80 relative">
              <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                {/* Horizontal reference baseline */}
                <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="170" x2="600" y2="170" stroke="rgba(56, 189, 248, 0.1)" strokeWidth="1" strokeDasharray="3 3" />
                {/* Central zero axis */}
                <line x1="300" y1="0" x2="300" y2="200" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" />

                {/* Light Curve Path */}
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  points={curvePoints
                    .map((pt, idx) => {
                      const x = (idx / (curvePoints.length - 1)) * 600;
                      // Normalize y between 30 (flux = 1.0) and 170 (dip bottom)
                      const maxDip = Math.max(0.0001, transitDepthFraction * 1.15);
                      const norm = (1.0 - pt.flux) / maxDip;
                      const y = 30 + Math.max(0, Math.min(1, norm)) * 140;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ')}
                />

                {/* Synchronized Vertical Scanner Cursor at current simPhase */}
                {(() => {
                  const cursorX = simPhase * 600;
                  return (
                    <g>
                      <line
                        x1={cursorX}
                        y1="0"
                        x2={cursorX}
                        y2="200"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />
                      <circle cx={cursorX} cy="30" r="3" fill="#f59e0b" />
                    </g>
                  );
                })()}
              </svg>

              <div className="absolute top-2 left-4 text-[11px] font-mono text-slate-400">
                Baseline Flux: 1.00000
              </div>
              <div className="absolute bottom-2 left-4 text-[11px] font-mono text-cyan-400">
                Minimum Dip: {(1 - transitDepthFraction).toFixed(5)} ({transitDepthPpm.toLocaleString()} ppm)
              </div>
              <div className="absolute bottom-2 right-4 text-[11px] font-mono text-slate-400">
                Transit Window: ±{(spanHours / 2).toFixed(1)} hrs
              </div>
              <div className="absolute top-2 right-4 text-[11px] font-mono text-amber-400">
                T_dur: {transitDuration}h
              </div>
            </div>
          </div>

          {/* C. Ephemeris Timing Predictor Table */}
          <div className="observatory-panel p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Transit Timing Ephemeris Predictor (<code className="text-cyan-400 font-mono">t_n = t_0 + n × P</code>)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Reference Epoch t_0: {refEpoch} BKJD
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              When the transit epoch and period are calibrated, future transit windows can be computed indefinitely for observatory scheduling:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 font-mono">
              {upcoming.map((item) => (
                <div
                  key={item.n}
                  className="observatory-card-interactive p-3 rounded-xl text-center space-y-1"
                >
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Orbit #{item.n}
                  </span>
                  <span className="text-base font-bold text-cyan-300 block font-mono">
                    +{item.daysAway} d
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    BKJD {item.bkjd}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

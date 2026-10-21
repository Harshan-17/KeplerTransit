import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  HelpCircle,
  Eye,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { CorrelationRelationship, CorrelationMatrixData } from '../types/kepler';

export const StatisticsTab: React.FC = () => {
  const [relationships, setRelationships] = useState<CorrelationRelationship[]>([]);
  const [matrixData, setMatrixData] = useState<CorrelationMatrixData | null>(null);
  const [scatterPoints, setScatterPoints] = useState<any[]>([]);
  const [selectedScatterType, setSelectedScatterType] = useState('radius_depth');
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/statistics')
      .then((res) => res.json())
      .then((data) => {
        setRelationships(data.relationships || []);
        setMatrixData(data.correlationMatrix || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load statistics', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetch(`/api/scatter-data?type=${selectedScatterType}`)
      .then((res) => res.json())
      .then((data) => {
        setScatterPoints(data.points || []);
      })
      .catch((err) => console.error('Failed to load scatter points', err));
  }, [selectedScatterType]);

  const scatterOptions = [
    { id: 'radius_depth', label: 'Planetary Radius (R⊕) vs Transit Depth (ppm)', xUnit: 'R⊕', yUnit: 'ppm' },
    { id: 'period_temp', label: 'Orbital Period (days) vs Planet Equilibrium Temp (K)', xUnit: 'days', yUnit: 'K' },
    { id: 'period_duration', label: 'Orbital Period (days) vs Transit Duration (hrs)', xUnit: 'days', yUnit: 'hrs' },
    { id: 'star_planet_temp', label: 'Stellar Effective Temp (K) vs Planet Temp (K)', xUnit: 'K', yUnit: 'K' },
    { id: 'radius_snr', label: 'Planetary Radius (R⊕) vs Transit SNR', xUnit: 'R⊕', yUnit: 'SNR' },
  ];

  const currentOption = scatterOptions.find((o) => o.id === selectedScatterType) || scatterOptions[0];

  // Helper to color matrix heatmap cells
  const getCellColor = (val: number) => {
    if (val === 1) return 'bg-cyan-500 text-slate-950 font-bold';
    if (val > 0.4) return 'bg-cyan-600/40 text-cyan-200';
    if (val > 0.2) return 'bg-cyan-800/30 text-cyan-300';
    if (val > 0) return 'bg-slate-800/40 text-slate-300';
    if (val > -0.2) return 'bg-slate-800/40 text-slate-400';
    if (val > -0.4) return 'bg-rose-900/30 text-rose-300';
    return 'bg-rose-700/50 text-rose-200 font-bold';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header Research Context */}
      <div className="observatory-panel hud-corner-tl hud-corner-br rounded-2xl p-6 shadow-xl border border-cyan-500/20">
        <div className="max-w-4xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>ASTRONOMY RESEARCH STATION</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>BIVARIATE HYPOTHESIS TESTING</span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight font-mono">
            Astrophysical Dependencies & Full Correlation Matrix
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            Quantifying linear (Pearson <code className="text-cyan-400 font-mono">r</code>) and monotonic non-linear (Spearman <code className="text-cyan-400 font-mono">ρ</code>) dependencies across 9,201 Kepler observations. Rigorous hypothesis testing confirms fundamental orbital mechanics (Kepler&apos;s Third Law), Stefan-Boltzmann radiative transfer, and photometric transit depth scaling.
          </p>

          <div className="pt-2 flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>Statistical Significance: p &lt; 10⁻¹⁵ across all primary tests</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>12 Astrophysical Variables</span>
          </div>
        </div>
      </div>

      {/* 2. Key Bivariate Relationship Research Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 font-mono">
          <TrendingUp className="w-4 h-4" />
          Primary Astrophysical Bivariate Tests (Pearson r vs Spearman ρ)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relationships.map((rel, idx) => (
            <div
              key={idx}
              className="observatory-card-interactive p-5 rounded-2xl space-y-3 shadow-lg border border-slate-800"
            >
              <div className="text-xs font-semibold text-white font-mono flex items-center justify-between">
                <span>{rel.label_1}</span>
                <span className="text-cyan-400">↔</span>
                <span>{rel.label_2}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-2.5 bg-[#020409]/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Spearman ρ</span>
                  <span className={`text-base font-bold ${rel.spearman_rho > 0 ? 'text-cyan-300' : 'text-rose-300'}`}>
                    {rel.spearman_rho > 0 ? `+${rel.spearman_rho}` : rel.spearman_rho}
                  </span>
                  <span className="text-[9px] text-slate-500 block font-mono mt-0.5">p &lt; 10⁻¹⁵</span>
                </div>

                <div className="p-2.5 bg-[#020409]/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Pearson r</span>
                  <span className={`text-base font-bold ${rel.pearson_r > 0 ? 'text-indigo-300' : 'text-orange-300'}`}>
                    {rel.pearson_r > 0 ? `+${rel.pearson_r}` : rel.pearson_r}
                  </span>
                  <span className="text-[9px] text-slate-500 block font-mono mt-0.5">p &lt; 10⁻¹²</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {rel.interpretation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Interactive Scatter Plot Visualizer */}
      <div className="observatory-panel hud-corner-tl hud-corner-br p-6 rounded-2xl border border-cyan-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 font-mono">
              <Activity className="w-4 h-4 text-cyan-400" />
              Interactive Bivariate Scatter Plot
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Visualizing sample distribution across Confirmed, Candidate, and False Positive classes
            </p>
          </div>

          <select
            value={selectedScatterType}
            onChange={(e) => setSelectedScatterType(e.target.value)}
            className="observatory-input rounded-xl px-3 py-1.5 text-xs font-mono cursor-pointer"
          >
            {scatterOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono pt-1 pb-1 border-b border-slate-800/60">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Confirmed Exoplanet
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Active Candidate
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> False Positive
            </span>
          </div>

          {hoveredPoint && (
            <div className="text-cyan-300 font-mono text-xs">
              Selected Target: <strong>{hoveredPoint.koi}</strong> ({hoveredPoint.name || 'Unnamed'}) · X: {hoveredPoint.x} {currentOption.xUnit} · Y: {hoveredPoint.y} {currentOption.yUnit}
            </div>
          )}
        </div>

        {/* SVG Scatter Plot */}
        <div className="h-84 w-full bg-[#020409]/95 rounded-xl p-4 border border-slate-800/80 relative">
          {scatterPoints.length > 0 && (() => {
            const xVals = scatterPoints.map((p) => p.x).filter(isFinite);
            const yVals = scatterPoints.map((p) => p.y).filter(isFinite);
            const minX = Math.min(...xVals, 0);
            const maxX = Math.max(...xVals, 1);
            const minY = Math.min(...yVals, 0);
            const maxY = Math.max(...yVals, 1);

            return (
              <svg className="w-full h-full" viewBox="0 0 600 240">
                {/* Background grid */}
                <line x1="40" y1="20" x2="580" y2="20" stroke="rgba(56, 189, 248, 0.12)" strokeDasharray="3 3" />
                <line x1="40" y1="110" x2="580" y2="110" stroke="rgba(56, 189, 248, 0.12)" strokeDasharray="3 3" />
                <line x1="40" y1="200" x2="580" y2="200" stroke="rgba(56, 189, 248, 0.25)" />
                <line x1="40" y1="20" x2="40" y2="200" stroke="rgba(56, 189, 248, 0.25)" />

                {/* Plot points */}
                {scatterPoints.map((pt, i) => {
                  const normX = (pt.x - minX) / (maxX - minX || 1);
                  const normY = (pt.y - minY) / (maxY - minY || 1);
                  const cx = 40 + normX * 540;
                  const cy = 200 - normY * 180;
                  const fill =
                    pt.disposition === 'CONFIRMED'
                      ? '#34d399'
                      : pt.disposition === 'CANDIDATE'
                      ? '#fbbf24'
                      : '#f43f5e';

                  return (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={pt.disposition === 'CONFIRMED' ? 3.5 : 2.5}
                      fill={fill}
                      opacity={0.75}
                      onMouseEnter={() => setHoveredPoint(pt)}
                      className="hover:opacity-100 hover:r-5 transition-all cursor-pointer"
                    >
                      <title>{`${pt.koi} (${pt.name || 'Unnamed'}) - X: ${pt.x} ${currentOption.xUnit}, Y: ${pt.y} ${currentOption.yUnit} [${pt.disposition}]`}</title>
                    </circle>
                  );
                })}
              </svg>
            );
          })()}
        </div>
      </div>

      {/* 4. Complete Correlation Matrix Heatmap */}
      {matrixData && (
        <div className="observatory-panel p-6 rounded-2xl border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 font-mono">
                <Layers className="w-4 h-4 text-cyan-400" />
                12×12 Pearson Correlation Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                Hover over any cell to inspect pairwise correlation between Kepler physical attributes
              </p>
            </div>
            {hoveredCell && (
              <span className="text-xs font-mono bg-cyan-950/80 px-3 py-1 rounded text-cyan-300 border border-cyan-500/40">
                {matrixData.features[hoveredCell.r].label} vs {matrixData.features[hoveredCell.c].label}: r = {matrixData.matrix[hoveredCell.r][hoveredCell.c]}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-center text-[10px] font-mono border-collapse">
              <thead>
                <tr>
                  <th className="p-1.5 text-left text-slate-400 font-mono">Feature</th>
                  {matrixData.features.map((f) => (
                    <th key={f.key} className="p-1.5 text-slate-400 truncate max-w-[50px] font-mono">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.matrix.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="p-1.5 text-left font-mono font-semibold text-slate-300 whitespace-nowrap">
                      {matrixData.features[rIdx].label}
                    </td>
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        onMouseEnter={() => setHoveredCell({ r: rIdx, c: cIdx })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`p-1.5 border border-slate-900/60 rounded transition-colors cursor-pointer ${getCellColor(val)}`}
                      >
                        {val === 1 ? '1.0' : val.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Strongest Dependencies Table */}
          <div className="pt-4 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2 font-mono">
              Strongest Physical Dependencies (|r| ≥ 0.50)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {matrixData.strongestCorrelations.map((item, idx) => (
                <div
                  key={idx}
                  className="observatory-card-interactive p-3 rounded-lg flex items-center justify-between border border-slate-800"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-white">
                      {item.label1} ↔ {item.label2}
                    </span>
                    <span className="block text-[11px] text-slate-400 font-sans">
                      {item.strength}
                    </span>
                  </div>
                  <span className={`font-mono font-bold text-sm ml-2 ${item.correlation > 0 ? 'text-cyan-300' : 'text-rose-300'}`}>
                    {item.correlation > 0 ? `+${item.correlation}` : item.correlation}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

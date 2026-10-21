import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Filter,
  Eye,
  Info,
  Globe,
  Radio,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Orbit,
  ArrowUpDown,
  Compass,
  SlidersHorizontal,
} from 'lucide-react';
import { ScreeningCandidate, KeplerRecord } from '../types/kepler';

interface ScreeningTabProps {
  onSelectCandidate: (id: string | number) => void;
  onSelectObservatoryPlanet?: (candidate: KeplerRecord) => void;
}

export const ScreeningTab: React.FC<ScreeningTabProps> = ({
  onSelectCandidate,
  onSelectObservatoryPlanet,
}) => {
  const [candidates, setCandidates] = useState<ScreeningCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<'ALL' | 'High Priority' | 'Medium Priority' | 'Low Priority'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  useEffect(() => {
    setLoading(true);
    fetch('/api/screening')
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data.candidates || []);
        setCounts({
          total: data.totalScreened || 0,
          high: data.highPriorityCount || 0,
          medium: data.mediumPriorityCount || 0,
          low: data.lowPriorityCount || 0,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load screening results', err);
        setLoading(false);
      });
  }, []);

  const filtered = candidates.filter((c) => {
    if (tierFilter !== 'ALL' && c.priority_tier !== tierFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKoi = c.koi_identifier.toLowerCase().includes(q);
      const matchName = (c.official_name || '').toLowerCase().includes(q);
      const matchKepid = String(c.kepler_id).includes(q);
      if (!matchKoi && !matchName && !matchKepid) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Observatory Target Analysis Header Banner */}
      <div className="observatory-panel hud-corner-tl hud-corner-br rounded-2xl p-6 shadow-xl border border-cyan-500/20">
        <div className="max-w-4xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>OBSERVATORY TARGET SCREENING & SPECTROSCOPY QUEUE</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>RANDOM FOREST 200-ESTIMATOR MODEL</span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight font-mono">
            Candidate Prioritization & Astronomical Follow-Up Queue
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            To optimize high-value telescope observation time, the screening pipeline calculates class probabilities across 12 physical transit parameters. The <strong className="text-cyan-300 font-mono">Screening Priority Score</strong> measures cumulative planetary probability: <code className="text-cyan-400 font-mono">P(confirmed) + P(candidate)</code>. Targets with highest scores are scheduled for radial-velocity and transmission spectroscopy follow-up.
          </p>

          <div className="pt-2 flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>50 Top-Ranked Targets</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>P(confirmed) + P(candidate) ≥ 80%</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-amber-400">Screening Metric Only (Not Scientific Confirmation)</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Target Priority Distribution Controls (No thick left borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* All Targets */}
        <button
          onClick={() => setTierFilter('ALL')}
          className={`observatory-card-interactive p-4 rounded-xl text-left cursor-pointer transition-all ${
            tierFilter === 'ALL'
              ? 'border-cyan-400/80 bg-cyan-950/40 glow-cyan-subtle'
              : 'border-slate-800'
          }`}
        >
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider text-[11px]">
            Catalog Queue
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {counts.total} Targets
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            All prioritized KOIs
          </p>
        </button>

        {/* High Priority */}
        <button
          onClick={() => setTierFilter('High Priority')}
          className={`observatory-card-interactive p-4 rounded-xl text-left cursor-pointer transition-all ${
            tierFilter === 'High Priority'
              ? 'border-emerald-400/80 bg-emerald-950/40 glow-emerald-subtle'
              : 'border-slate-800'
          }`}
        >
          <div className="text-xs text-emerald-400 font-mono uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> High Priority (≥ 80%)
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {counts.high} Targets
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Prime candidates for radial velocity
          </p>
        </button>

        {/* Medium Priority */}
        <button
          onClick={() => setTierFilter('Medium Priority')}
          className={`observatory-card-interactive p-4 rounded-xl text-left cursor-pointer transition-all ${
            tierFilter === 'Medium Priority'
              ? 'border-amber-400/80 bg-amber-950/40 glow-amber-subtle'
              : 'border-slate-800'
          }`}
        >
          <div className="text-xs text-amber-400 font-mono uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> Medium (50%–79%)
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {counts.medium} Targets
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Intermediate observational confidence
          </p>
        </button>

        {/* Low Priority */}
        <button
          onClick={() => setTierFilter('Low Priority')}
          className={`observatory-card-interactive p-4 rounded-xl text-left cursor-pointer transition-all ${
            tierFilter === 'Low Priority'
              ? 'border-rose-400/80 bg-rose-950/40 glow-rose-subtle'
              : 'border-slate-800'
          }`}
        >
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Low Priority (&lt; 50%)
          </div>
          <div className="text-2xl font-bold font-mono text-slate-300 mt-1">
            {counts.low} Targets
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            Elevated false-positive likelihood
          </p>
        </button>
      </div>

      {/* 3. Screened Target Analysis Station Table */}
      <div className="observatory-panel rounded-2xl overflow-hidden shadow-2xl border border-cyan-500/20">
        {/* Table Filter & Legend Bar */}
        <div className="p-4 border-b border-slate-800 bg-[#020409]/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter target (e.g. K01408)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 observatory-input rounded-lg text-xs font-mono w-52 placeholder:text-slate-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Showing {filtered.length} targets
            </span>
          </div>

          {/* Tri-color probability legend */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> P(Confirmed)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> P(Candidate)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> P(False Positive)
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3 font-mono">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs tracking-wider text-cyan-400">LOADING SCREENING ANALYSIS ARCHIVE...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            No targets match the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#020409]/95 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Target KOI</th>
                  <th className="py-3 px-4">Official Name</th>
                  <th className="py-3 px-4">Archive Status</th>
                  <th className="py-3 px-4">Priority Score</th>
                  <th className="py-3 px-4 w-44">ML Class Probabilities</th>
                  <th className="py-3 px-4">Radius (R⊕)</th>
                  <th className="py-3 px-4">Period (d)</th>
                  <th className="py-3 px-4">SNR</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item, idx) => (
                  <tr
                    key={item.rowid}
                    onClick={() => onSelectCandidate(item.rowid)}
                    className="hover:bg-cyan-950/20 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 text-slate-500 font-bold font-mono">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-300 font-mono">
                      {item.koi_identifier}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-200">
                      {item.official_name && item.official_name !== 'Unnamed Candidate'
                        ? item.official_name
                        : 'Unnamed Candidate'}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`text-[11px] font-medium ${
                          item.exoplanet_archive_disposition === 'CONFIRMED'
                            ? 'text-emerald-400'
                            : item.exoplanet_archive_disposition === 'CANDIDATE'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {item.exoplanet_archive_disposition}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-cyan-300">
                          {item.screening_priority_score.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.priority_tier}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {/* Tri-color Probability Bar */}
                      <div className="h-2.5 w-full bg-[#020409] rounded-full overflow-hidden flex border border-slate-800 shadow-inner">
                        <div
                          style={{ width: `${(item.probability_confirmed || 0) * 100}%` }}
                          className="bg-emerald-500"
                          title={`Confirmed: ${((item.probability_confirmed || 0) * 100).toFixed(1)}%`}
                        />
                        <div
                          style={{ width: `${(item.probability_candidate || 0) * 100}%` }}
                          className="bg-amber-500"
                          title={`Candidate: ${((item.probability_candidate || 0) * 100).toFixed(1)}%`}
                        />
                        <div
                          style={{ width: `${(item.probability_false_positive || 0) * 100}%` }}
                          className="bg-rose-500"
                          title={`False Positive: ${((item.probability_false_positive || 0) * 100).toFixed(1)}%`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                        <span className="text-emerald-400">{((item.probability_confirmed || 0) * 100).toFixed(0)}%</span>
                        <span className="text-amber-400">{((item.probability_candidate || 0) * 100).toFixed(0)}%</span>
                        <span className="text-rose-400">{((item.probability_false_positive || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {item.planetary_radius_earth_radii} R⊕
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {item.orbital_period_days.toFixed(2)} d
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {item.transit_signal_to_noise_ratio}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectObservatoryPlanet && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectObservatoryPlanet(item);
                            }}
                            className="p-1.5 rounded-lg bg-[#020409] hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-all cursor-pointer"
                            title="Set as Active Planet in 3D Observatory"
                          >
                            <Orbit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidate(item.rowid);
                          }}
                          className="p-1.5 rounded-lg bg-[#020409] border border-slate-800 group-hover:border-cyan-500/50 group-hover:bg-cyan-500 text-slate-400 group-hover:text-slate-950 transition-all cursor-pointer"
                          title="Inspect Candidate Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Scientific Disclaimer & Methodology Architecture */}
      <div className="observatory-panel rounded-2xl p-5 text-xs text-slate-400 space-y-2 border border-slate-800">
        <h4 className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono uppercase text-[11px]">
          <Info className="w-4 h-4 text-cyan-400" />
          Astronomical Screening Caveat & Methodology Notice
        </h4>
        <p className="font-sans leading-relaxed">
          Screening Priority Scores are derived from Random Forest predictive probability estimation to schedule ground-based radial velocity verification and space telescope transmission spectroscopy. An elevated priority score (even 100%) does not constitute empirical scientific confirmation of an exoplanetary system. Confirmation requires formal statistical false-positive probability validation (&lt; 1%) or independent Doppler spectroscopy observations.
        </p>
      </div>
    </div>
  );
};

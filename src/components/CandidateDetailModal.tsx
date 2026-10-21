import React, { useEffect, useState } from 'react';
import {
  X,
  Globe,
  Sun,
  Activity,
  Calendar,
  ShieldCheck,
  Compass,
  Sparkles,
  Info,
  Orbit,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { KeplerRecord, CandidateDetailResponse } from '../types/kepler';

interface CandidateDetailModalProps {
  candidateId: string | number | null;
  onClose: () => void;
  onSelectObservatoryPlanet?: (candidate: KeplerRecord) => void;
  onOpenInTransitStudio?: (candidate: KeplerRecord) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidateId,
  onClose,
  onSelectObservatoryPlanet,
  onOpenInTransitStudio,
}) => {
  const [data, setData] = useState<CandidateDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [justSetAsObservatoryPlanet, setJustSetAsObservatoryPlanet] = useState(false);

  useEffect(() => {
    if (!candidateId) return;
    setLoading(true);
    setJustSetAsObservatoryPlanet(false);
    fetch(`/api/candidates/${candidateId}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load candidate details', err);
        setLoading(false);
      });
  }, [candidateId]);

  if (!candidateId) return null;

  const candidate = data?.candidate;

  // Helper for displaying values with unit or "Unavailable" state
  const formatVal = (val: number | undefined | null, unit: string, decimals = 2): string => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) {
      return 'Unavailable';
    }
    return `${val.toFixed(decimals)} ${unit}`.trim();
  };

  const handleSetObservatory = () => {
    if (candidate && onSelectObservatoryPlanet) {
      onSelectObservatoryPlanet(candidate);
      setJustSetAsObservatoryPlanet(true);
      setTimeout(() => setJustSetAsObservatoryPlanet(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="observatory-panel hud-corner-tl hud-corner-br rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-cyan-500/25">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/15 bg-[#020409]/90 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20">
              <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight font-mono">
                  {loading ? 'ANALYZING TARGET...' : candidate?.official_name || candidate?.koi_identifier}
                </h2>
                {candidate && (
                  <span
                    className={`observatory-badge text-[11px] font-semibold ${
                      candidate.exoplanet_archive_disposition === 'CONFIRMED'
                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 glow-emerald-subtle'
                        : candidate.exoplanet_archive_disposition === 'CANDIDATE'
                        ? 'bg-amber-950/90 text-amber-300 border border-amber-500/60 glow-amber-subtle'
                        : 'bg-rose-950/90 text-rose-300 border border-rose-500/60 glow-rose-subtle'
                    }`}
                  >
                    {candidate.exoplanet_archive_disposition}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 tracking-wider">
                KOI DESIGNATION: <span className="text-cyan-300">{candidate?.koi_identifier}</span> · KEPLER ID: <span className="text-slate-300">{candidate?.kepler_id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {candidate && onSelectObservatoryPlanet && (
              <button
                onClick={handleSetObservatory}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  justSetAsObservatoryPlanet
                    ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500'
                    : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 hover:border-cyan-400'
                }`}
                title="Synchronize this planet with the homepage 3D scene and transit countdown"
              >
                {justSetAsObservatoryPlanet ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Synchronized!</span>
                  </>
                ) : (
                  <>
                    <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Set as Active 3D Planet</span>
                    <span className="sm:hidden">Active 3D</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3 font-mono">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs tracking-wider text-cyan-400">RETRIEVING ASTROPHYSICAL TELEMETRY DOSSIER...</p>
          </div>
        ) : !candidate ? (
          <div className="p-16 text-center text-rose-400 font-mono text-xs">
            TARGET RECORD NOT FOUND IN ARCHIVE.
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Quick Badges & Screening Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Screening Card */}
              <div className="observatory-card-interactive p-4 rounded-xl border-l-2 border-l-cyan-400 space-y-1">
                <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono uppercase text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Screening Priority Score
                </div>
                <div className="text-2xl font-bold text-cyan-300 font-mono">
                  {candidate.screening_priority_score !== undefined
                    ? `${candidate.screening_priority_score.toFixed(1)}%`
                    : 'Not Ranked'}
                </div>
                {candidate.screening_priority_score !== undefined ? (
                  <p className="text-[11px] text-slate-400 font-mono">
                    P(Conf): {(candidate.probability_confirmed! * 100).toFixed(1)}% · P(Cand): {(candidate.probability_candidate! * 100).toFixed(1)}%
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 font-mono">
                    Candidate was not in the top 50 follow-up screening catalogue.
                  </p>
                )}
                <p className="text-[10px] text-slate-500 italic mt-1">
                  * ML prioritization score, not scientific confirmation.
                </p>
              </div>

              {/* Classification Card */}
              <div className="observatory-card-interactive p-4 rounded-xl border-l-2 border-l-indigo-400">
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-mono uppercase text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  Planetary Classification
                </div>
                <div className="text-lg font-bold text-indigo-300 font-mono">
                  {data.classification.planetClass}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Radius: {formatVal(candidate.planetary_radius_earth_radii, 'R⊕', 2)}
                  {candidate.planetary_radius_earth_radii > 0 && ` (${candidate.planetary_radius_earth_radii.toFixed(1)}× Earth)`}
                </p>
              </div>

              {/* Thermal Zone */}
              <div className="observatory-card-interactive p-4 rounded-xl border-l-2 border-l-amber-400">
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-mono uppercase text-[11px]">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Thermal Climate Zone
                </div>
                <div className="text-lg font-bold text-amber-300 font-mono">
                  {data.classification.thermalZone}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  T_eq: {candidate.equilibrium_temperature_k > 0
                    ? `${candidate.equilibrium_temperature_k} K (~${(candidate.equilibrium_temperature_k - 273.15).toFixed(0)}°C)`
                    : 'Unavailable'}
                </p>
              </div>
            </div>

            {/* Light Curve Simulation */}
            <div className="observatory-panel p-5 rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                    Synthetic Transit Photometry Light Curve
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Transit Depth: <strong className="text-cyan-300">{candidate.transit_depth_ppm.toLocaleString()} ppm</strong> ({((candidate.transit_depth_ppm / 1000000) * 100).toFixed(4)}% dip)
                </span>
              </div>

              {/* SVG Light Curve Graph */}
              <div className="h-44 w-full bg-[#020409]/90 rounded-lg p-2 border border-slate-800/80 relative">
                <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="500" y2="70" stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="3 3" />
                  <line x1="250" y1="0" x2="250" y2="120" stroke="rgba(56, 189, 248, 0.2)" strokeDasharray="3 3" />

                  {/* Flux Curve */}
                  {data.lightCurve && data.lightCurve.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      points={data.lightCurve
                        .map((pt, idx) => {
                          const x = (idx / (data.lightCurve.length - 1)) * 500;
                          const minF = 1.0 - (candidate.transit_depth_ppm / 1e6) * 1.1;
                          const normY = Math.max(0, Math.min(1, (pt.flux - minF) / (1.0005 - minF)));
                          const y = 100 - normY * 80;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ')}
                    />
                  )}
                </svg>
                <div className="absolute top-2 left-3 text-[10px] text-slate-400 font-mono">
                  Baseline Flux: 1.0000
                </div>
                <div className="absolute bottom-2 left-3 text-[10px] text-cyan-400 font-mono">
                  Transit Dip: {(1 - candidate.transit_depth_ppm / 1e6).toFixed(5)}
                </div>
                <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono">
                  Duration: {candidate.transit_duration_hours} hrs
                </div>
              </div>
            </div>

            {/* Astrophysical Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Planetary & Orbit */}
              <div className="observatory-panel p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-mono">
                  <Globe className="w-3.5 h-3.5" /> Planetary & Orbital Parameters
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Orbital Period</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatVal(candidate.orbital_period_days, 'days', 4)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Planetary Radius</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatVal(candidate.planetary_radius_earth_radii, 'R⊕', 2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Equilibrium Temp</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatVal(candidate.equilibrium_temperature_k, 'K', 0)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Insolation Flux</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatVal(candidate.insolation_flux, 'S⊕', 2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Transit Duration</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatVal(candidate.transit_duration_hours, 'hours', 2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Transit Depth</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatVal(candidate.transit_depth_ppm, 'ppm', 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Host Star & Signal */}
              <div className="observatory-panel p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-mono">
                  <Sun className="w-3.5 h-3.5" /> Host Star & Detection Signal
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Stellar Temp</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatVal(candidate.stellar_effective_temperature_k, 'K', 0)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Stellar Radius</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatVal(candidate.stellar_radius_solar_radii, 'R☉', 2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Surface Gravity log(g)</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatVal(candidate.stellar_surface_gravity_log10, '', 3)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Kepler Magnitude</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatVal(candidate.kepler_band_magnitude, 'mag', 2)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Signal-to-Noise (SNR)</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatVal(candidate.transit_signal_to_noise_ratio, '', 1)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-mono">Impact Parameter (b)</span>
                    <span className="font-mono font-medium text-slate-200">
                      {formatVal(candidate.impact_parameter, '', 3)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Predicted Transits with Real Dynamic Calculation */}
            {data.upcomingTransits && data.upcomingTransits.length > 0 && (
              <div className="observatory-panel p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5" /> Upcoming Predicted Transits (Live Ephemeris: t_n = t_0 + n × P)
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Baseline Epoch t₀: {candidate.transit_epoch_bkjd.toFixed(4)} BKJD
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  {data.upcomingTransits.map((tr) => (
                    <div
                      key={tr.transitNumber}
                      className="p-2.5 rounded-lg bg-[#020409]/80 border border-slate-800/80 text-center"
                    >
                      <span className="text-slate-400 block text-[10px] font-mono">
                        Transit #{tr.transitNumber}
                      </span>
                      <span className="font-bold text-cyan-300 font-mono text-sm block mt-0.5">
                        +{tr.daysFromNow} d
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        BKJD {tr.predictedBkjd}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 font-mono text-xs">
              <div className="text-[11px] text-slate-500">
                DR25 Kepler Cleaned Archive Record · 9,201 KOI Mission Catalogue
              </div>

              <div className="flex items-center gap-2">
                {onOpenInTransitStudio && (
                  <button
                    onClick={() => {
                      onOpenInTransitStudio(candidate);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Simulate in Transit Studio</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

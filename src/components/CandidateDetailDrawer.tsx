import React, { useEffect, useState } from 'react';
import {
  X,
  Globe,
  Sun,
  Activity,
  Calendar,
  Sparkles,
  Orbit,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeplerRecord, CandidateDetailResponse } from '../types/kepler';

interface CandidateDetailDrawerProps {
  candidateId: string | number | null;
  onClose: () => void;
  onSelectObservatoryPlanet?: (candidate: KeplerRecord) => void;
  onOpenInTransitStudio?: (candidate: KeplerRecord) => void;
}

export const CandidateDetailDrawer: React.FC<CandidateDetailDrawerProps> = ({
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

  // Helper for displaying values with unit or "Unavailable" state
  const formatVal = (val: number | undefined | null, unit: string, decimals = 2): string => {
    if (val === undefined || val === null || isNaN(val) || val <= 0) {
      return 'Unavailable';
    }
    return `${val.toFixed(decimals)} ${unit}`.trim();
  };

  const candidate = data?.candidate;

  const handleSetObservatory = () => {
    if (candidate && onSelectObservatoryPlanet) {
      onSelectObservatoryPlanet(candidate);
      setJustSetAsObservatoryPlanet(true);
      setTimeout(() => setJustSetAsObservatoryPlanet(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      {candidateId && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
          />

          {/* Slide-Over Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 360 }}
              className="w-screen max-w-xl md:max-w-2xl bg-[#050811]/95 backdrop-blur-2xl border-l border-cyan-500/25 shadow-2xl flex flex-col h-full text-slate-100 font-sans"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-cyan-500/15 bg-[#03060d]/90 sticky top-0 z-20 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20 shrink-0">
                    <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-mono">
                        {loading ? 'ANALYZING TARGET...' : candidate?.official_name || candidate?.koi_identifier}
                      </h2>
                      {candidate && (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold font-mono tracking-wider ${
                            candidate.exoplanet_archive_disposition === 'CONFIRMED'
                              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                              : candidate.exoplanet_archive_disposition === 'CANDIDATE'
                              ? 'bg-amber-950/90 text-amber-300 border border-amber-500/60'
                              : 'bg-rose-950/90 text-rose-300 border border-rose-500/60'
                          }`}
                        >
                          {candidate.exoplanet_archive_disposition}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 tracking-wider">
                      KOI: <span className="text-cyan-300">{candidate?.koi_identifier}</span> · KEPLER ID: <span className="text-slate-300">{candidate?.kepler_id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                    aria-label="Close drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Action Banner Strip */}
              {candidate && onSelectObservatoryPlanet && (
                <div className="px-5 sm:px-6 py-2.5 bg-cyan-950/30 border-b border-cyan-500/15 flex items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-slate-400 text-[11px]">
                    Synchronize this exoplanet across the application
                  </span>
                  <button
                    onClick={handleSetObservatory}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      justSetAsObservatoryPlanet
                        ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 hover:border-cyan-400'
                    }`}
                  >
                    {justSetAsObservatoryPlanet ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Synchronized to 3D Orbit!</span>
                      </>
                    ) : (
                      <>
                        <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Set Active in 3D Scene</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {loading ? (
                  <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3 font-mono">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs tracking-wider text-cyan-400">RETRIEVING ASTROPHYSICAL TELEMETRY DOSSIER...</p>
                  </div>
                ) : !candidate ? (
                  <div className="py-24 text-center text-rose-400 font-mono text-xs">
                    TARGET RECORD NOT FOUND IN ARCHIVE.
                  </div>
                ) : (
                  <>
                    {/* Quick Badges & Classification Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Screening Card */}
                      <div className="p-3.5 rounded-xl bg-[#090d18] border border-cyan-500/20 space-y-1">
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono uppercase">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          Screening Score
                        </div>
                        <div className="text-2xl font-bold text-cyan-300 font-mono">
                          {candidate.screening_priority_score !== undefined
                            ? `${candidate.screening_priority_score.toFixed(1)}%`
                            : 'Not Ranked'}
                        </div>
                        {candidate.screening_priority_score !== undefined && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            P(Conf): {(candidate.probability_confirmed! * 100).toFixed(1)}% · P(Cand): {(candidate.probability_candidate! * 100).toFixed(1)}%
                          </p>
                        )}
                        <p className="text-[9px] text-slate-500 italic">
                          * Random Forest follow-up priority score
                        </p>
                      </div>

                      {/* Classification Card */}
                      <div className="p-3.5 rounded-xl bg-[#090d18] border border-indigo-500/20 space-y-1">
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono uppercase">
                          <Globe className="w-3.5 h-3.5 text-indigo-400" />
                          Classification
                        </div>
                        <div className="text-base font-bold text-indigo-300 font-mono leading-tight">
                          {data?.classification.planetClass || 'Exoplanet'}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Radius: {formatVal(candidate.planetary_radius_earth_radii, 'R⊕', 2)}
                        </p>
                      </div>

                      {/* Thermal Zone */}
                      <div className="p-3.5 rounded-xl bg-[#090d18] border border-amber-500/20 space-y-1">
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono uppercase">
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          Climate Zone
                        </div>
                        <div className="text-base font-bold text-amber-300 font-mono leading-tight">
                          {data?.classification.thermalZone || 'Torrid Zone'}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          T_eq: {candidate.equilibrium_temperature_k > 0 ? `${candidate.equilibrium_temperature_k} K` : 'Unavailable'}
                        </p>
                      </div>
                    </div>

                    {/* Synthetic Light Curve Visualizer */}
                    <div className="p-4 rounded-xl bg-[#080c16] border border-cyan-500/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Mandel-Agol Photometric Light Curve</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          Depth: <strong className="text-cyan-300">{candidate.transit_depth_ppm.toLocaleString()} ppm</strong>
                        </span>
                      </div>

                      <div className="h-36 w-full bg-[#020409] rounded-lg p-2 border border-slate-800/80 relative">
                        <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                          <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="3 3" />
                          <line x1="0" y1="70" x2="500" y2="70" stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="3 3" />
                          <line x1="250" y1="0" x2="250" y2="120" stroke="rgba(56, 189, 248, 0.2)" strokeDasharray="3 3" />

                          {data?.lightCurve && data.lightCurve.length > 1 && (
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
                          Flux Baseline: 1.0000
                        </div>
                        <div className="absolute bottom-2 left-3 text-[10px] text-cyan-400 font-mono">
                          Dip: {(1 - candidate.transit_depth_ppm / 1e6).toFixed(5)}
                        </div>
                        <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono">
                          Duration: {candidate.transit_duration_hours} hrs
                        </div>
                      </div>
                    </div>

                    {/* Full Astrophysical Parameters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* Planetary Properties */}
                      <div className="p-4 rounded-xl bg-[#080c16] border border-slate-800 space-y-2.5">
                        <h4 className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" /> Planetary Orbit
                        </h4>
                        <div className="space-y-1.5 font-mono">
                          <div className="flex justify-between py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Orbital Period:</span>
                            <span className="text-slate-200">{formatVal(candidate.orbital_period_days, 'days', 4)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Planet Radius:</span>
                            <span className="text-slate-200">{formatVal(candidate.planetary_radius_earth_radii, 'R⊕', 2)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Equilibrium Temp:</span>
                            <span className="text-slate-200">{formatVal(candidate.equilibrium_temperature_k, 'K', 0)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Insolation Flux:</span>
                            <span className="text-slate-200">{formatVal(candidate.insolation_flux, 'S⊕', 2)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Transit Duration:</span>
                            <span className="text-slate-200">{formatVal(candidate.transit_duration_hours, 'hrs', 2)}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400">Transit Depth:</span>
                            <span className="text-slate-200">{formatVal(candidate.transit_depth_ppm, 'ppm', 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stellar Host Properties */}
                      <div className="p-4 rounded-xl bg-[#080c16] border border-slate-800 space-y-2.5">
                        <h4 className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5" /> Host Star Properties
                        </h4>
                        <div className="space-y-1.5 font-mono">
                          <div className="flex justify-between py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Effective Temp:</span>
                            <span className="text-slate-200">{formatVal(candidate.stellar_effective_temperature_k, 'K', 0)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Stellar Radius:</span>
                            <span className="text-slate-200">{formatVal(candidate.stellar_radius_solar_radii, 'R☉', 2)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Surface Gravity log(g):</span>
                            <span className="text-slate-200">{formatVal(candidate.stellar_surface_gravity_log10, '', 3)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Kepler Mag:</span>
                            <span className="text-slate-200">{formatVal(candidate.kepler_band_magnitude, 'mag', 2)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Transit SNR:</span>
                            <span className="text-slate-200">{formatVal(candidate.transit_signal_to_noise_ratio, '', 1)}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400">Impact Param (b):</span>
                            <span className="text-slate-200">{formatVal(candidate.impact_parameter, '', 3)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Upcoming Transits (Live Ephemeris) */}
                    {data?.upcomingTransits && data.upcomingTransits.length > 0 && (
                      <div className="p-4 rounded-xl bg-[#080c16] border border-indigo-500/20 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Predicted Transits (Live Ephemeris)</span>
                          </div>
                          <span className="text-slate-400 text-[10px]">
                            t₀: {candidate.transit_epoch_bkjd.toFixed(2)} BKJD
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          {data.upcomingTransits.map((tr) => (
                            <div
                              key={tr.transitNumber}
                              className="p-2 rounded-lg bg-[#020409]/90 border border-slate-800 text-center"
                            >
                              <span className="text-slate-400 block text-[10px] font-mono">
                                Transit #{tr.transitNumber}
                              </span>
                              <span className="font-bold text-cyan-300 font-mono text-xs block mt-0.5">
                                +{tr.daysFromNow} d
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                BKJD {tr.predictedBkjd}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Drawer Footer with Actions */}
              <div className="p-4 sm:p-5 border-t border-cyan-500/15 bg-[#03060d]/90 flex items-center justify-between gap-3 text-xs font-mono">
                <span className="text-slate-500 text-[11px] hidden sm:inline">
                  Kepler DR25 Archive Record
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {candidate && onOpenInTransitStudio && (
                    <button
                      onClick={() => {
                        onOpenInTransitStudio(candidate);
                        onClose();
                      }}
                      className="px-3 py-2 bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Open in Transit Studio</span>
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

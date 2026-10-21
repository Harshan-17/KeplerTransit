import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Clock,
  Search,
  Sparkles,
  X,
  Globe,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ArrowRight,
  Orbit,
} from 'lucide-react';
import { KeplerRecord, TransitTelemetry } from '../types/kepler';

export type FeaturedTransitData = TransitTelemetry;

interface TransitCountdownProps {
  activeTransit: FeaturedTransitData | null;
  featuredList: FeaturedTransitData[];
  onSelectTransit: (item: FeaturedTransitData) => void;
  onSelectCandidateId?: (id: string | number) => void;
  onExploreFilter?: (preset: string) => void;
}

export const TransitCountdown: React.FC<TransitCountdownProps> = ({
  activeTransit,
  featuredList,
  onSelectTransit,
  onSelectCandidateId,
  onExploreFilter,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
    isCurrent: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
    isCurrent: false,
  });

  // Archive Quick Planet Search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KeplerRecord[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activeTransit) return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const target = activeTransit.targetTimestampMs || now;
      const durationMs = (activeTransit.transitDurationHours || 2.5) * 3600000;
      const halfDurMs = durationMs / 2;

      // Status is strictly in-progress if within [target - halfDur, target + halfDur]
      const diffToCenter = target - now;
      const isInProgress = Math.abs(diffToCenter) <= halfDurMs;

      if (isInProgress) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalMs: 0,
          isCurrent: true,
        });
      } else {
        const remaining = Math.max(0, diffToCenter > 0 ? diffToCenter : 0);
        const days = Math.floor(remaining / 86400000);
        const hours = Math.floor((remaining % 86400000) / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          totalMs: remaining,
          isCurrent: false,
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [activeTransit]);

  // Handle archive search
  useEffect(() => {
    if (!isSearchOpen) return;

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        pageSize: '10',
      });
      fetch(`/api/candidates?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.data || []);
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, isSearchOpen]);

  const handleSelectFromSearch = async (cand: KeplerRecord) => {
    try {
      const res = await fetch(`/api/candidates/${cand.rowid}`);
      const data = await res.json();
      if (data.nextTransit) {
        onSelectTransit(data.nextTransit);
      }
    } catch (err) {
      console.error('Failed to select searched planet', err);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  if (!activeTransit) {
    return (
      <div className="py-6 text-center text-slate-400 select-none animate-pulse">
        <Clock className="w-6 h-6 text-cyan-500/70 mx-auto mb-2 animate-spin-slow" />
        <p className="text-xs font-mono tracking-widest uppercase text-cyan-300">
          Synchronizing Kepler Barycentric Ephemeris...
        </p>
      </div>
    );
  }

  const {
    candidate,
    orbitalPeriodDays,
    transitDepthPpm,
    transitDurationHours,
    targetBKJD,
    targetDateIso,
    transitNumber,
  } = activeTransit;

  const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

  let formattedDate = 'Calculated Target Date';
  try {
    formattedDate = new Date(targetDateIso).toUTCString();
  } catch {}

  const fluxDropPercent = ((transitDepthPpm / 1000000) * 100).toFixed(4);

  const isCandidateInFeatured = featuredList.some(
    (item) => item.candidate.koi_identifier === candidate.koi_identifier
  );

  // Approximate cycle completion progress (0% to 100%)
  const cyclePeriodMs = (orbitalPeriodDays || 10) * 86400000;
  const cycleRemainingMs = timeLeft.totalMs;
  const cycleProgressPercent = Math.max(
    5,
    Math.min(95, 100 - (cycleRemainingMs / cyclePeriodMs) * 100)
  );

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 1. Sleek Floating Target Selector Bar (Unboxed & Centered) */}
      <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mb-3 max-w-4xl">
        <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-slate-400 mr-1 flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          Target:
        </span>

        {/* Dynamic active target button if selected from search/explorer */}
        {!isCandidateInFeatured && (
          <button
            onClick={() => onSelectTransit(activeTransit)}
            className="px-3 py-1 rounded-lg text-xs font-mono bg-cyan-500/25 text-cyan-200 border border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.35)] font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
            <span>{candidate.official_name || candidate.koi_identifier}</span>
          </button>
        )}

        {featuredList.map((item) => {
          const isSelected = item.candidate.koi_identifier === candidate.koi_identifier;
          return (
            <button
              key={item.candidate.koi_identifier}
              onClick={() => onSelectTransit(item)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/80 shadow-[0_0_18px_rgba(56,189,248,0.3)] font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-200 bg-[#020409]/60 hover:bg-[#020409]/90 border border-slate-800 backdrop-blur-md'
              }`}
            >
              {item.candidate.official_name && item.candidate.official_name !== 'Unnamed Candidate'
                ? item.candidate.official_name
                : item.candidate.koi_identifier}
            </button>
          );
        })}

        {/* Quick Search Selector Button for all 9,201 Kepler Objects */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="px-3 py-1 rounded-lg text-xs font-mono text-cyan-300 hover:text-cyan-100 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 backdrop-blur-md flex items-center gap-1 cursor-pointer transition-all shadow-sm"
          title="Search all 9,201 Kepler objects"
        >
          <Search className="w-3 h-3 text-cyan-400" />
          <span>Select Any Target (9,201)...</span>
        </button>
      </div>

      {/* 2. Quick Search Modal for 9,201 Kepler Archive */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="observatory-panel hud-corner-tl hud-corner-br rounded-2xl w-full max-w-lg p-5 border border-cyan-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Select Kepler Observatory Target
                </h3>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Type planet name (e.g. Kepler-22 b), KOI (K01408), or Kepler ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-cyan-500/30 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 font-mono text-xs">
              {searchLoading ? (
                <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Querying Kepler mission catalog...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  {searchQuery ? 'No Kepler objects match query.' : 'Type a designation to search 9,201 objects.'}
                </div>
              ) : (
                searchResults.map((cand) => (
                  <button
                    key={cand.rowid}
                    onClick={() => handleSelectFromSearch(cand)}
                    className="w-full px-3 py-2 rounded-lg bg-[#020409]/70 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-left transition-colors cursor-pointer group"
                  >
                    <div>
                      <span className="font-bold text-slate-200 group-hover:text-cyan-300">
                        {cand.official_name || cand.koi_identifier}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {cand.koi_identifier} · {cand.planetary_radius_earth_radii} R⊕ · {cand.orbital_period_days.toFixed(2)} d
                      </span>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold ${
                        cand.exoplanet_archive_disposition === 'CONFIRMED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : cand.exoplanet_archive_disposition === 'CANDIDATE'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {cand.exoplanet_archive_disposition}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Center-Aligned Monumental Observatory Telemetry Console Dock */}
      <div className="w-full max-w-4xl mx-auto observatory-panel hud-corner-tl hud-corner-br rounded-3xl p-5 sm:p-7 border border-cyan-500/25 shadow-[0_12px_45px_rgba(0,0,0,0.65)] backdrop-blur-2xl bg-[#020409]/90 relative overflow-hidden flex flex-col items-center text-center">
        {/* Ambient Breathing Nebula Glow Behind Center Countdown */}
        <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
          <div className="w-[80%] h-[75%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.18)_0%,rgba(99,102,241,0.08)_50%,transparent_75%)] animate-timer-glow" />
        </div>

        {/* Top Header Row: Target Identity & Key Astrophysical Metrics (Centered) */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cyan-500/15">
          {/* Target Identity & Badge */}
          <div className="flex items-center flex-wrap gap-2 text-left">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              TARGET OBJECT
            </span>
            <span
              className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold shadow-sm ${
                candidate.exoplanet_archive_disposition === 'CONFIRMED'
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 glow-emerald-subtle'
                  : candidate.exoplanet_archive_disposition === 'CANDIDATE'
                  ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50 glow-amber-subtle'
                  : 'bg-rose-950/90 text-rose-300 border border-rose-500/50 glow-rose-subtle'
              }`}
            >
              {candidate.exoplanet_archive_disposition}
            </span>

            <div className="flex items-baseline gap-2">
              <h2 className="text-lg sm:text-xl font-black font-mono text-white tracking-tight">
                {candidate.official_name || candidate.koi_identifier}
              </h2>
              <span className="text-xs font-mono text-cyan-400">
                {candidate.koi_identifier}
              </span>
            </div>
          </div>

          {/* Quick Metrics & Inspect Trigger */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-3 text-[11px] text-slate-300">
              <span>
                Radius: <strong className="text-white">{candidate.planetary_radius_earth_radii > 0 ? `${candidate.planetary_radius_earth_radii} R⊕` : 'N/A'}</strong>
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span>
                Period: <strong className="text-cyan-300">{orbitalPeriodDays > 0 ? `${orbitalPeriodDays.toFixed(2)} d` : 'N/A'}</strong>
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span>
                Depth: <strong className="text-emerald-300">{transitDepthPpm.toLocaleString()} ppm</strong>
              </span>
            </div>

            {onSelectCandidateId && (
              <button
                onClick={() => onSelectCandidateId(candidate.rowid)}
                className="px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer transition-all hover:border-cyan-400"
                title="Inspect Candidate Profile"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect</span>
              </button>
            )}
          </div>
        </div>

        {/* Centerpiece: Monumental Big Countdown Timer with Futuristic Animations */}
        <div className="py-4 sm:py-6 w-full flex flex-col items-center justify-center space-y-4">
          {/* Centered Telemetry Status & Animated Radar Beacon */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#030712]/80 border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
            <div className="relative flex items-center justify-center w-2.5 h-2.5">
              <span
                className={`absolute w-full h-full rounded-full animate-radar-beacon ${
                  timeLeft.isCurrent ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
              />
              <span
                className={`w-2 h-2 rounded-full relative z-10 ${
                  timeLeft.isCurrent
                    ? 'bg-amber-300 shadow-[0_0_10px_#f59e0b]'
                    : 'bg-cyan-300 shadow-[0_0_10px_#38bdf8]'
                }`}
              />
            </div>

            <span className="font-semibold tracking-wider uppercase text-[11px] sm:text-xs">
              {timeLeft.isCurrent ? 'TRANSIT OCCULTATION IN PROGRESS' : 'NEXT PREDICTED KEPLER TRANSIT'}
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-slate-300 text-[11px]">Orbit #{transitNumber || 1049}</span>
          </div>

          {timeLeft.isCurrent ? (
            /* Transit Occultation Active State */
            <div className="py-6 px-8 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-center animate-pulse shadow-[0_0_35px_rgba(245,158,11,0.25)]">
              <div className="text-3xl sm:text-5xl lg:text-6xl font-black font-mono tracking-widest text-amber-300 drop-shadow-[0_0_25px_rgba(251,191,36,0.65)]">
                TRANSIT ACTIVE
              </div>
              <div className="text-xs sm:text-sm text-amber-200/90 font-mono mt-2">
                Planet crossing stellar disc · Photometric flux drop ΔF/F ≈ {fluxDropPercent}%
              </div>
            </div>
          ) : (
            /* Big Monumental Centered Countdown Timer Units */
            <div className="relative flex items-center justify-center gap-2 sm:gap-4 md:gap-5 font-mono">
              {/* Days Tile */}
              <div className="flex flex-col items-center justify-center min-w-[72px] sm:min-w-[94px] md:min-w-[116px] lg:min-w-[130px] p-2.5 sm:p-4 rounded-2xl bg-[#030712]/90 border border-cyan-500/30 shadow-[0_0_25px_rgba(56,189,248,0.2)] relative overflow-hidden group hover:border-cyan-400 transition-all">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
                <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.45)]">
                  {pad(timeLeft.days)}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-widest mt-2">
                  DAYS
                </span>
              </div>

              {/* Pulsating Glowing Separator */}
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-cyan-400 font-mono -mt-5 animate-pulse drop-shadow-[0_0_12px_rgba(56,189,248,0.8)] select-none">
                :
              </span>

              {/* Hours Tile */}
              <div className="flex flex-col items-center justify-center min-w-[72px] sm:min-w-[94px] md:min-w-[116px] lg:min-w-[130px] p-2.5 sm:p-4 rounded-2xl bg-[#030712]/90 border border-cyan-500/30 shadow-[0_0_25px_rgba(56,189,248,0.2)] relative overflow-hidden group hover:border-cyan-400 transition-all">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
                <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-cyan-200 tracking-tight leading-none drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]">
                  {pad(timeLeft.hours)}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-widest mt-2">
                  HRS
                </span>
              </div>

              {/* Pulsating Glowing Separator */}
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-cyan-400 font-mono -mt-5 animate-pulse drop-shadow-[0_0_12px_rgba(56,189,248,0.8)] select-none">
                :
              </span>

              {/* Minutes Tile */}
              <div className="flex flex-col items-center justify-center min-w-[72px] sm:min-w-[94px] md:min-w-[116px] lg:min-w-[130px] p-2.5 sm:p-4 rounded-2xl bg-[#030712]/90 border border-cyan-500/30 shadow-[0_0_25px_rgba(56,189,248,0.2)] relative overflow-hidden group hover:border-cyan-400 transition-all">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
                <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-cyan-200 tracking-tight leading-none drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]">
                  {pad(timeLeft.minutes)}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-widest mt-2">
                  MIN
                </span>
              </div>

              {/* Pulsating Glowing Separator */}
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-indigo-400 font-mono -mt-5 animate-pulse drop-shadow-[0_0_12px_rgba(129,140,248,0.8)] select-none">
                :
              </span>

              {/* Seconds Tile with Second-Tick Flash & Pulse */}
              <div className="flex flex-col items-center justify-center min-w-[72px] sm:min-w-[94px] md:min-w-[116px] lg:min-w-[130px] p-2.5 sm:p-4 rounded-2xl bg-[#030712]/90 border border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.25)] relative overflow-hidden group hover:border-indigo-400 transition-all">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-90" />
                <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-indigo-100 tracking-tight leading-none drop-shadow-[0_0_25px_rgba(129,140,248,0.6)]">
                  {pad(timeLeft.seconds)}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-indigo-300 font-bold uppercase tracking-widest mt-2">
                  SEC
                </span>
              </div>
            </div>
          )}

          {/* Animated Orbital Transit Cycle Progress Bar */}
          <div className="w-full max-w-xl mx-auto space-y-1.5 pt-1">
            <div className="relative w-full h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-1000"
                style={{ width: `${cycleProgressPercent}%` }}
              />
              {/* Traveling Photon Streamer Beam */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-orbital-stream pointer-events-none" />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>ORBITAL CYCLE PHASE</span>
              <span className="text-cyan-400 font-semibold">{cycleProgressPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* Centered Astrophysical Telemetry Footnote */}
          <div className="text-[11px] sm:text-xs font-mono text-slate-300 flex items-center justify-center flex-wrap gap-2.5 pt-1">
            <span>
              Target BKJD: <strong className="text-white font-bold">{targetBKJD.toFixed(3)}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>
              Duration: <strong className="text-cyan-300 font-bold">{transitDurationHours.toFixed(1)}h</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="hidden sm:inline">
              Transit Depth: <strong className="text-emerald-300 font-bold">{transitDepthPpm.toLocaleString()} ppm</strong> ({fluxDropPercent}%)
            </span>
            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
            <span className="text-slate-400">{formattedDate}</span>
          </div>
        </div>

        {/* Bottom Actions Row: Symmetrically Centered Navigation Controls */}
        <div className="w-full pt-4 border-t border-cyan-500/15 flex items-center justify-center flex-wrap gap-3">
          {onExploreFilter && (
            <button
              onClick={() => onExploreFilter('EARTH_LIKE')}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_25px_rgba(56,189,248,0.6)] flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Explore 9,201 Objects</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {onSelectCandidateId && (
            <button
              onClick={() => onSelectCandidateId(candidate.rowid)}
              className="px-5 py-2.5 rounded-xl bg-[#030712]/90 hover:bg-slate-900 text-slate-200 hover:text-white border border-slate-800 hover:border-cyan-500/50 font-mono text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg transform hover:-translate-y-0.5"
            >
              <span>Full Telemetry Sheet</span>
              <Eye className="w-4 h-4 text-cyan-400" />
            </button>
          )}

          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 hover:text-cyan-100 border border-cyan-500/30 hover:border-cyan-400/60 font-mono text-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Switch Target</span>
          </button>
        </div>
      </div>
    </div>
  );
};

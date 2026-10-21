import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  Sun,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  RotateCcw,
  Orbit,
  AlertCircle,
  Activity,
  SlidersHorizontal,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { KeplerRecord } from '../types/kepler';

interface ExplorerTabProps {
  initialFilter?: string | null;
  onSelectCandidate: (id: string | number) => void;
  onSelectObservatoryPlanet?: (candidate: KeplerRecord) => void;
}

export const ExplorerTab: React.FC<ExplorerTabProps> = ({
  initialFilter,
  onSelectCandidate,
  onSelectObservatoryPlanet,
}) => {
  const [candidates, setCandidates] = useState<KeplerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFor3DId, setSelectedFor3DId] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [disposition, setDisposition] = useState('ALL');
  const [minRadius, setMinRadius] = useState<number | ''>('');
  const [maxRadius, setMaxRadius] = useState<number | ''>('');
  const [minPeriod, setMinPeriod] = useState<number | ''>('');
  const [maxPeriod, setMaxPeriod] = useState<number | ''>('');
  const [minTemp, setMinTemp] = useState<number | ''>('');
  const [maxTemp, setMaxTemp] = useState<number | ''>('');
  const [minDepth, setMinDepth] = useState<number | ''>('');
  const [maxDepth, setMaxDepth] = useState<number | ''>('');
  const [minDuration, setMinDuration] = useState<number | ''>('');
  const [maxDuration, setMaxDuration] = useState<number | ''>('');
  const [minSnr, setMinSnr] = useState<number | ''>('');
  const [maxSnr, setMaxSnr] = useState<number | ''>('');
  const [onlyScreened, setOnlyScreened] = useState(false);

  const [sortBy, setSortBy] = useState('rowid');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Quick preset handlers
  const applyPreset = (preset: 'EARTH_LIKE' | 'SUPER_EARTHS' | 'HOT_JUPITERS' | 'HIGH_PRIORITY') => {
    handleResetFilters();
    if (preset === 'EARTH_LIKE') {
      setMaxRadius(1.5);
      setMinTemp(200);
      setMaxTemp(350);
      setSortBy('planetary_radius_earth_radii');
      setSortOrder('asc');
    } else if (preset === 'SUPER_EARTHS') {
      setMinRadius(1.25);
      setMaxRadius(2.0);
      setSortBy('planetary_radius_earth_radii');
      setSortOrder('asc');
    } else if (preset === 'HOT_JUPITERS') {
      setMinRadius(8.0);
      setMaxPeriod(10.0);
      setMinTemp(900);
      setSortBy('planetary_radius_earth_radii');
      setSortOrder('desc');
    } else if (preset === 'HIGH_PRIORITY') {
      setDisposition('CANDIDATE');
      setOnlyScreened(true);
      setSortBy('screening_priority_score');
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Apply initial preset if specified
  useEffect(() => {
    if (initialFilter === 'EARTH_LIKE') {
      applyPreset('EARTH_LIKE');
    } else if (initialFilter === 'HIGH_PRIORITY') {
      applyPreset('HIGH_PRIORITY');
    }
  }, [initialFilter]);

  const fetchData = () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortOrder,
    });

    if (search.trim()) params.set('search', search.trim());
    if (disposition !== 'ALL') params.set('disposition', disposition);
    if (minRadius !== '') params.set('minRadius', String(minRadius));
    if (maxRadius !== '') params.set('maxRadius', String(maxRadius));
    if (minPeriod !== '') params.set('minPeriod', String(minPeriod));
    if (maxPeriod !== '') params.set('maxPeriod', String(maxPeriod));
    if (minTemp !== '') params.set('minTemp', String(minTemp));
    if (maxTemp !== '') params.set('maxTemp', String(maxTemp));
    if (minDepth !== '') params.set('minDepth', String(minDepth));
    if (maxDepth !== '') params.set('maxDepth', String(maxDepth));
    if (minDuration !== '') params.set('minDuration', String(minDuration));
    if (maxDuration !== '') params.set('maxDuration', String(maxDuration));
    if (minSnr !== '') params.set('minSnr', String(minSnr));
    if (maxSnr !== '') params.set('maxSnr', String(maxSnr));
    if (onlyScreened) params.set('onlyScreened', 'true');

    fetch(`/api/candidates?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setCandidates(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch candidates', err);
        setError('Failed to query Kepler dataset. Please check your network and retry.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, disposition, sortBy, sortOrder, onlyScreened]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDisposition('ALL');
    setMinRadius('');
    setMaxRadius('');
    setMinPeriod('');
    setMaxPeriod('');
    setMinTemp('');
    setMaxTemp('');
    setMinDepth('');
    setMaxDepth('');
    setMinDuration('');
    setMaxDuration('');
    setMinSnr('');
    setMaxSnr('');
    setOnlyScreened(false);
    setSortBy('rowid');
    setSortOrder('asc');
    setPage(1);
  };

  const handleSelectObservatory = (cand: KeplerRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectObservatoryPlanet) {
      onSelectObservatoryPlanet(cand);
      setSelectedFor3DId(cand.rowid);
      setTimeout(() => setSelectedFor3DId(null), 2000);
    }
  };

  // Helper function to calculate planetary color token based on equilibrium temperature
  const getPlanetVisual = (cand: KeplerRecord) => {
    const temp = cand.equilibrium_temperature_k || 300;
    const radius = cand.planetary_radius_earth_radii || 1.0;
    const pixelSize = Math.max(16, Math.min(48, radius * 8));

    let gradient = 'from-cyan-400 to-blue-600 shadow-cyan-500/30';
    let label = 'Sub-Freezing';
    if (temp >= 200 && temp <= 350) {
      gradient = 'from-emerald-300 via-teal-400 to-cyan-600 shadow-emerald-500/40';
      label = 'Habitable Zone';
    } else if (temp > 350 && temp <= 700) {
      gradient = 'from-amber-300 via-orange-400 to-amber-700 shadow-amber-500/30';
      label = 'Warm Super-Earth';
    } else if (temp > 700) {
      gradient = 'from-rose-400 via-red-500 to-amber-600 shadow-rose-500/40';
      label = 'Scorching Jovian';
    }

    return { pixelSize, gradient, label };
  };

  // Export filtered candidates to CSV
  const handleExportCsv = () => {
    if (candidates.length === 0) return;
    const headers = [
      'rowid',
      'koi_identifier',
      'official_name',
      'exoplanet_archive_disposition',
      'planetary_radius_earth_radii',
      'orbital_period_days',
      'equilibrium_temperature_k',
      'transit_depth_ppm',
      'transit_duration_hours',
      'transit_signal_to_noise_ratio',
      'screening_priority_score',
    ];
    const rows = candidates.map((c) =>
      [
        c.rowid,
        c.koi_identifier,
        `"${c.official_name || ''}"`,
        c.exoplanet_archive_disposition,
        c.planetary_radius_earth_radii,
        c.orbital_period_days,
        c.equilibrium_temperature_k,
        c.transit_depth_ppm,
        c.transit_duration_hours,
        c.transit_signal_to_noise_ratio,
        c.screening_priority_score ?? '',
      ].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kepler_candidates_export_page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic live KPI derivations from current data
  const confirmedCount = candidates.filter((c) => c.exoplanet_archive_disposition === 'CONFIRMED').length;
  const confirmedPct = candidates.length > 0 ? ((confirmedCount / candidates.length) * 100).toFixed(1) : '0.0';
  const habitableCount = candidates.filter(
    (c) =>
      c.equilibrium_temperature_k >= 200 &&
      c.equilibrium_temperature_k <= 350 &&
      c.planetary_radius_earth_radii > 0 &&
      c.planetary_radius_earth_radii <= 2.0
  ).length;

  const validRadii = candidates.map((c) => c.planetary_radius_earth_radii).filter((r) => r > 0).sort((a, b) => a - b);
  const medianRadius =
    validRadii.length > 0 ? validRadii[Math.floor(validRadii.length / 2)].toFixed(2) : '2.39';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 5-Second Explorer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-cyan-500/15">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">
            <span>Exoplanet Catalog Explorer</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">NASA Kepler Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            Exoplanet Catalog & Discoveries
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Search, filter, and inspect over 9,200 exoplanetary candidates discovered by NASA's Kepler Mission archive.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={candidates.length === 0}
          className="px-3.5 py-2 bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/40 rounded-xl transition-colors cursor-pointer flex items-center gap-2 text-xs font-mono font-medium shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Download current page records as CSV"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Page CSV</span>
        </button>
      </div>

      {/* 4 Essential KPI Cards (Computed from filtered dataset) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#090d18] border border-cyan-500/20">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Filtered Catalog Size</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{total.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Matching active filters</div>
        </div>

        <div className="p-4 rounded-xl bg-[#090d18] border border-emerald-500/20">
          <div className="text-[11px] font-mono text-emerald-400 uppercase">Confirmed In View</div>
          <div className="text-2xl font-bold text-emerald-300 font-mono mt-1">{confirmedPct}%</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{confirmedCount} confirmed worlds</div>
        </div>

        <div className="p-4 rounded-xl bg-[#090d18] border border-amber-500/20">
          <div className="text-[11px] font-mono text-amber-400 uppercase">Habitable Window</div>
          <div className="text-2xl font-bold text-amber-300 font-mono mt-1">{habitableCount}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">200–350 K, Rp ≤ 2.0 R⊕</div>
        </div>

        <div className="p-4 rounded-xl bg-[#090d18] border border-indigo-500/20">
          <div className="text-[11px] font-mono text-indigo-400 uppercase">Median Radius</div>
          <div className="text-2xl font-bold text-indigo-300 font-mono mt-1">{medianRadius} R⊕</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Earth baseline = 1.0</div>
        </div>
      </div>

      {/* 1. Cosmic Catalog Floating HUD Controls */}
      <div className="observatory-panel p-6 rounded-2xl space-y-4 border border-cyan-500/20 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Query KOI (e.g. K00087.01), name (Kepler-22 b), or Kepler ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 observatory-input rounded-xl text-sm placeholder:text-slate-500 font-mono text-white"
            />
          </form>

          {/* Disposition Tabs (Buttons with click handlers per constitution) */}
          <div className="flex items-center gap-1 bg-[#020409]/90 p-1 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto">
            {[
              { id: 'ALL', label: 'ALL (9,201)' },
              { id: 'CONFIRMED', label: 'CONFIRMED (2,292)' },
              { id: 'CANDIDATE', label: 'CANDIDATE (2,185)' },
              { id: 'FALSE POSITIVE', label: 'FALSE POSITIVE (4,724)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setDisposition(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                  disposition === tab.id
                    ? tab.id === 'CONFIRMED'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                      : tab.id === 'CANDIDATE'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/20'
                      : tab.id === 'FALSE POSITIVE'
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-500/20'
                      : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode & Filter Drawer Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 rounded-xl text-xs font-mono transition-colors border flex items-center gap-1.5 cursor-pointer ${
                showAdvancedFilters
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                  : 'bg-[#020409]/90 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvancedFilters ? 'Basic Controls' : 'Astrophysical Filters'}</span>
            </button>

            <div className="flex items-center gap-1 bg-[#020409]/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-white'
                }`}
                title="Cosmic Catalog Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-white'
                }`}
                title="Observatory Telemetry Table"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Presets Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono">
          <span className="text-slate-400 font-semibold mr-1 uppercase text-[11px]">Cosmic Presets:</span>
          <button
            onClick={() => applyPreset('EARTH_LIKE')}
            className="px-2.5 py-1 rounded-lg bg-[#020409]/80 border border-slate-800 hover:border-emerald-500 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            Habitable Zone (200–350 K, Rp &lt; 1.5)
          </button>
          <button
            onClick={() => applyPreset('SUPER_EARTHS')}
            className="px-2.5 py-1 rounded-lg bg-[#020409]/80 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            Super-Earths (1.25–2.0 R⊕)
          </button>
          <button
            onClick={() => applyPreset('HOT_JUPITERS')}
            className="px-2.5 py-1 rounded-lg bg-[#020409]/80 border border-slate-800 hover:border-amber-500 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
          >
            Hot Jupiters (Rp &gt; 8, P &lt; 10d)
          </button>
          <button
            onClick={() => applyPreset('HIGH_PRIORITY')}
            className="px-2.5 py-1 rounded-lg bg-[#020409]/80 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            Top ML Screened Candidates
          </button>
        </div>

        {/* Primary Filter Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-3 border-t border-slate-800/60 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Min Radius (R⊕)</label>
            <input
              type="number"
              step="0.1"
              placeholder="0.0"
              value={minRadius}
              onChange={(e) => setMinRadius(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 observatory-input rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Max Radius (R⊕)</label>
            <input
              type="number"
              step="0.1"
              placeholder="Any"
              value={maxRadius}
              onChange={(e) => setMaxRadius(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 observatory-input rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Min Period (d)</label>
            <input
              type="number"
              step="1"
              placeholder="0"
              value={minPeriod}
              onChange={(e) => setMinPeriod(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 observatory-input rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Max Period (d)</label>
            <input
              type="number"
              step="1"
              placeholder="Any"
              value={maxPeriod}
              onChange={(e) => setMaxPeriod(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 observatory-input rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Min Temp (K)</label>
            <input
              type="number"
              step="50"
              placeholder="0"
              value={minTemp}
              onChange={(e) => setMinTemp(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 observatory-input rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[11px]">Max Temp (K)</label>
            <input
              type="number"
              step="50"
              placeholder="Any"
              value={maxTemp}
              onChange={(e) => setMaxTemp(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 observatory-input rounded-lg text-xs"
            />
          </div>

          <div className="flex items-end gap-1.5">
            <button
              onClick={() => {
                setPage(1);
                fetchData();
              }}
              className="flex-1 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-sm shadow-cyan-500/20"
            >
              Filter
            </button>
            <button
              onClick={handleResetFilters}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer border border-slate-700"
              title="Reset parameters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Secondary Extended Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-3 border-t border-slate-800/40 text-xs font-mono animate-fade-in">
            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Min Depth (ppm)</label>
              <input
                type="number"
                step="50"
                placeholder="0"
                value={minDepth}
                onChange={(e) => setMinDepth(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 observatory-input rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Max Depth (ppm)</label>
              <input
                type="number"
                step="100"
                placeholder="Any"
                value={maxDepth}
                onChange={(e) => setMaxDepth(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 observatory-input rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Min Duration (hrs)</label>
              <input
                type="number"
                step="0.5"
                placeholder="0"
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 observatory-input rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Max Duration (hrs)</label>
              <input
                type="number"
                step="0.5"
                placeholder="Any"
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 observatory-input rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Min SNR</label>
              <input
                type="number"
                step="5"
                placeholder="0"
                value={minSnr}
                onChange={(e) => setMinSnr(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 observatory-input rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-[11px]">Max SNR</label>
              <input
                type="number"
                step="10"
                placeholder="Any"
                value={maxSnr}
                onChange={(e) => setMaxSnr(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 observatory-input rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <label className="flex items-center gap-2 text-cyan-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyScreened}
                  onChange={(e) => {
                    setOnlyScreened(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400"
                />
                <span className="text-[11px] font-semibold">Only Screened</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 2. Results Telemetry & Sorting Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div>
          Showing <span className="font-semibold text-white">{candidates.length}</span> of{' '}
          <span className="font-semibold text-white">{total.toLocaleString()}</span> Kepler records
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs cursor-pointer"
            >
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
              <option value="96">96</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer text-xs"
            >
              <option value="rowid">Dataset Order</option>
              <option value="planetary_radius_earth_radii">Planetary Radius (R⊕)</option>
              <option value="orbital_period_days">Orbital Period (days)</option>
              <option value="equilibrium_temperature_k">Equilibrium Temp (K)</option>
              <option value="transit_depth_ppm">Transit Depth (ppm)</option>
              <option value="transit_duration_hours">Transit Duration (hrs)</option>
              <option value="transit_signal_to_noise_ratio">Signal-to-Noise Ratio (SNR)</option>
              <option value="screening_priority_score">Screening Priority Score</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Results Presentation Area */}
      {loading ? (
        <div className="observatory-panel rounded-2xl p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3 font-mono border border-cyan-500/15">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-cyan-400 tracking-wider">SEARCHING 9,201 KEPLER MISSION OBSERVATIONS...</p>
        </div>
      ) : error ? (
        <div className="observatory-panel rounded-2xl p-12 text-center text-rose-400 flex flex-col items-center justify-center gap-3 font-mono border border-rose-500/30">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-xs">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500/40 rounded-lg text-xs cursor-pointer"
          >
            Retry Query
          </button>
        </div>
      ) : candidates.length === 0 ? (
        <div className="observatory-panel rounded-2xl p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3 font-mono border border-cyan-500/15">
          <Globe className="w-8 h-8 text-cyan-500/40" />
          <p className="text-sm font-semibold text-white">No Kepler Records Match Current Query</p>
          <p className="text-xs text-slate-500 max-w-md">
            Widen numerical ranges or reset filters to explore all 9,201 mission observations.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs cursor-pointer mt-2"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* COSMIC CATALOG SPATIAL GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {candidates.map((cand) => {
            const visual = getPlanetVisual(cand);
            return (
              <div
                key={cand.rowid}
                onClick={() => onSelectCandidate(cand.rowid)}
                className="observatory-panel p-5 rounded-2xl hover:border-cyan-500/50 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  {/* Card Header with Planet Token & Disposition */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Dynamic Miniature Planetary Sphere */}
                      <div className="w-12 h-12 rounded-xl bg-[#02050e] border border-slate-800 flex items-center justify-center shrink-0 relative overflow-hidden shadow-inner">
                        <div
                          style={{
                            width: `${visual.pixelSize}px`,
                            height: `${visual.pixelSize}px`,
                          }}
                          className={`rounded-full bg-gradient-to-tr ${visual.gradient} shadow-md transition-transform group-hover:scale-110 duration-300`}
                        />
                      </div>

                      <div>
                        <h3 className="font-bold text-white font-mono group-hover:text-cyan-300 transition-colors text-sm">
                          {cand.official_name && cand.official_name !== 'Unnamed Candidate'
                            ? cand.official_name
                            : cand.koi_identifier}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {cand.koi_identifier} · KIC {cand.kepler_id}
                        </p>
                      </div>
                    </div>

                    {/* Disposition Status (Clean Typography, No Pill) */}
                    <span
                      className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
                        cand.exoplanet_archive_disposition === 'CONFIRMED'
                          ? 'text-emerald-400'
                          : cand.exoplanet_archive_disposition === 'CANDIDATE'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {cand.exoplanet_archive_disposition}
                    </span>
                  </div>

                  {/* Astrophysical Parameters Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono my-3">
                    <div className="p-2 rounded-xl bg-[#020409]/70 border border-slate-800/80">
                      <span className="text-slate-500 block text-[10px]">Radius:</span>
                      <span className="font-semibold text-slate-200">
                        {cand.planetary_radius_earth_radii > 0
                          ? `${cand.planetary_radius_earth_radii.toFixed(2)} R⊕`
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#020409]/70 border border-slate-800/80">
                      <span className="text-slate-500 block text-[10px]">Period:</span>
                      <span className="font-semibold text-slate-200">
                        {cand.orbital_period_days > 0
                          ? `${cand.orbital_period_days.toFixed(2)} d`
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#020409]/70 border border-slate-800/80">
                      <span className="text-slate-500 block text-[10px]">Eq Temp:</span>
                      <span className="font-semibold text-slate-200">
                        {cand.equilibrium_temperature_k > 0
                          ? `${cand.equilibrium_temperature_k} K`
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#020409]/70 border border-slate-800/80">
                      <span className="text-slate-500 block text-[10px]">Transit Depth:</span>
                      <span className="font-semibold text-slate-200">
                        {cand.transit_depth_ppm > 0
                          ? `${cand.transit_depth_ppm.toLocaleString()} ppm`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between font-mono text-xs">
                  {cand.screening_priority_score !== undefined ? (
                    <div className="text-[11px] text-cyan-300 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Screening: {cand.screening_priority_score.toFixed(1)}%</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">Archive Target</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    {onSelectObservatoryPlanet && (
                      <button
                        onClick={(e) => handleSelectObservatory(cand, e)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer flex items-center gap-1 transition-colors ${
                          selectedFor3DId === cand.rowid
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/40'
                        }`}
                        title="Set as Active Planet in 3D Observatory"
                      >
                        <Orbit className="w-3 h-3" />
                        <span>3D View</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCandidate(cand.rowid);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* OBSERVATORY TELEMETRY TABLE VIEW */
        <div className="observatory-panel rounded-2xl overflow-hidden border border-cyan-500/15">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#020409]/95 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Designation</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Archive Disposition</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Radius (R⊕)</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Period (days)</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Temp (K)</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Transit Depth</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">SNR</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">ML Score</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {candidates.map((cand) => (
                  <tr
                    key={cand.rowid}
                    onClick={() => onSelectCandidate(cand.rowid)}
                    className="hover:bg-cyan-950/20 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {cand.official_name && cand.official_name !== 'Unnamed Candidate'
                          ? cand.official_name
                          : cand.koi_identifier}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {cand.koi_identifier} · KIC {cand.kepler_id}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold text-[11px] ${
                          cand.exoplanet_archive_disposition === 'CONFIRMED'
                            ? 'text-emerald-400'
                            : cand.exoplanet_archive_disposition === 'CANDIDATE'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {cand.exoplanet_archive_disposition}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-200">
                      {cand.planetary_radius_earth_radii > 0
                        ? `${cand.planetary_radius_earth_radii.toFixed(2)} R⊕`
                        : <span className="text-slate-600">N/A</span>}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {cand.orbital_period_days > 0
                        ? `${cand.orbital_period_days.toFixed(2)} d`
                        : <span className="text-slate-600">N/A</span>}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {cand.equilibrium_temperature_k > 0
                        ? `${cand.equilibrium_temperature_k} K`
                        : <span className="text-slate-600">N/A</span>}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {cand.transit_depth_ppm > 0
                        ? `${cand.transit_depth_ppm.toLocaleString()} ppm`
                        : <span className="text-slate-600">N/A</span>}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {cand.transit_signal_to_noise_ratio > 0
                        ? cand.transit_signal_to_noise_ratio.toFixed(1)
                        : <span className="text-slate-600">N/A</span>}
                    </td>

                    <td className="py-3 px-4">
                      {cand.screening_priority_score !== undefined ? (
                        <span className="font-bold text-cyan-300">
                          {cand.screening_priority_score.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">--</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectObservatoryPlanet && (
                          <button
                            onClick={(e) => handleSelectObservatory(cand, e)}
                            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              selectedFor3DId === cand.rowid
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                                : 'bg-[#020409] hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-800'
                            }`}
                            title="Set as Active Planet in 3D Observatory"
                          >
                            <Orbit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidate(cand.rowid);
                          }}
                          className="p-1.5 bg-[#020409] hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                          title="Inspect astrophysical profile"
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
        </div>
      )}

      {/* 4. Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs font-mono text-slate-400">
        <div>
          Page <span className="font-bold text-white">{page}</span> of{' '}
          <span className="font-bold text-white">{totalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Quick jump input */}
          <div className="flex items-center gap-1">
            <span>Jump:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={page}
              onChange={(e) => {
                const p = parseInt(e.target.value, 10);
                if (p >= 1 && p <= totalPages) setPage(p);
              }}
              className="w-14 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-center text-white"
            />
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

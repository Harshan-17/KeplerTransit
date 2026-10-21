import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local environment file if present (Node 20+ and custom parser for overrides)
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (val && (!process.env[key] || process.env[key] === 'MY_GEMINI_API_KEY')) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // Proceed with process.env if .env cannot be loaded
}

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Raw Kepler row interface from CSV
interface RawKeplerRow {
  rowid: string;
  kepler_id: string;
  koi_identifier: string;
  official_name: string;
  exoplanet_archive_disposition: string;
  disposition_using_kepler_data: string;
  disposition_score: string;
  flag_not_transit_like: string;
  flag_stellar_eclipse: string;
  flag_centroid_offset: string;
  flag_ephemeris_match_contamination: string;
  orbital_period_days: string;
  transit_epoch_bkjd: string;
  impact_parameter: string;
  transit_duration_hours: string;
  transit_depth_ppm: string;
  planetary_radius_earth_radii: string;
  equilibrium_temperature_k: string;
  insolation_flux: string;
  transit_signal_to_noise_ratio: string;
  tce_planet_number: string;
  stellar_effective_temperature_k: string;
  stellar_surface_gravity_log10: string;
  stellar_radius_solar_radii: string;
  right_ascension_deg: string;
  declination_deg: string;
  kepler_band_magnitude: string;
}

export interface KeplerRecord {
  rowid: number;
  kepler_id: number;
  koi_identifier: string;
  official_name: string;
  exoplanet_archive_disposition: string;
  disposition_using_kepler_data: string;
  disposition_score: number;
  flag_not_transit_like: number;
  flag_stellar_eclipse: number;
  flag_centroid_offset: number;
  flag_ephemeris_match_contamination: number;
  orbital_period_days: number;
  transit_epoch_bkjd: number;
  impact_parameter: number;
  transit_duration_hours: number;
  transit_depth_ppm: number;
  planetary_radius_earth_radii: number;
  equilibrium_temperature_k: number;
  insolation_flux: number;
  transit_signal_to_noise_ratio: number;
  tce_planet_number: number;
  stellar_effective_temperature_k: number;
  stellar_surface_gravity_log10: number;
  stellar_radius_solar_radii: number;
  right_ascension_deg: number;
  declination_deg: number;
  kepler_band_magnitude: number;
  probability_candidate?: number;
  probability_confirmed?: number;
  probability_false_positive?: number;
  screening_priority_score?: number;
  priority_tier?: 'High Priority' | 'Medium Priority' | 'Low Priority';
}

export interface TransitTelemetry {
  candidate: KeplerRecord;
  transitEpochBkjd: number;
  orbitalPeriodDays: number;
  transitDurationHours: number;
  transitDepthPpm: number;
  currentBKJD: number;
  targetBKJD: number;
  targetTimestampMs: number;
  targetDateIso: string;
  remainingMs: number;
  transitNumber: number;
  status: 'UPCOMING' | 'IN_PROGRESS';
  progressFraction?: number;
}

let keplerDataset: KeplerRecord[] = [];
const screeningMap = new Map<string, {
  probability_candidate: number;
  probability_confirmed: number;
  probability_false_positive: number;
  screening_priority_score: number;
}>();
let screeningTopList: KeplerRecord[] = [];

// Load dataset files
function loadDataset() {
  try {
    const screeningPath = path.join(__dirname, 'results', 'tables', 'kepler_screening_results.csv');
    if (fs.existsSync(screeningPath)) {
      const csvContent = fs.readFileSync(screeningPath, 'utf8');
      const parsed = Papa.parse<any>(csvContent, { header: true, skipEmptyLines: true });
      for (const row of parsed.data) {
        const koi = String(row.koi_identifier || '').trim();
        const score = parseFloat(row.screening_priority_score) || 0;
        const probCand = parseFloat(row.probability_candidate) || 0;
        const probConf = parseFloat(row.probability_confirmed) || 0;
        const probFp = parseFloat(row.probability_false_positive) || 0;
        if (koi) {
          screeningMap.set(koi, {
            probability_candidate: probCand,
            probability_confirmed: probConf,
            probability_false_positive: probFp,
            screening_priority_score: score,
          });
        }
      }
      console.log(`Loaded ${screeningMap.size} screening results from kepler_screening_results.csv.`);
    }

    const dataPath = path.join(__dirname, 'data', 'raw', 'processed', 'kepler_cleaned.csv');
    if (fs.existsSync(dataPath)) {
      const csvContent = fs.readFileSync(dataPath, 'utf8');
      const parsed = Papa.parse<RawKeplerRow>(csvContent, { header: true, skipEmptyLines: true });
      keplerDataset = parsed.data.map((row) => {
        const koi = String(row.koi_identifier || '').trim();
        const screen = screeningMap.get(koi);
        let priority_tier: 'High Priority' | 'Medium Priority' | 'Low Priority' | undefined = undefined;
        if (screen) {
          if (screen.screening_priority_score >= 80) priority_tier = 'High Priority';
          else if (screen.screening_priority_score >= 50) priority_tier = 'Medium Priority';
          else priority_tier = 'Low Priority';
        }

        const rawName = String(row.official_name || '').trim();
        const official_name = rawName || 'Unnamed Candidate';

        return {
          rowid: parseInt(row.rowid, 10) || 0,
          kepler_id: parseInt(row.kepler_id, 10) || 0,
          koi_identifier: koi,
          official_name,
          exoplanet_archive_disposition: String(row.exoplanet_archive_disposition || '').trim(),
          disposition_using_kepler_data: String(row.disposition_using_kepler_data || '').trim(),
          disposition_score: parseFloat(row.disposition_score) || 0,
          flag_not_transit_like: parseInt(row.flag_not_transit_like, 10) || 0,
          flag_stellar_eclipse: parseInt(row.flag_stellar_eclipse, 10) || 0,
          flag_centroid_offset: parseInt(row.flag_centroid_offset, 10) || 0,
          flag_ephemeris_match_contamination: parseInt(row.flag_ephemeris_match_contamination, 10) || 0,
          orbital_period_days: parseFloat(row.orbital_period_days) || 0,
          transit_epoch_bkjd: parseFloat(row.transit_epoch_bkjd) || 0,
          impact_parameter: parseFloat(row.impact_parameter) || 0,
          transit_duration_hours: parseFloat(row.transit_duration_hours) || 0,
          transit_depth_ppm: parseFloat(row.transit_depth_ppm) || 0,
          planetary_radius_earth_radii: parseFloat(row.planetary_radius_earth_radii) || 0,
          equilibrium_temperature_k: parseFloat(row.equilibrium_temperature_k) || 0,
          insolation_flux: parseFloat(row.insolation_flux) || 0,
          transit_signal_to_noise_ratio: parseFloat(row.transit_signal_to_noise_ratio) || 0,
          tce_planet_number: parseInt(row.tce_planet_number, 10) || 1,
          stellar_effective_temperature_k: parseFloat(row.stellar_effective_temperature_k) || 0,
          stellar_surface_gravity_log10: parseFloat(row.stellar_surface_gravity_log10) || 0,
          stellar_radius_solar_radii: parseFloat(row.stellar_radius_solar_radii) || 0,
          right_ascension_deg: parseFloat(row.right_ascension_deg) || 0,
          declination_deg: parseFloat(row.declination_deg) || 0,
          kepler_band_magnitude: parseFloat(row.kepler_band_magnitude) || 0,
          probability_candidate: screen?.probability_candidate,
          probability_confirmed: screen?.probability_confirmed,
          probability_false_positive: screen?.probability_false_positive,
          screening_priority_score: screen?.screening_priority_score,
          priority_tier,
        };
      });
      console.log(`Loaded ${keplerDataset.length} Kepler objects from cleaned dataset.`);
    }

    // Populate top screening list
    screeningTopList = keplerDataset
      .filter((k) => k.screening_priority_score !== undefined)
      .sort((a, b) => (b.screening_priority_score || 0) - (a.screening_priority_score || 0));

  } catch (err) {
    console.error('Error loading Kepler dataset:', err);
  }
}

loadDataset();

// Helper: Statistical utilities
function calculateStats(numbers: number[]) {
  const valid = numbers.filter((n) => !isNaN(n) && isFinite(n));
  if (valid.length === 0) return { min: 0, max: 0, avg: 0, median: 0 };
  valid.sort((a, b) => a - b);
  const min = valid[0];
  const max = valid[valid.length - 1];
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  const avg = parseFloat((sum / valid.length).toFixed(2));
  const mid = Math.floor(valid.length / 2);
  const median = valid.length % 2 !== 0 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
  return { min, max, avg, median: parseFloat(median.toFixed(2)) };
}

// Transit telemetry calculation helper
// Converts live UTC timestamp to Barycentric Kepler Julian Date (BKJD)
// BKJD = BJD - 2454833.0 (with JD_1970 = 2440587.5)
export function calculateCandidateTransitTelemetry(cand: KeplerRecord, nowMs: number): TransitTelemetry {
  const currentJD = (nowMs / 86400000) + 2440587.5;
  const currentBKJD = currentJD - 2454833.0;

  const t0 = cand.transit_epoch_bkjd;
  const P = cand.orbital_period_days > 0 ? cand.orbital_period_days : 1;
  const durHours = cand.transit_duration_hours > 0 ? cand.transit_duration_hours : 2.5;
  const halfDurDays = (durHours / 24) / 2;

  // Orbital cycle calculation relative to reference epoch t0
  const n = Math.floor((currentBKJD - t0) / P);
  const tn = t0 + n * P;
  const tnNext = t0 + (n + 1) * P;

  let targetBKJD = tnNext;
  let status: 'UPCOMING' | 'IN_PROGRESS' = 'UPCOMING';
  let transitNumber = n + 1;
  let remainingMs = 0;
  let progressFraction = 0;

  if (currentBKJD >= tn - halfDurDays && currentBKJD <= tn + halfDurDays) {
    // Current time is strictly inside the transit window [tn - halfDurDays, tn + halfDurDays]
    status = 'IN_PROGRESS';
    targetBKJD = tn;
    transitNumber = n;
    const elapsedSinceIngress = currentBKJD - (tn - halfDurDays);
    const totalDurationDays = halfDurDays * 2;
    progressFraction = Math.max(0, Math.min(1, elapsedSinceIngress / totalDurationDays));
    const egressMs = ((tn + halfDurDays) + 2454833.0 - 2440587.5) * 86400000;
    remainingMs = Math.max(0, egressMs - nowMs);
  } else if (currentBKJD < tn - halfDurDays) {
    // Transit n has not yet begun
    status = 'UPCOMING';
    targetBKJD = tn;
    transitNumber = n;
    const targetMs = (targetBKJD + 2454833.0 - 2440587.5) * 86400000;
    remainingMs = Math.max(0, targetMs - nowMs);
  } else {
    // Transit n has completed; next event is transit n + 1
    status = 'UPCOMING';
    targetBKJD = tnNext;
    transitNumber = n + 1;
    const targetMs = (targetBKJD + 2454833.0 - 2440587.5) * 86400000;
    remainingMs = Math.max(0, targetMs - nowMs);
  }

  const targetTimestampMs = (targetBKJD + 2454833.0 - 2440587.5) * 86400000;

  return {
    candidate: cand,
    transitEpochBkjd: t0,
    orbitalPeriodDays: P,
    transitDurationHours: durHours,
    transitDepthPpm: cand.transit_depth_ppm,
    currentBKJD,
    targetBKJD,
    targetTimestampMs,
    targetDateIso: new Date(targetTimestampMs).toISOString(),
    remainingMs,
    transitNumber,
    status,
    progressFraction,
  };
}

// Model Fallback Ladder Implementation per Production Directives
const GEMINI_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestParams: { contents: any[]; config?: any }
): Promise<string> {
  const recoverableErrors = ['503', '429', '404', '500', 'UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'NOT_FOUND', 'INTERNAL', 'high demand', 'overloaded'];
  let lastError: any = null;

  for (const model of GEMINI_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: requestParams.contents,
        config: requestParams.config,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err);
      const isRecoverable = recoverableErrors.some((code) => errMsg.toLowerCase().includes(code.toLowerCase()));
      console.warn(`Model ${model} attempt failed: ${errMsg}. ${isRecoverable ? 'Attempting next model in fallback ladder...' : 'Attempting next available model...'}`);
      // Continue through fallback ladder unless explicitly authenticated credentials error
      if (errMsg.includes('API_KEY_INVALID')) {
        break;
      }
    }
  }
  throw lastError || new Error('All fallback models exhausted');
}

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// 1. Featured Transits Endpoint (with custom query support)
app.get('/api/transits/featured', (req: Request, res: Response) => {
  const nowMs = Date.now();
  const currentJD = (nowMs / 86400000) + 2440587.5;
  const currentBKJD = currentJD - 2454833.0;

  // Prominent targets from real Kepler dataset:
  // K00087.01 -> Kepler-22 b (Habitable zone super-Earth)
  // K00072.01 -> Kepler-10 b (Scorched rocky world)
  // K00749.01 -> Kepler-226 c (Top ML Screened Candidate, 100% Score)
  // K00752.01 -> Kepler-227 b (DR25 Confirmed Exoplanet)
  // K00747.01 -> Kepler-661 b (Top Screened Candidate, 100% Score)
  // K01408.01 -> Unnamed Candidate (Top ML Screened terrestrial 1.36 R⊕, 100% Score)
  // K00756.02 -> Kepler-228 c (Top Screened Candidate, 100% Score)
  const defaultTargetKois = [
    'K00087.01',
    'K00072.01',
    'K00749.01',
    'K00752.01',
    'K00747.01',
    'K01408.01',
    'K00756.02',
  ];

  // Optional custom target KOI via query parameter
  const customKoi = typeof req.query.koi === 'string' ? req.query.koi.trim() : '';
  const targetKois = customKoi
    ? [customKoi, ...defaultTargetKois.filter((k) => k !== customKoi)]
    : defaultTargetKois;

  const targets = targetKois
    .map((koi) => keplerDataset.find((k) => k.koi_identifier.toLowerCase() === koi.toLowerCase()))
    .filter((k): k is KeplerRecord => Boolean(k));

  const results = targets.map((cand) => calculateCandidateTransitTelemetry(cand, nowMs));

  res.json({
    currentBKJD,
    currentDateIso: new Date(nowMs).toISOString(),
    featuredTransits: results,
  });
});

// 2. Dataset Overview Metrics Endpoint
app.get('/api/overview', (_req: Request, res: Response) => {
  const total = keplerDataset.length;
  let confirmed = 0;
  let candidate = 0;
  let falsePositive = 0;

  for (const item of keplerDataset) {
    const disp = item.exoplanet_archive_disposition.toUpperCase();
    if (disp === 'CONFIRMED') confirmed++;
    else if (disp === 'CANDIDATE') candidate++;
    else if (disp === 'FALSE POSITIVE') falsePositive++;
  }

  const radiusStats = calculateStats(keplerDataset.map((k) => k.planetary_radius_earth_radii));
  const periodStats = calculateStats(keplerDataset.map((k) => k.orbital_period_days));
  const tempStats = calculateStats(keplerDataset.map((k) => k.equilibrium_temperature_k));
  const depthStats = calculateStats(keplerDataset.map((k) => k.transit_depth_ppm));
  const snrStats = calculateStats(keplerDataset.map((k) => k.transit_signal_to_noise_ratio));
  const stellarStats = calculateStats(keplerDataset.map((k) => k.stellar_effective_temperature_k));

  res.json({
    totalObjects: total,
    dispositionCounts: {
      CONFIRMED: confirmed,
      CANDIDATE: candidate,
      FALSE_POSITIVE: falsePositive,
    },
    dispositionPercentages: {
      CONFIRMED: parseFloat(((confirmed / (total || 1)) * 100).toFixed(1)),
      CANDIDATE: parseFloat(((candidate / (total || 1)) * 100).toFixed(1)),
      FALSE_POSITIVE: parseFloat(((falsePositive / (total || 1)) * 100).toFixed(1)),
    },
    summaryStats: {
      radius: radiusStats,
      period: periodStats,
      temperature: tempStats,
      transitDepth: depthStats,
      snr: snrStats,
      stellarTemp: stellarStats,
    },
    topScreenedCandidatesCount: screeningTopList.length,
  });
});

// 3. Planet Explorer: Filtering, Searching, and Pagination
app.get('/api/candidates', (req: Request, res: Response) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const disposition = String(req.query.disposition || 'ALL').toUpperCase();

  const minRadius = parseFloat(String(req.query.minRadius || '')) || 0;
  const maxRadius = parseFloat(String(req.query.maxRadius || '')) || Infinity;
  const minPeriod = parseFloat(String(req.query.minPeriod || '')) || 0;
  const maxPeriod = parseFloat(String(req.query.maxPeriod || '')) || Infinity;
  const minTemp = parseFloat(String(req.query.minTemp || '')) || 0;
  const maxTemp = parseFloat(String(req.query.maxTemp || '')) || Infinity;

  // New filters requested: depth, duration, snr, screening
  const minDepth = parseFloat(String(req.query.minDepth || '')) || 0;
  const maxDepth = parseFloat(String(req.query.maxDepth || '')) || Infinity;
  const minDuration = parseFloat(String(req.query.minDuration || '')) || 0;
  const maxDuration = parseFloat(String(req.query.maxDuration || '')) || Infinity;
  const minSnr = parseFloat(String(req.query.minSnr || '')) || 0;
  const maxSnr = parseFloat(String(req.query.maxSnr || '')) || Infinity;
  const onlyScreened = String(req.query.onlyScreened || '').toLowerCase() === 'true';

  const sortBy = String(req.query.sortBy || 'rowid');
  const sortOrder = String(req.query.sortOrder || 'asc').toLowerCase();
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(String(req.query.pageSize || '25'), 10)));

  const filtered = keplerDataset.filter((item) => {
    if (search) {
      const matchKoi = item.koi_identifier.toLowerCase().includes(search);
      const matchName = item.official_name.toLowerCase().includes(search);
      const matchId = String(item.kepler_id).includes(search);
      if (!matchKoi && !matchName && !matchId) return false;
    }

    if (disposition !== 'ALL') {
      if (item.exoplanet_archive_disposition.toUpperCase() !== disposition) return false;
    }

    if (minRadius > 0 && item.planetary_radius_earth_radii < minRadius) return false;
    if (maxRadius < Infinity && item.planetary_radius_earth_radii > maxRadius) return false;

    if (minPeriod > 0 && item.orbital_period_days < minPeriod) return false;
    if (maxPeriod < Infinity && item.orbital_period_days > maxPeriod) return false;

    if (minTemp > 0 && item.equilibrium_temperature_k < minTemp) return false;
    if (maxTemp < Infinity && item.equilibrium_temperature_k > maxTemp) return false;

    if (minDepth > 0 && item.transit_depth_ppm < minDepth) return false;
    if (maxDepth < Infinity && item.transit_depth_ppm > maxDepth) return false;

    if (minDuration > 0 && item.transit_duration_hours < minDuration) return false;
    if (maxDuration < Infinity && item.transit_duration_hours > maxDuration) return false;

    if (minSnr > 0 && item.transit_signal_to_noise_ratio < minSnr) return false;
    if (maxSnr < Infinity && item.transit_signal_to_noise_ratio > maxSnr) return false;

    if (onlyScreened && item.screening_priority_score === undefined) return false;

    return true;
  });

  // Sorting
  filtered.sort((a: any, b: any) => {
    let valA = a[sortBy] ?? 0;
    let valB = b[sortBy] ?? 0;
    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const pageData = filtered.slice(startIdx, startIdx + pageSize);

  res.json({
    total,
    page,
    pageSize,
    totalPages,
    data: pageData,
  });
});

// 4. Candidate Deep-Dive Record with Dynamic Real-Time Ephemeris
app.get('/api/candidates/:id', (req: Request, res: Response) => {
  const query = req.params.id.trim().toLowerCase();
  const candidate = keplerDataset.find(
    (k) =>
      String(k.rowid) === query ||
      String(k.kepler_id) === query ||
      k.koi_identifier.toLowerCase() === query ||
      k.official_name.toLowerCase() === query
  );

  if (!candidate) {
    res.status(404).json({ error: 'Exoplanet candidate not found in Kepler archive' });
    return;
  }

  const nowMs = Date.now();
  const nextTransit = calculateCandidateTransitTelemetry(candidate, nowMs);

  // Generate synthetic limb-darkened transit light curve points
  const depthFraction = candidate.transit_depth_ppm / 1e6;
  const durHours = candidate.transit_duration_hours > 0 ? candidate.transit_duration_hours : 2.5;
  const durDays = durHours / 24;
  const halfDuration = durDays / 2;
  const lightCurvePoints: { timeOffsetHours: number; flux: number }[] = [];

  const spanHours = Math.max(12, durHours * 2.5);
  const stepHours = spanHours / 80;

  for (let t = -spanHours / 2; t <= spanHours / 2; t += stepHours) {
    const tDays = t / 24;
    let flux = 1.0;
    if (Math.abs(tDays) < halfDuration) {
      const u = Math.abs(tDays) / halfDuration;
      const ingress = Math.cos((u * Math.PI) / 2);
      flux = 1.0 - depthFraction * (0.8 + 0.2 * ingress);
    }
    const noise = (Math.random() - 0.5) * Math.min(depthFraction * 0.08, 0.00008);
    lightCurvePoints.push({
      timeOffsetHours: parseFloat(t.toFixed(2)),
      flux: parseFloat((flux + noise).toFixed(6)),
    });
  }

  // Calculate upcoming 5 transits using actual live currentBKJD
  const t0 = candidate.transit_epoch_bkjd;
  const period = candidate.orbital_period_days > 0 ? candidate.orbital_period_days : 1;
  const currentBKJD = nextTransit.currentBKJD;
  const nStart = Math.ceil((currentBKJD - t0) / period);

  const upcomingTransits = [];
  for (let i = 0; i < 5; i++) {
    const n = nStart + i;
    const transitBkjd = t0 + n * period;
    const transitMs = (transitBkjd + 2454833.0 - 2440587.5) * 86400000;
    const daysFromNow = transitBkjd - currentBKJD;
    upcomingTransits.push({
      transitNumber: n,
      predictedBkjd: parseFloat(transitBkjd.toFixed(4)),
      predictedDateIso: new Date(transitMs).toISOString(),
      daysFromNow: parseFloat(daysFromNow.toFixed(1)),
    });
  }

  // Physical classification description
  let planetClass = 'Sub-Neptune / Super-Earth';
  const r = candidate.planetary_radius_earth_radii;
  if (r < 1.25) planetClass = 'Terrestrial (Earth-sized)';
  else if (r < 2.0) planetClass = 'Super-Earth';
  else if (r < 6.0) planetClass = 'Neptunian (Sub-Neptune / Neptune-like)';
  else planetClass = 'Gas Giant (Jovian)';

  // Habitability thermal classification
  const tempK = candidate.equilibrium_temperature_k;
  let thermalZone = 'Torrid / Scorched';
  if (tempK > 400) thermalZone = 'Hot Orbit (> 400 K)';
  else if (tempK >= 240 && tempK <= 330) thermalZone = 'Potentially Habitable Zone (240 - 330 K)';
  else if (tempK < 240) thermalZone = 'Cold Outer Orbit (< 240 K)';

  // Screening metadata check
  const screen = screeningMap.get(candidate.koi_identifier);
  const screening = {
    hasScreening: Boolean(screen),
    probability_candidate: screen?.probability_candidate ?? null,
    probability_confirmed: screen?.probability_confirmed ?? null,
    probability_false_positive: screen?.probability_false_positive ?? null,
    screening_priority_score: screen?.screening_priority_score ?? null,
    priority_tier: candidate.priority_tier ?? null,
    disclaimer: 'Machine Learning screening prioritization score reflects algorithmic probability for observational follow-up, NOT scientific confirmation.',
  };

  res.json({
    candidate,
    classification: {
      planetClass,
      thermalZone,
    },
    nextTransit,
    upcomingTransits,
    lightCurve: lightCurvePoints,
    screening,
  });
});

// 5. Screening Results (Top Candidates from kepler_screening_results.csv)
app.get('/api/screening', (_req: Request, res: Response) => {
  res.json({
    totalScreened: screeningTopList.length,
    highPriorityCount: screeningTopList.filter((c) => c.priority_tier === 'High Priority').length,
    mediumPriorityCount: screeningTopList.filter((c) => c.priority_tier === 'Medium Priority').length,
    lowPriorityCount: screeningTopList.filter((c) => c.priority_tier === 'Low Priority').length,
    candidates: screeningTopList,
  });
});

// 6. ML Model Diagnostics & Metrics
app.get('/api/ml', (_req: Request, res: Response) => {
  const mlData = {
    models: {
      logisticRegression: {
        name: 'Logistic Regression (Scaled)',
        accuracy: 0.8174,
        precision: 0.8192,
        recall: 0.8174,
        f1: 0.8177,
        confusionMatrix: {
          classes: ['CANDIDATE', 'CONFIRMED', 'FALSE POSITIVE'],
          matrix: [
            [264, 88, 71],
            [92, 351, 15],
            [48, 22, 890],
          ],
        },
      },
      randomForest: {
        name: 'Random Forest Classifier (200 Trees, Balanced)',
        accuracy: 0.8984,
        precision: 0.8995,
        recall: 0.8984,
        f1: 0.8986,
        confusionMatrix: {
          classes: ['CANDIDATE', 'CONFIRMED', 'FALSE POSITIVE'],
          matrix: [
            [342, 65, 16],
            [84, 370, 4],
            [12, 6, 942],
          ],
        },
      },
    },
    featureImportance: [
      { feature: 'transit_signal_to_noise_ratio', label: 'Transit SNR', importance: 0.1784 },
      { feature: 'orbital_period_days', label: 'Orbital Period (days)', importance: 0.1342 },
      { feature: 'transit_depth_ppm', label: 'Transit Depth (ppm)', importance: 0.1265 },
      { feature: 'planetary_radius_earth_radii', label: 'Planetary Radius (R⊕)', importance: 0.1198 },
      { feature: 'transit_duration_hours', label: 'Transit Duration (hrs)', importance: 0.0892 },
      { feature: 'equilibrium_temperature_k', label: 'Equilibrium Temp (K)', importance: 0.0784 },
      { feature: 'insolation_flux', label: 'Insolation Flux', importance: 0.0673 },
      { feature: 'stellar_surface_gravity_log10', label: 'Stellar Gravity log(g)', importance: 0.0561 },
      { feature: 'impact_parameter', label: 'Impact Parameter (b)', importance: 0.0524 },
      { feature: 'stellar_effective_temperature_k', label: 'Stellar Temp (K)', importance: 0.0412 },
      { feature: 'kepler_band_magnitude', label: 'Kepler Band Mag', importance: 0.0315 },
      { feature: 'stellar_radius_solar_radii', label: 'Stellar Radius (R☉)', importance: 0.025 },
    ],
  };

  res.json(mlData);
});

// 7. Statistical Relationships & Correlations
app.get('/api/statistics', (_req: Request, res: Response) => {
  const relationships = [
    {
      variable_1: 'planetary_radius_earth_radii',
      variable_2: 'transit_depth_ppm',
      label_1: 'Planetary Radius (R⊕)',
      label_2: 'Transit Depth (ppm)',
      pearson_r: 0.038,
      pearson_p: 0.0003,
      spearman_rho: 0.884,
      spearman_p: 1e-15,
      interpretation: 'Very strong monotonic rank correlation (Spearman ρ = 0.884), reflecting that transit depth scales quadratically with planet radius (ΔF/F ≈ (Rp/R*)²). Linear Pearson r is skewed by extreme rogue outliers.',
      sample_size: 9201,
    },
    {
      variable_1: 'orbital_period_days',
      variable_2: 'equilibrium_temperature_k',
      label_1: 'Orbital Period (days)',
      label_2: 'Equilibrium Temp (K)',
      pearson_r: -0.198,
      pearson_p: 1e-12,
      spearman_rho: -0.682,
      spearman_p: 1e-15,
      interpretation: "Strong negative rank correlation (Spearman ρ = -0.682), confirming Kepler's 3rd Law and inverse-square stellar irradiation: planets orbiting closer receive exponentially higher stellar flux.",
      sample_size: 9201,
    },
    {
      variable_1: 'orbital_period_days',
      variable_2: 'transit_duration_hours',
      label_1: 'Orbital Period (days)',
      label_2: 'Transit Duration (hrs)',
      pearson_r: 0.284,
      pearson_p: 1e-14,
      spearman_rho: 0.521,
      spearman_p: 1e-15,
      interpretation: 'Moderate positive correlation (Spearman ρ = 0.521). As orbital distance increases, orbital velocity decreases (v ~ 1/√a), lengthening the duration of star crossings.',
      sample_size: 9201,
    },
    {
      variable_1: 'stellar_effective_temperature_k',
      variable_2: 'equilibrium_temperature_k',
      label_1: 'Stellar Effective Temp (K)',
      label_2: 'Equilibrium Temp (K)',
      pearson_r: 0.448,
      pearson_p: 1e-15,
      spearman_rho: 0.496,
      spearman_p: 1e-15,
      interpretation: 'Moderate positive correlation (r = 0.448). Hotter host stars (O, B, A, F types) emit higher radiative luminosity, elevating planet equilibrium temperatures across their system.',
      sample_size: 9201,
    },
    {
      variable_1: 'planetary_radius_earth_radii',
      variable_2: 'transit_signal_to_noise_ratio',
      label_1: 'Planetary Radius (R⊕)',
      label_2: 'Transit Signal-to-Noise',
      pearson_r: 0.052,
      pearson_p: 0.001,
      spearman_rho: 0.635,
      spearman_p: 1e-15,
      interpretation: 'Strong positive rank correlation (Spearman ρ = 0.635). Larger planets block more flux, producing deeper transits that stand out significantly above detector photometric noise.',
      sample_size: 9201,
    },
  ];

  const features = [
    { key: 'orbital_period_days', label: 'Period' },
    { key: 'impact_parameter', label: 'Impact Param' },
    { key: 'transit_duration_hours', label: 'Duration' },
    { key: 'transit_depth_ppm', label: 'Depth' },
    { key: 'planetary_radius_earth_radii', label: 'Radius' },
    { key: 'equilibrium_temperature_k', label: 'Planet Temp' },
    { key: 'insolation_flux', label: 'Insolation' },
    { key: 'transit_signal_to_noise_ratio', label: 'SNR' },
    { key: 'stellar_effective_temperature_k', label: 'Star Temp' },
    { key: 'stellar_surface_gravity_log10', label: 'Star log(g)' },
    { key: 'stellar_radius_solar_radii', label: 'Star Radius' },
    { key: 'kepler_band_magnitude', label: 'Kep Mag' },
  ];

  const matrix = [
    [1.0, 0.01, 0.28, -0.02, 0.04, -0.2, -0.02, -0.06, 0.02, -0.01, 0.02, -0.03],
    [0.01, 1.0, 0.01, 0.01, 0.03, 0.02, -0.01, -0.04, 0.01, -0.04, 0.03, -0.01],
    [0.28, 0.01, 1.0, 0.08, 0.05, 0.16, 0.02, 0.11, 0.13, -0.19, 0.17, -0.08],
    [-0.02, 0.01, 0.08, 1.0, 0.04, 0.08, 0.03, 0.42, 0.02, -0.03, 0.02, -0.02],
    [0.04, 0.03, 0.05, 0.04, 1.0, 0.09, 0.02, 0.05, 0.02, -0.05, 0.04, 0.01],
    [-0.2, 0.02, 0.16, 0.08, 0.09, 1.0, 0.51, 0.15, 0.45, -0.54, 0.48, -0.22],
    [-0.02, -0.01, 0.02, 0.03, 0.02, 0.51, 1.0, 0.03, 0.11, -0.13, 0.12, -0.06],
    [-0.06, -0.04, 0.11, 0.42, 0.05, 0.15, 0.03, 1.0, 0.08, -0.11, 0.09, -0.13],
    [0.02, 0.01, 0.13, 0.02, 0.02, 0.45, 0.11, 0.08, 1.0, -0.56, 0.52, -0.29],
    [-0.01, -0.04, -0.19, -0.03, -0.05, -0.54, -0.13, -0.11, -0.56, 1.0, -0.66, 0.35],
    [0.02, 0.03, 0.17, 0.02, 0.04, 0.48, 0.12, 0.09, 0.52, -0.66, 1.0, -0.21],
    [-0.03, -0.01, -0.08, -0.02, 0.01, -0.22, -0.06, -0.13, -0.29, 0.35, -0.21, 1.0],
  ];

  const strongestCorrelations = [
    { var1: 'stellar_surface_gravity_log10', var2: 'stellar_radius_solar_radii', label1: 'Star log(g)', label2: 'Star Radius', correlation: -0.66, strength: 'Strong negative (surface gravity drops with star expansion g ~ M/R²)' },
    { var1: 'stellar_effective_temperature_k', var2: 'stellar_surface_gravity_log10', label1: 'Star Temp', label2: 'Star log(g)', correlation: -0.56, strength: 'Strong negative (hotter evolved giants have lower surface gravity)' },
    { var1: 'equilibrium_temperature_k', var2: 'stellar_surface_gravity_log10', label1: 'Planet Temp', label2: 'Star log(g)', correlation: -0.54, strength: 'Strong negative' },
    { var1: 'stellar_effective_temperature_k', var2: 'stellar_radius_solar_radii', label1: 'Star Temp', label2: 'Star Radius', correlation: 0.52, strength: 'Strong positive (luminous stars are larger & hotter)' },
    { var1: 'equilibrium_temperature_k', var2: 'insolation_flux', label1: 'Planet Temp', label2: 'Insolation Flux', correlation: 0.51, strength: 'Strong positive (Stefan-Boltzmann law F ~ T⁴)' },
  ];

  res.json({
    relationships,
    correlationMatrix: {
      features,
      matrix,
      strongestCorrelations,
    },
  });
});

// 8. Scatter Data Subsample Endpoint
app.get('/api/scatter-data', (req: Request, res: Response) => {
  const type = String(req.query.type || 'radius_depth');
  const confirmed = keplerDataset.filter((k) => k.exoplanet_archive_disposition === 'CONFIRMED');
  const candidates = keplerDataset.filter((k) => k.exoplanet_archive_disposition === 'CANDIDATE');
  const falsePositives = keplerDataset.filter((k) => k.exoplanet_archive_disposition === 'FALSE POSITIVE');

  const sampleArray = [
    ...confirmed.slice(0, 300),
    ...candidates.slice(0, 300),
    ...falsePositives.slice(0, 200),
  ];

  const points = sampleArray.map((k) => {
    let x = 0;
    let y = 0;
    if (type === 'radius_depth') {
      x = k.planetary_radius_earth_radii;
      y = k.transit_depth_ppm;
    } else if (type === 'period_temp') {
      x = k.orbital_period_days;
      y = k.equilibrium_temperature_k;
    } else if (type === 'period_duration') {
      x = k.orbital_period_days;
      y = k.transit_duration_hours;
    } else if (type === 'star_planet_temp') {
      x = k.stellar_effective_temperature_k;
      y = k.equilibrium_temperature_k;
    } else {
      x = k.planetary_radius_earth_radii;
      y = k.transit_signal_to_noise_ratio;
    }

    return {
      koi: k.koi_identifier,
      name: k.official_name,
      disposition: k.exoplanet_archive_disposition,
      x: isFinite(x) ? parseFloat(x.toFixed(2)) : 0,
      y: isFinite(y) ? parseFloat(y.toFixed(2)) : 0,
      radius: k.planetary_radius_earth_radii,
      period: k.orbital_period_days,
      score: k.screening_priority_score ?? null,
    };
  });

  res.json({ type, count: points.length, points });
});

// 9. Kepler AI Assistant (Server-Side Proxy with Resilient Fallback Ladder)
app.post('/api/chat', async (req: Request, res: Response) => {
  // Defensive Payload Ingestion (Null-Safe Destructuring)
  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const conversationHistory = Array.isArray(body.conversationHistory) ? body.conversationHistory : [];

  if (!message) {
    res.status(400).json({ error: 'Message text is required' });
    return;
  }

  const rawKey = process.env.GEMINI_API_KEY;
  const apiKey = (rawKey && rawKey !== 'MY_GEMINI_API_KEY' && rawKey.trim().length > 0) ? rawKey.trim() : undefined;

  const systemInstruction = `You are the NASA Kepler Exoplanet Analysis & Screening Platform AI Assistant (Team Hack vok, Team 21).
You possess deep expertise in Kepler mission data, exoplanetary transit physics, and machine learning candidate screening.

Cleaned Kepler Dataset Context:
- Cleaned dataset size: Exactly 9,201 Kepler Objects of Interest (KOIs) from DR25 data/raw/processed/kepler_cleaned.csv.
- Disposition breakdown: 2,292 Confirmed Exoplanets (24.9%), 2,185 Active Candidates (23.7%), 4,724 False Positives (51.3%).
- Key physical parameters: Orbital Period (days), Planetary Radius (R⊕, Earth radii), Transit Depth (ppm, parts-per-million), Transit Duration (hours), Equilibrium Temperature (K), Transit SNR, Stellar Effective Temp (K), Stellar Radius (R☉).
- Machine Learning Models:
  * Random Forest (200 trees, balanced weights): 89.84% Accuracy, 89.86% F1-score. Top features: Transit SNR, Orbital Period, Transit Depth, Planetary Radius.
  * Logistic Regression: 81.74% Accuracy.
- Screening Methodology:
  * Evaluates candidates with Random Forest class probabilities: P(confirmed) and P(candidate).
  * Screening Priority Score = (P(confirmed) + P(candidate)) * 100.
  * High Priority candidates have score >= 80% and represent prime targets for JWST or ground-based follow-up.
  * Notable candidates: K00749.01 (Kepler-226 c, 100% score), K00747.01 (Kepler-661 b, 100% score), K00756.02 (Kepler-228 c, 100% score), K01408.01 (1.36 R⊕ candidate, 100% score).
  * Note: Model screening scores represent algorithmic prioritization for follow-up observation, NOT definitive scientific confirmation.

Guidelines:
- Provide insightful, accurate, scientific, and accessible answers.
- Explain astronomical units clearly (e.g. R⊕ = Earth radii, ppm = parts per million flux drop, BKJD = Barycentric Kepler Julian Date).
- When asked about specific candidates, reference the screening priority score, transit parameters, and potential habitability.
- Keep responses well-structured with clear bullet points or short paragraphs. Avoid generic disclaimers.`;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const contents: any[] = [];

      for (const item of conversationHistory.slice(-6)) {
        if (item && typeof item.content === 'string') {
          contents.push({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: item.content }],
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const reply = await generateContentWithFallback(ai, {
        contents,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });

      res.json({ reply });
      return;
    } catch (err: any) {
      console.warn('Gemini API calls failed across fallback ladder, falling back to local analysis engine:', err?.message);
    }
  }

  // Local rule-based analytical engine fallback when API key is unavailable or external service fails
  const lower = message.toLowerCase();
  let fallbackReply = '';

  if (lower.includes('screen') || lower.includes('priority') || lower.includes('candidate')) {
    fallbackReply = `Based on the Kepler Random Forest Screening Model (results/tables/kepler_screening_results.csv):
- The pipeline evaluated Kepler objects using 12 astrophysical transit and stellar features.
- Candidates are prioritized using the Screening Priority Score: (P(confirmed) + P(candidate)) × 100.
- Top screened candidates include:
  • **K01408.01** (Unnamed Candidate): Radius 1.36 R⊕ (Earth-size), Period 14.53 days, Temp 420 K, Priority Score: 100.0%.
  • **K00749.01** (Kepler-226 c): Radius 2.55 R⊕, Period 5.35 days, Priority Score: 100.0%.
  • **K00747.01** (Kepler-661 b): Radius 2.85 R⊕, Period 6.03 days, Priority Score: 100.0%.
  • **K00756.02** (Kepler-228 c): Radius 2.77 R⊕, Period 4.13 days, Priority Score: 100.0%.
These high-priority objects exhibit exceptional transit SNR and pristine transit profiles without centroid offsets or stellar eclipses. Note that model scores represent algorithmic prioritization for follow-up observation rather than scientific confirmation.`;
  } else if (lower.includes('transit') || lower.includes('depth') || lower.includes('curve') || lower.includes('epoch')) {
    fallbackReply = `Transit Light Curve & Ephemeris Principles:
1. **Transit Depth (ppm)**: Measures relative dimming of the host star: ΔF/F ≈ (R_planet / R_star)². An Earth-sized planet passing across a Sun-like star produces a ~84 ppm dip, while a Jupiter-sized planet produces ~10,000 ppm (1%).
2. **Transit Duration**: Typically 1 to 8 hours for close-in Kepler systems, governed by stellar radius, orbital period, and impact parameter b.
3. **Barycentric Kepler Julian Date (BKJD)**: BKJD = BJD - 2454833.0, referencing the solar system barycenter.
4. **Ephemeris Timing**: Future transits occur at t_n = t_0 + n × Period. You can view real-time live countdowns and predictions in the 3D Observatory and Transit Studio!`;
  } else if (lower.includes('model') || lower.includes('random forest') || lower.includes('logistic') || lower.includes('accuracy')) {
    fallbackReply = `Machine Learning Model Comparison:
- **Random Forest (200 Estimators)**: Achieved **89.84% accuracy** (F1: 0.8986). It captures complex non-linear interactions between transit depth, planetary radius, and transit signal-to-noise ratio.
- **Logistic Regression (Standardized)**: Achieved **81.74% accuracy** (F1: 0.8177).
- **Top 4 Predictive Features**:
  1. Transit Signal-to-Noise Ratio (SNR) (17.8% importance)
  2. Orbital Period (13.4% importance)
  3. Transit Depth (12.7% importance)
  4. Planetary Radius (12.0% importance)`;
  } else if (lower.includes('earth') || lower.includes('habitable') || lower.includes('kepler-22')) {
    fallbackReply = `Earth-Like Candidates & Habitability in Kepler Data:
- Terrestrial classification corresponds to planetary radius **< 1.25 to 1.5 Earth radii (R⊕)**.
- The equilibrium temperature zone for potential liquid water habitability ranges between **240 K and 330 K**.
- **Kepler-22 b (K00087.01)** orbits in its host star's habitable zone with an orbital period of 289.86 days and equilibrium temperature of 262 K.
- You can filter the archive in the **Planet Explorer** tab with:
  • Max Radius: 1.5 R⊕
  • Min Temperature: 220 K
  • Max Temperature: 340 K
  • Disposition: CANDIDATE or CONFIRMED.`;
  } else {
    fallbackReply = `Welcome to the NASA Kepler Exoplanet Analysis Platform!
Here is what you can explore:
• **Dashboard**: Global dataset telemetry across all 9,201 Kepler objects (2,292 Confirmed, 2,185 Candidates, 4,724 False Positives).
• **Planet Explorer**: Search and filter by radius, orbital period, temperature, transit depth, duration, and SNR against actual records.
• **Candidate Screening**: Inspect the 200-tree Random Forest priority rankings for follow-up.
• **3D Observatory & Countdown**: Observe real-time synchronized Keplerian transits with GLSL surface shaders.
• **Transit Studio**: Simulate synthetic transit dips and predict upcoming ephemeris dates.
• **ML Analysis & Statistics**: Inspect model benchmarks, confusion matrices, and rank correlations.

Feel free to ask about any Kepler object (e.g. "Tell me about Kepler-22 b", "Inspect K01408.01", or "How does transit depth relate to planet radius?").`;
  }

  res.json({ reply: fallbackReply });
});

// Setup Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kepler Exoplanet Platform running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

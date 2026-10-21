export interface KeplerRecord {
  rowid: number;
  kepler_id: number;
  koi_identifier: string;
  official_name: string;
  exoplanet_archive_disposition: 'CONFIRMED' | 'CANDIDATE' | 'FALSE POSITIVE' | string;
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
  // Screening fields (if available)
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

export interface UpcomingTransitPrediction {
  transitNumber: number;
  predictedBkjd: number;
  predictedDateIso?: string;
  daysFromNow: number;
}

export interface CandidateDetailResponse {
  candidate: KeplerRecord;
  classification: {
    planetClass: string;
    thermalZone: string;
  };
  nextTransit: TransitTelemetry;
  upcomingTransits: UpcomingTransitPrediction[];
  lightCurve: { timeOffsetHours: number; flux: number }[];
  screening: {
    hasScreening: boolean;
    probability_candidate: number | null;
    probability_confirmed: number | null;
    probability_false_positive: number | null;
    screening_priority_score: number | null;
    priority_tier: 'High Priority' | 'Medium Priority' | 'Low Priority' | null;
    disclaimer: string;
  };
}

export interface ScreeningCandidate extends KeplerRecord {
  probability_candidate: number;
  probability_confirmed: number;
  probability_false_positive: number;
  screening_priority_score: number;
  priority_tier: 'High Priority' | 'Medium Priority' | 'Low Priority';
}

export interface DatasetOverview {
  totalObjects: number;
  dispositionCounts: {
    CONFIRMED: number;
    CANDIDATE: number;
    FALSE_POSITIVE: number;
  };
  dispositionPercentages: {
    CONFIRMED: number;
    CANDIDATE: number;
    FALSE_POSITIVE: number;
  };
  summaryStats: {
    radius: { min: number; max: number; avg: number; median: number };
    period: { min: number; max: number; avg: number; median: number };
    temperature: { min: number; max: number; avg: number; median: number };
    transitDepth: { min: number; max: number; avg: number; median: number };
    snr: { min: number; max: number; avg: number; median: number };
    stellarTemp: { min: number; max: number; avg: number; median: number };
  };
  topScreenedCandidatesCount: number;
}

export interface MLMetrics {
  models: {
    logisticRegression: {
      name: string;
      accuracy: number;
      precision: number;
      recall: number;
      f1: number;
      confusionMatrix: {
        classes: string[];
        matrix: number[][];
      };
    };
    randomForest: {
      name: string;
      accuracy: number;
      precision: number;
      recall: number;
      f1: number;
      confusionMatrix: {
        classes: string[];
        matrix: number[][];
      };
    };
  };
  featureImportance: {
    feature: string;
    label: string;
    importance: number;
  }[];
}

export interface CorrelationRelationship {
  variable_1: string;
  variable_2: string;
  label_1: string;
  label_2: string;
  pearson_r: number;
  pearson_p: number;
  spearman_rho: number;
  spearman_p: number;
  interpretation: string;
  sample_size: number;
}

export interface CorrelationMatrixData {
  features: { key: string; label: string }[];
  matrix: number[][];
  strongestCorrelations: {
    var1: string;
    var2: string;
    label1: string;
    label2: string;
    correlation: number;
    strength: string;
  }[];
}

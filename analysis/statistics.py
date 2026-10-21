import pandas as pd
from scipy.stats import pearsonr, spearmanr
from analysis.data_loader import load_data

FEATURES = [
    "orbital_period_days", "impact_parameter", "transit_duration_hours",
    "transit_depth_ppm", "planetary_radius_earth_radii", "equilibrium_temperature_k",
    "insolation_flux", "transit_signal_to_noise_ratio", "stellar_effective_temperature_k",
    "stellar_surface_gravity_log10", "stellar_radius_solar_radii", "kepler_band_magnitude",
]

def calculate_pearson_correlation(df: pd.DataFrame, column1: str, column2: str) -> dict:
    data = df[[column1, column2]].dropna()
    correlation, p_value = pearsonr(data[column1], data[column2])
    return {"variable_1": column1, "variable_2": column2, "correlation": correlation, "p_value": p_value, "sample_size": len(data)}

def calculate_spearman_correlation(df: pd.DataFrame, column1: str, column2: str) -> dict:
    data = df[[column1, column2]].dropna()
    correlation, p_value = spearmanr(data[column1], data[column2])
    return {"variable_1": column1, "variable_2": column2, "correlation": correlation, "p_value": p_value, "sample_size": len(data)}

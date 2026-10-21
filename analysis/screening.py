import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from analysis.data_loader import load_data

FEATURES = [
    "orbital_period_days",
    "impact_parameter",
    "transit_duration_hours",
    "transit_depth_ppm",
    "planetary_radius_earth_radii",
    "equilibrium_temperature_k",
    "insolation_flux",
    "transit_signal_to_noise_ratio",
    "stellar_effective_temperature_k",
    "stellar_surface_gravity_log10",
    "stellar_radius_solar_radii",
    "kepler_band_magnitude",
]

TARGET = "exoplanet_archive_disposition"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
RESULTS_DIR = PROJECT_ROOT / "results" / "tables"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

def prepare_data(df):
    available_features = [f for f in FEATURES if f in df.columns]
    required_columns = available_features + [TARGET]
    data = df[required_columns].dropna()
    X = data[available_features]
    y = data[TARGET]
    return X, y

def train_screening_model(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    model = RandomForestClassifier(
        n_estimators=200, random_state=42, class_weight="balanced"
    )
    model.fit(X_train, y_train)
    return model

def generate_screening_results(df, model, X):
    probabilities = model.predict_proba(X)
    class_names = model.classes_
    probability_df = pd.DataFrame(
        probabilities,
        columns=[f"probability_{c.lower().replace(' ', '_')}" for c in class_names],
        index=X.index
    )
    results = df.loc[X.index].copy()
    results = pd.concat([results, probability_df], axis=1)
    results["screening_priority_score"] = (
        (results["probability_confirmed"] + results["probability_candidate"]) * 100
    )
    results = results.sort_values(by="screening_priority_score", ascending=False)
    return results

if __name__ == "__main__":
    df = load_data()
    X, y = prepare_data(df)
    model = train_screening_model(X, y)
    results = generate_screening_results(df, model, X)
    top_candidates = results.head(50)
    output_path = RESULTS_DIR / "kepler_screening_results.csv"
    top_candidates.to_csv(output_path, index=False)
    print(f"Saved top 50 screening results to: {output_path}")

import pandas as pd
from analysis.data_loader import load_data
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

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

def prepare_ml_data(df: pd.DataFrame):
    available_features = [f for f in FEATURES if f in df.columns]
    required_columns = available_features + [TARGET]
    data = df[required_columns].dropna()
    X = data[available_features]
    y = data[TARGET]
    return X, y

def train_logistic_regression(X_train, X_test, y_train, y_test):
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    model = LogisticRegression(max_iter=2000, random_state=42)
    model.fit(X_train_scaled, y_train)
    predictions = model.predict(X_test_scaled)
    return model, scaler, predictions

def train_random_forest(X_train, X_test, y_train, y_test):
    model = RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced")
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)
    return model, predictions

def evaluate_model(y_test, predictions):
    return {
        "accuracy": accuracy_score(y_test, predictions),
        "precision": precision_score(y_test, predictions, average="weighted", zero_division=0),
        "recall": recall_score(y_test, predictions, average="weighted", zero_division=0),
        "f1": f1_score(y_test, predictions, average="weighted", zero_division=0),
    }

if __name__ == "__main__":
    df = load_data()
    X, y = prepare_ml_data(df)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
    lr_model, scaler, lr_preds = train_logistic_regression(X_train, X_test, y_train, y_test)
    rf_model, rf_preds = train_random_forest(X_train, X_test, y_train, y_test)
    print("LR Results:", evaluate_model(y_test, lr_preds))
    print("RF Results:", evaluate_model(y_test, rf_preds))

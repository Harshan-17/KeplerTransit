from pathlib import Path
import pandas as pd

# Project root directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Cleaned Kepler dataset
DATA_PATH = PROJECT_ROOT / "data" / "raw" / "processed" / "kepler_cleaned.csv"

def load_data() -> pd.DataFrame:
    """
    Load the cleaned Kepler dataset.
    Returns:
        pd.DataFrame: Cleaned Kepler dataset.
    """
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Kepler dataset not found at: {DATA_PATH}"
        )
    return pd.read_csv(DATA_PATH)

if __name__ == "__main__":
    df = load_data()
    print("Kepler dataset loaded successfully!")
    print(f"Shape: {df.shape}")
    print("\nColumns:")
    print(df.columns.tolist())
    print("\nFirst 5 rows:")
    print(df.head())

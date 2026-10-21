# Team21_KeplerExoplanetSearchResults

## Kepler Exoplanet Analysis & Screening Platform
**AI-Assisted Kepler Exoplanet Analysis Platform: Exploring Exoplanet Candidates with AI, Machine Learning & Data Visualization**  
*Team: Hack vok (Team 21)*

---

### Overview
This platform provides an interactive, full-stack environment for exploring, screening, and classifying 9,201 Kepler Objects of Interest (KOIs) from NASA's Kepler mission archive (DR25 cleaned dataset).

---

### Core Architectural Features

1. **Interactive 3D WebGL Space Observatory & Real-Time Ephemeris**
   - Cinematic full-viewport Three.js / React Three Fiber scene with deep-space starfields, radiant host star at origin (dynamically colored by spectral temperature), and locked top-down cinematic camera perspective showcasing the continuous orbital trajectory ring.
   - Genuine GLSL vertex and fragment shader with real-time pointer-responsive surface displacement: localized bulges, elastic dents, procedural biomes, dynamic central stellar lighting, and expanding seismic shockwave ripples.
   - Smooth, automatic orbital rotation for the exoplanet around the central host star with locked observatory perspective (zero camera drag controls).
   - Sleek bottom observatory telemetry HUD dynamically synchronized with calculated NASA Kepler ephemeris timestamps from reference transit epoch $t_0$ and orbital period $P$.
   - Live target switching across featured exoplanets (Kepler-22 b, Kepler-10 b, Kepler-226 c, Kepler-227 b, Kepler-661 b, K01408.01, Kepler-228 c) or any object from the 9,201 archive via quick search.

2. **Complete Exoplanet Explorer & Multi-Parameter Filter Engine**
   - Reliable search across KOI identifiers (e.g. `K00087.01`), official Kepler planet names (e.g. `Kepler-22 b`), and Kepler IDs (e.g. `10797460`).
   - Filter by archive classification: Confirmed (2,292), Active Candidates (2,185), False Positives (4,724).
   - Numerical range filters for Planetary Radius ($R_\oplus$), Orbital Period ($d$), Equilibrium Temperature ($K$), Transit Depth ($\text{ppm}$), Transit Duration ($\text{hours}$), and Transit Signal-to-Noise Ratio (SNR).
   - "Only Screened Targets" toggle to filter for candidates with machine learning prioritization scores.
   - Sorting, pagination (10, 25, 50, 100 per page), page jump, loading indicators, and empty result recovery.
   - Instant "Inspect Profile" and "Set as Active Planet in 3D Observatory" actions on every candidate.

3. **Machine Learning Candidate Screening Pipeline**
   - Random Forest model (200 estimators, balanced weights) yielding class probabilities: $P(\text{confirmed})$, $P(\text{candidate})$, $P(\text{false positive})$.
   - **Screening Priority Score**: $(P(\text{confirmed}) + P(\text{candidate})) \times 100$.
   - High, Medium, and Low priority tiers for telescope observation follow-up.
   - Clear scientific disclaimers distinguishing algorithmic screening scores from observational confirmation.

4. **Detailed Astrophysical Planet Profile & Ephemeris Telemetry**
   - Displays real parameters with scientific units: radius, orbital period, equilibrium temperature, insolation flux, transit duration, transit depth, stellar temperature, stellar radius, surface gravity $\log g$, Kepler magnitude, SNR, and impact parameter $b$.
   - Clear "Unavailable" states for missing or unmeasured parameters without fabricating numbers.
   - Real-time predicted upcoming 5 transit timestamps calculated via $t_n = t_0 + n \times P$.
   - Synthetic limb-darkened transit light curve SVG plot.
   - Direct action to synchronize the candidate with the 3D space scene or simulate in Transit Studio.

5. **Transit Studio & Light Curve Simulator**
   - Interactive transit simulator demonstrating $\Delta F / F \approx (R_p / R_*)^2$.
   - Dynamic real-time Barycentric Kepler Julian Date (BKJD) conversion: $\text{BKJD} = \text{BJD} - 2454833.0$.
   - Direct candidate parameter ingestion from the Kepler archive into the simulator.

6. **Machine Learning Model Comparison & Statistical Insights**
   - Random Forest (89.84% accuracy, 89.86% F1) vs. Logistic Regression (81.74% accuracy).
   - Confusion matrices and Gini feature importance analysis (Transit SNR, Orbital Period, Transit Depth, Planet Radius).
   - Bivariate relationship tests with Pearson $r$ and Spearman $\rho$ rank correlation + $p$-values.
   - 12×12 feature correlation heatmap and high-resolution research figures gallery.

7. **Kepler AI Research Assistant**
   - Natural language query engine with resilient model fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`).
   - Context-grounded in the cleaned 9,201 Kepler dataset and Random Forest screening outputs.

---

### Google Cloud Run Deployment & Configuration Guide

#### 1. Environment & Prerequisites
Enable necessary Google Cloud APIs:
```bash
gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
```

#### 2. Secret Management Setup
Store operational secrets securely in Google Cloud Secret Manager (never commit credentials into codebase):
```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant default Cloud Run runtime service account permission to read secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### 3. Database Security Configuration
Cloud Firestore security rules supporting owner-bound user isolation:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### 4. Cloud Run Deployment Flow
Build and deploy the application container to Google Cloud Run:
```bash
gcloud run deploy kepler-observatory \
  --source . \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest
```

#### 5. Required Campaign Labeling (Verification Binding)
Apply the mandatory resource label to register the service for automated challenge verification:
```bash
gcloud run services update kepler-observatory \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-east1
```

---

### Local Development
```bash
npm install
npm run dev
```
The application boots on `http://0.0.0.0:3000`.

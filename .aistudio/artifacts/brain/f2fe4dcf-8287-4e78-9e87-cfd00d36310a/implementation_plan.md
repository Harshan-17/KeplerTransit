# Kepler Observatory — Complete Website Experience Redesign Plan (Final Approved)

A focused architectural and design plan to transform the NASA Kepler Exoplanet Observatory web application into a premium, cinematic, interactive scientific experience. Focuses exclusively on frontend UI/UX, scroll-driven 3D planetary storytelling in the Observatory, and comprehensive research dashboard refinements—achieving instant 5-second clarity for hackathon judges while strictly preserving 100% of existing datasets, backend API contracts, machine learning diagnostics, and transit calculations. (Deployment and serverless hosting configuration are deferred to a separate final phase).

---

## User Review & Critical Directives (Strict Verification Mandate)

> [!IMPORTANT]
> The following directives govern the scope, data integrity, and execution of this website-experience redesign phase:

1. **Live Backend Grounding & Reference Verification (Zero Fabrication)**:
   All numerical values, counts, statistical metrics, ML benchmarks, and planetary properties mentioned in this plan and shown in the UI are **references to verify directly against the running application and live backend responses** (`/api/overview`, `/api/candidates`, `/api/screening`, `/api/ml`, `/api/statistics`, `/api/scatter-data`). No numbers may be hardcoded. The source of truth is always the authoritative data loaded from `data/raw/processed/kepler_cleaned.csv` and `results/tables/kepler_screening_results.csv`.
2. **Frontend Experience Focus Only**:
   Deployment adapters, Vercel configs, and serverless migrations are excluded from this phase. The application continues running on its existing Node.js/Express backend (`server.ts`) and authoritative datasets.
3. **Streamlined 4-Pillar Navigation Structure**:
   Top-level navigation is organized into 4 primary destinations:
   - **Observatory** (Cinematic 3D planetary stage, scroll-driven storytelling, host star physics, and live BKJD countdown).
   - **Explore** (Interactive 9,200+ exoplanet catalog, multi-dimensional filters, quick previews, and slide-out telemetry drawer).
   - **Research / Analysis** (Consolidated scientific workspace with 4 dedicated sub-modules: *Candidate Screening*, *Transit Studio*, *ML Models*, and *Statistical Insights*).
   - **Kepler AI** (Grounded research chatbot backed by server-side Gemini integration and dataset context).
4. **100% Capability & Interaction Preservation**:
   Every former dashboard, control slider, chart, filter, CSV export, calculation, and interaction remains accessible and fully functional within its designated destination.
5. **Observatory Scroll-Driven Planetary Storytelling**:
   The Observatory features a multi-stage scroll journey (Orbital View $\rightarrow$ Transit Ingress Alignment $\rightarrow$ Atmospheric Inspection $\rightarrow$ Planetary Fact Breakdown $\rightarrow$ Real-Time Telemetry Dock) with smooth camera interpolation and facts revealed along the way.
6. **Unified 5-Second Clarity & Slide-Out Telemetry Drawer**:
   Every dashboard features a standardized header (Title + single-sentence purpose kicker), 3–4 essential KPI cards, a dominant visualization, and collapsible deep parameter controls. Exoplanet deep-dives open in a slide-out drawer that preserves scroll position and active tab context.

---

## 1. Consolidated Navigation & Feature Preservation Matrix

### 4-Pillar Navigation Contract

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    TOP NAVIGATION BAR (Zone Contract)                           │
│  [Wordmark: KEPLER OBSERVATORY]   —   [Observatory]  [Explore]  [Research]  [Kepler AI]   —    [Mission Clock] │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Complete Capability-to-Destination Mapping Matrix

| Original Capability | Former Location | New Consolidated Location | Authoritative Backend Source | Working Controls & Features Preserved |
|---|---|---|---|---|
| **Host Star & Orbit Viewport** | Overview Tab | **Observatory** | Three.js WebGL / Procedural Shaders | Continuous orbit revolution, GLSL displacement shader, pointer lighting, dynamic stellar temperature color. |
| **Real-Time Transit Countdown** | Overview Tab | **Observatory** | `/api/transits/featured` | Real BKJD ephemeris calculation, days/hrs/mins/secs countdown, orbital progress bar, target switcher. |
| **Mission Telemetry Overview** | Overview Tab | **Observatory** | `/api/overview` | Dynamic counts for Total KOIs, Confirmed, Candidates, False Positives, radius/period/temp stats. |
| **Exoplanet Search & Catalog** | Explorer Tab | **Explore** | `/api/candidates` | Live search input, debounced query, disposition segmented filter, sortable columns, pagination. |
| **Multi-Dimensional Filters** | Explorer Tab | **Explore** (Collapsible Filter Panel) | `/api/candidates` query params | Min/Max Radius, Orbital Period, Equilibrium Temp, Transit Depth, Duration, SNR range sliders. |
| **Candidate Export & Selection** | Explorer Tab | **Explore** | Client CSV generator | CSV export button, row click to open Slide-Out Telemetry Drawer. |
| **Candidate Screening Queue** | Screening Tab | **Research** $\rightarrow$ **Screening** | `/api/screening` | Screened KOIs from `kepler_screening_results.csv`, RF class probabilities ($P_{\text{confirmed}}, P_{\text{candidate}}$). |
| **Screening Priority Filters** | Screening Tab | **Research** $\rightarrow$ **Screening** | Dynamic client filter | Priority tier filters (High, Medium, Low), threshold sliders. |
| **Custom Screening Weights** | Screening Tab | **Research** $\rightarrow$ **Screening** (Collapsible Panel) | Client scoring engine | Interactive weight adjustments for SNR, Habitability, and False Positive Rejection. |
| **Mandel-Agol Light Curve** | Transit Studio | **Research** $\rightarrow$ **Transit** | Mathematical transit physics | Interactive SVG curve canvas with limb-darkening profile and raw photometric scatter points. |
| **Transit Simulation Sliders** | Transit Studio | **Research** $\rightarrow$ **Transit** | Client physics engine | $R_p/R_*$ ratio, impact parameter $b$, period, duration, synthetic detector noise slider. |
| **Transit Studio Presets** | Transit Studio | **Research** $\rightarrow$ **Transit** | Preset configurations | *Earth-Sun Analog*, *Hot Jupiter*, *Super-Earth (Kepler-22 b)* one-click presets. |
| **Model Performance Metrics** | ML Models Tab | **Research** $\rightarrow$ **ML Diagnostics** | `/api/ml` | Live model metrics for Random Forest and Logistic Regression (accuracy, precision, recall, F1). |
| **Interactive Confusion Matrix** | ML Models Tab | **Research** $\rightarrow$ **ML Diagnostics** | `/api/ml` | 3×3 matrix (Candidate, Confirmed, False Positive) with hover breakdown and class tooltips. |
| **Feature Importance Ranking** | ML Models Tab | **Research** $\rightarrow$ **ML Diagnostics** (Collapsible) | `/api/ml` | Ranked bar chart for all 12 model features (Transit SNR, Period, Depth, Radius, Temp, etc.). |
| **Radius Valley Bimodality** | Statistics Tab | **Research** $\rightarrow$ **Statistics** | `/api/overview` & `/api/scatter-data` | Distribution chart illustrating the empirical rocky vs. gaseous exoplanet valley. |
| **Period vs. Temp Scatter** | Statistics Tab | **Research** $\rightarrow$ **Statistics** | `/api/scatter-data` | Interactive scatter plot with disposition-coded dots, zoom, and candidate tooltip inspection. |
| **12×12 Correlation Matrix** | Statistics Tab | **Research** $\rightarrow$ **Statistics** (Collapsible) | `/api/statistics` | Pearson $r$ and Spearman $\rho$ heatmap with exact values, p-values, and physical interpretations. |
| **Grounded Kepler Assistant** | Assistant Tab | **Kepler AI** | `/api/chat` | Server-side Gemini proxy with model fallback ladder, prompt suggestion chips, dataset grounding. |
| **Candidate Deep Inspection** | Modal Dialog | **Global Slide-Out Drawer** | `/api/candidates/:id` | Full physical properties, upcoming 5 transits, synthetic limb-darkened curve, "Sync with Observatory", "Open in Transit Studio". |

---

## 2. Interaction & Visual Redesign by Dashboard

### A. Observatory: Cinematic Planetary Storytelling
- **Scroll-Driven Camera & Storytelling**:
  - Pinned 3D canvas smoothly interpolates camera position, orientation, and focus across 5 storytelling phases:
    1. **Phase 1 (System Overhead, 0% Scroll)**: Central host star with radiant corona and color tied to spectral temperature ($T_{\text{eff}}$); revolving planet with illuminated orbital guide ring; centered monumental countdown timer.
    2. **Phase 2 (Transit Alignment, 25% Scroll)**: Camera dips toward the orbital plane, aligning host star and planet to demonstrate light obstruction and the geometric transit chord.
    3. **Phase 3 (Atmospheric Close-Up, 50% Scroll)**: Smooth camera tracking sweeps into close orbit around the exoplanet, displaying GLSL terrain displacement, terminator atmospheric scattering, and day/night contrast.
    4. **Phase 4 (Discovery Dossier, 75% Scroll)**: Floating glass telemetry cards reveal key physical metrics ($R_p$, $T_{\text{eq}}$, orbital period, insolation flux) benchmarked against Earth.
    5. **Phase 5 (Mission Telemetry & KPI Strip, 100% Scroll)**: Smoothly docks into the live mission status grid loaded dynamically from `/api/overview`.
- **Controls & Telemetry**:
  - Quick target selector chips for featured exoplanets (Kepler-22 b, Kepler-452 b, Kepler-186 f, Kepler-661 b) + quick-search modal for all KOIs.
  - Live BKJD transit countdown with animated aura, orbital progress bar, and tick rhythm.

### B. Explore: Interactive Catalog & Instant Telemetry
- **5-Second Clarity**: *"Search, filter, and inspect over 9,200 exoplanetary candidates discovered by NASA's Kepler Mission."*
- **KPI Summary Row**: 4 cards dynamically calculated from `/api/candidates` filtered response:
  - Total Filtered Targets
  - Confirmed World Ratio (%)
  - Habitable Zone Candidates (Count)
  - Median Planetary Radius ($R_\oplus$)
- **Interactive Experience**:
  - Fast search input with debouncing and segmented disposition tabs (`All`, `Confirmed`, `Candidate`, `False Positive`, `Habitable Zone`).
  - Collapsible secondary filter drawer (Period, Depth, Temp range sliders).
  - High-density data grid (40px row height) with tabular figures (`font-mono tabular-nums`), unboxed metadata separated by typographic dots (`·`), and thermal color indicators.
  - Clicking any row smoothly slides out the **Slide-Out Telemetry Drawer** without page reload.

### C. Research / Analysis: Unified Scientific Workspace
A clean segmented tab control (`[Candidate Screening] · [Transit Studio] · [ML Diagnostics] · [Statistical Insights]`) allows switching between disciplines with smooth cross-fades (`motion.div` with spring settling).

1. **Candidate Screening**:
   - **5-Second Clarity**: *"Prioritize candidates for spectroscopic follow-up using calibrated habitability and signal vetting scores."*
   - **KPI Strip**: Vetted Candidates Count, Tier-1 High Priority Count, Mean Priority Score, Habitable Candidates.
   - **Primary Visual**: Interactive priority tier scatter/distribution chart visualizing vetting score against transit SNR.
   - **Collapsible Panel**: Scoring algorithm weight sliders (SNR weight, habitability bonus, false positive penalty).
2. **Transit Studio**:
   - **5-Second Clarity**: *"Simulate and fit photometric light curves using the Mandel-Agol transit model."*
   - **KPI Strip**: Transit Depth (ppm), Ingress/Egress Duration, Impact Parameter ($b$), Radius Ratio ($R_p/R_*$).
   - **Primary Visual**: High-contrast interactive SVG light curve canvas displaying animated draw-in curves, limb-darkening profile, and real photometric scatter points.
   - **Interactive Controls**: Parameter sliders for $R_p/R_*$, impact parameter $b$, transit duration, and synthetic noise. Quick presets (*Earth-Sun*, *Hot Jupiter*, *Super-Earth*).
3. **ML Diagnostics**:
   - **5-Second Clarity**: *"Evaluate Random Forest vs. baseline models on planetary classification."*
   - **KPI Strip**: Model Accuracies, F1-Scores, False Positive Rejection rates, and Top Ranked Features from `/api/ml`.
   - **Primary Visual**: Interactive 3×3 confusion matrix with row/column precision-recall highlights and model comparison bar chart.
   - **Collapsible Panel**: 12-feature importance ranking chart and ROC curve breakdown.
4. **Statistical Insights**:
   - **5-Second Clarity**: *"Discover empirical distributions and cross-parameter correlations across the Kepler catalog."*
   - **KPI Strip**: Total Sample Size, Radius Valley Boundary, Key Correlation coefficients, and Mean Equilibrium Temp.
   - **Primary Visual**: Radius valley bimodal distribution chart with logarithmic axis scaling.
   - **Collapsible Panel**: 12×12 Pearson correlation heatmap with statistical significance ($p < 0.001$) and analytical interpretations.

### D. Kepler AI: Grounded Astrophysical Research Assistant
- **5-Second Clarity**: *"Query the Kepler astrophysical archive using an AI assistant grounded in observational data."*
- **Interaction Quality**:
  - Clean conversational thread with auto-scrolling and typewriter streaming effect.
  - Curated research inquiry prompt chips (*"Which candidates sit in the habitable zone?"*, *"Why is Kepler-661 b a 100% priority candidate?"*, *"Explain how transit depth reveals planetary radius"*).
  - Explicit scientific grounding badges showing exact dataset figures and units.
  - Server-side fallback ladder (`gemini-3.6-flash` $\rightarrow$ `gemini-3.1-flash-lite` $\rightarrow$ `gemini-flash-latest`) preventing API interruptions.

### E. Global Candidate Detail Drawer (Slide-Out Experience)
- Replaces bulky modals with an elegant, responsive slide-out drawer from the right edge of the screen (`w-full sm:max-w-xl md:max-w-2xl`).
- Displays complete scientific dossier: KOI identifier, official Kepler name, archive disposition, planetary radius, orbital period, transit depth, equilibrium temperature, stellar host parameters.
- Mini interactive transit light curve preview and upcoming 5 transit timestamps calculated from live BKJD.
- Primary CTA buttons:
  - *"Sync with 3D Observatory"* (updates 3D planet textures, star temperature, and transit countdown).
  - *"Open in Transit Studio"* (loads candidate parameters directly into the light curve simulator).

---

## 3. Motion, Interaction & Responsive Design System

### Motion Language (Framer Motion & Tailwind)
- **Fluid Micro-Interactions**: Hover states and tab switches settle within 150–200ms using `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Chart Reveals**: SVG paths and bar elements animate on entry using staggered delays for a responsive feel.
- **Scroll-Driven Parallax**: Smooth interpolation linked to scroll position in the Observatory view, transforming 3D camera angles and revealing editorial cards.
- **Accessibility & Reduced Motion**: Automatically detects `prefers-reduced-motion: reduce` to disable continuous rotation and replace scroll-driven camera sweeps with clean, immediate transitions.
- **WebGL Fallbacks**: Graceful fallback with high-resolution canvas gradients and telemetry overlays if WebGL is unavailable on older mobile browsers.

### Color & Spatial Discipline (60-30-10 Rule)
- **60% Dominant Neutral**: Deep obsidian black (`#07090E` / `#020409`) evoking authentic deep space.
- **30% Structural Panels**: Flat slate panels (`#0F172A`/85 with `backdrop-blur-xl`) with 1px hairline borders (`border-cyan-500/15` or `border-white/10`).
- **10% Calibrated Accents**:
  - Laser Cyan (`#06B6D4` / `#38BDF8`): Primary actions, active indicators, transit curves.
  - Emerald Green (`#10B981`): Confirmed planetary worlds and high-confidence metrics.
  - Telemetry Amber (`#F59E0B`): Active candidate queue and habitable zone flags.
  - Stellar Gold (`#FCD34D`): Stellar spectral classes.

---

## 4. Incremental Implementation Sequence & Milestones

1. **Step 1: Navigation Consolidation & Design System Tokens**
   - Update `Navbar.tsx` to display the four primary destinations (`Observatory`, `Explore`, `Research / Analysis`, `Kepler AI`).
   - Create `ResearchHub.tsx` consolidating Candidate Screening, Transit Studio, ML Models, and Statistical Insights with sleek segmented sub-navigation.
   - Refactor `App.tsx` state to coordinate top-level navigation, sub-tab routing, and planetary selection.

2. **Step 2: Global Slide-Out Telemetry Drawer**
   - Refactor `CandidateDetailModal.tsx` into a responsive, high-performance slide-out `CandidateDetailDrawer.tsx`.
   - Wire cross-tab actions (*"Sync with 3D Observatory"*, *"Open in Transit Studio"*).

3. **Step 3: Observatory Scroll-Driven Planetary Experience**
   - Enhance `SpaceHero.tsx` and `OverviewTab.tsx` with smooth scroll-driven camera choreography and planetary storytelling milestones.
   - Preserve real BKJD calculation, big countdown timer, and featured planet selector.

4. **Step 4: Dashboard Interaction & 5-Second Clarity Pass**
   - Refine `ExplorerTab.tsx` with unboxed typography, collapsible parameter drawer, and smooth candidate transitions.
   - Polish `ScreeningTab.tsx`, `TransitStudioTab.tsx`, `MLAnalysisTab.tsx`, and `StatisticsTab.tsx` with standardized 5-second kickers, essential KPI strips, and animated chart reveals.
   - Polish `AIAssistantTab.tsx` with smooth message rendering and research inquiry chips.

5. **Step 5: End-to-End Verification & Build Validation**
   - Verify every endpoint (`/api/overview`, `/api/candidates`, `/api/candidates/:id`, `/api/screening`, `/api/ml`, `/api/statistics`, `/api/scatter-data`, `/api/chat`).
   - Verify responsive layouts across desktop, tablet, and mobile.
   - Run `compile_applet` and `lint_applet` to confirm zero errors.

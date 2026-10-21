import React, { useState, useEffect } from 'react';
import {
  Cpu,
  BarChart,
  CheckCircle2,
  TrendingUp,
  Sliders,
  Layers,
  Sparkles,
  Info,
  GitCompare,
  Gauge,
  Activity,
} from 'lucide-react';
import { MLMetrics } from '../types/kepler';

export const MLAnalysisTab: React.FC = () => {
  const [data, setData] = useState<MLMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<'randomForest' | 'logisticRegression'>('randomForest');

  useEffect(() => {
    setLoading(true);
    fetch('/api/ml')
      .then((res) => res.json())
      .then((mlData) => {
        setData(mlData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load ML metrics', err);
        setLoading(false);
      });
  }, []);

  const rfAcc = data?.models.randomForest.accuracy ?? 0.8984;
  const rfPrec = data?.models.randomForest.precision ?? 0.8995;
  const rfRec = data?.models.randomForest.recall ?? 0.8984;
  const rfF1 = data?.models.randomForest.f1 ?? 0.8986;

  const lrAcc = data?.models.logisticRegression.accuracy ?? 0.8174;
  const lrPrec = data?.models.logisticRegression.precision ?? 0.8192;
  const lrRec = data?.models.logisticRegression.recall ?? 0.8174;
  const lrF1 = data?.models.logisticRegression.f1 ?? 0.8177;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header Context Station */}
      <div className="observatory-panel hud-corner-tl hud-corner-br rounded-2xl p-6 shadow-xl border border-cyan-500/20">
        <div className="max-w-4xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>COMPUTATIONAL RESEARCH STATION</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>SUPERVISED CLASSIFICATION BENCHMARKS</span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight font-mono">
            Exoplanet Classifier Benchmark & Diagnostics
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            Comparative performance evaluation of supervised learning algorithms trained on 9,201 Kepler observations across 12 physical transit parameters. The ensemble Random Forest classifier demonstrates superior capacity to delineate non-linear decision boundaries between planet size and transit depth, achieving <strong className="text-cyan-300 font-mono">89.84% accuracy</strong> (+8.1% improvement over linear baseline).
          </p>

          <div className="pt-2 flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>20% Stratified Holdout Test Set (1,841 Objects)</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>Class-Balanced Sample Weights</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-emerald-400">Random Forest Ensemble: Primary Pipeline</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3 font-mono">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs tracking-wider text-cyan-400">LOADING MODEL EVALUATION TELEMETRY...</p>
        </div>
      ) : (
        <>
          {/* 2. Head-to-Head Model Performance Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Random Forest Classifier */}
            <div
              onClick={() => setActiveModel('randomForest')}
              className={`observatory-card-interactive p-6 rounded-2xl cursor-pointer relative transition-all ${
                activeModel === 'randomForest'
                  ? 'border-cyan-400 bg-cyan-950/30 glow-cyan-subtle ring-1 ring-cyan-400/80'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shadow-sm shadow-cyan-500/20">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">Random Forest Classifier</h3>
                    <p className="text-xs text-slate-400 font-mono">200 Estimators · Gini Impurity Criterion</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-emerald-300 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40">
                  Primary Model
                </span>
              </div>

              {/* 4 Core Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center my-5 font-mono">
                <div className="p-3 bg-[#020409]/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Accuracy</span>
                  <span className="text-xl font-bold text-cyan-300">
                    {(rfAcc * 100).toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-emerald-400 block font-mono mt-0.5">+8.10%</span>
                </div>
                <div className="p-3 bg-[#020409]/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Precision</span>
                  <span className="text-xl font-bold text-emerald-300">
                    {(rfPrec * 100).toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-emerald-400 block font-mono mt-0.5">+8.03%</span>
                </div>
                <div className="p-3 bg-[#020409]/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Recall</span>
                  <span className="text-xl font-bold text-indigo-300">
                    {(rfRec * 100).toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-emerald-400 block font-mono mt-0.5">+8.10%</span>
                </div>
                <div className="p-3 bg-[#020409]/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">F1 Score</span>
                  <span className="text-xl font-bold text-amber-300">
                    {(rfF1 * 100).toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-emerald-400 block font-mono mt-0.5">+8.09%</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Captures quadratic transit depth relationships and discriminates multi-parameter astronomical correlations without feature distortion.
              </p>
            </div>

            {/* Logistic Regression Baseline */}
            <div
              onClick={() => setActiveModel('logisticRegression')}
              className={`observatory-card-interactive p-6 rounded-2xl cursor-pointer relative transition-all ${
                activeModel === 'logisticRegression'
                  ? 'border-cyan-400 bg-cyan-950/30 glow-cyan-subtle ring-1 ring-cyan-400/80'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">Logistic Regression</h3>
                    <p className="text-xs text-slate-400 font-mono">StandardScaler Normalized · Linear Hyperplane</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 px-2.5 py-1 rounded bg-slate-900 border border-slate-700">
                  Baseline Benchmark
                </span>
              </div>

              {/* 4 Core Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center my-5 font-mono">
                <div className="p-3 bg-[#020409]/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Accuracy</span>
                  <span className="text-xl font-bold text-slate-300">
                    {(lrAcc * 100).toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-slate-500 block font-mono mt-0.5">Baseline</span>
                </div>
                <div className="p-3 bg-[#020409]/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Precision</span>
                  <span className="text-xl font-bold text-slate-300">
                    {(lrPrec * 100).toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-slate-500 block font-mono mt-0.5">Baseline</span>
                </div>
                <div className="p-3 bg-[#020409]/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Recall</span>
                  <span className="text-xl font-bold text-slate-300">
                    {(lrRec * 100).toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-slate-500 block font-mono mt-0.5">Baseline</span>
                </div>
                <div className="p-3 bg-[#020409]/90 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">F1 Score</span>
                  <span className="text-xl font-bold text-slate-300">
                    {(lrF1 * 100).toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-slate-500 block font-mono mt-0.5">Baseline</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Standard generalized linear model. Constrained by linear decision surfaces when separating close false-positive scenarios.
              </p>
            </div>
          </div>

          {/* 3. Confusion Matrix Diagnostic Visualizer */}
          <div className="observatory-panel p-6 rounded-2xl border border-cyan-500/20 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Confusion Matrix: {data?.models[activeModel].name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  Classification distribution across the 1,841 test holdout observations
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#020409]/90 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setActiveModel('randomForest')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeModel === 'randomForest'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Random Forest
                </button>
                <button
                  onClick={() => setActiveModel('logisticRegression')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeModel === 'logisticRegression'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Logistic Regression
                </button>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <div className="inline-block min-w-full align-middle">
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="min-w-full text-center text-xs">
                    <thead className="bg-[#020409]/90 text-slate-400 font-semibold border-b border-slate-800 font-mono text-[11px]">
                      <tr>
                        <th className="py-3 px-4 text-left">Ground Truth \ Predicted</th>
                        <th className="py-3 px-4 text-amber-300">Predicted CANDIDATE</th>
                        <th className="py-3 px-4 text-emerald-300">Predicted CONFIRMED</th>
                        <th className="py-3 px-4 text-rose-300">Predicted FALSE POSITIVE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {data?.models[activeModel].confusionMatrix.matrix.map((row, rIdx) => {
                        const rowName = data.models[activeModel].confusionMatrix.classes[rIdx];
                        const rowTotal = row.reduce((a, b) => a + b, 0);
                        return (
                          <tr key={rIdx} className="hover:bg-cyan-950/20 transition-colors">
                            <td className="py-3.5 px-4 text-left font-mono font-bold text-slate-200">
                              Actual {rowName} ({rowTotal})
                            </td>
                            {row.map((val, cIdx) => {
                              const isDiagonal = rIdx === cIdx;
                              const rowPct = rowTotal > 0 ? ((val / rowTotal) * 100).toFixed(1) : '0';
                              return (
                                <td
                                  key={cIdx}
                                  className={`py-3.5 px-4 font-bold text-sm ${
                                    isDiagonal
                                      ? 'bg-cyan-950/60 text-cyan-300 font-extrabold border border-cyan-500/30'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  <div>{val}</div>
                                  <div className="text-[10px] font-normal text-slate-500">
                                    {rowPct}%
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              * Diagonal cells highlighted in cyan indicate correctly classified Kepler objects.
            </p>
          </div>

          {/* 4. Feature Importance Ranking Breakdown */}
          <div className="observatory-panel hud-corner-tl hud-corner-br p-6 rounded-2xl border border-cyan-500/20 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <BarChart className="w-5 h-5 text-cyan-400" />
                Random Forest Feature Importance Analysis (12 Parameters)
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Relative Gini impurity reduction score quantifying each astrophysical property&apos;s predictive power in discriminating confirmed worlds from false positives
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {data?.featureImportance.map((feat, idx) => {
                const percent = (feat.importance * 100).toFixed(1);
                return (
                  <div key={feat.feature} className="p-3 bg-[#020409]/70 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-[11px]">#{idx + 1}</span>
                        <span className="text-slate-200 font-medium font-sans">{feat.label}</span>
                      </div>
                      <span className="font-mono text-cyan-300 font-bold">{percent}%</span>
                    </div>

                    <div className="h-2 w-full bg-[#020409] rounded-full overflow-hidden flex border border-slate-800">
                      <div
                        style={{ width: `${percent}%` }}
                        className="bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

import React from 'react';
import { Filter, Orbit, Cpu, BarChart3, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScreeningTab } from './ScreeningTab';
import { TransitStudioTab } from './TransitStudioTab';
import { MLAnalysisTab } from './MLAnalysisTab';
import { StatisticsTab } from './StatisticsTab';
import { KeplerRecord } from '../types/kepler';

export type ResearchSubTab = 'screening' | 'transit' | 'ml' | 'statistics';

interface ResearchHubProps {
  activeSubTab: ResearchSubTab;
  setActiveSubTab: (subTab: ResearchSubTab) => void;
  onSelectCandidate: (id: string | number) => void;
  onSelectObservatoryPlanet?: (candidate: KeplerRecord) => void;
  studioCandidate?: KeplerRecord | null;
}

export const ResearchHub: React.FC<ResearchHubProps> = ({
  activeSubTab,
  setActiveSubTab,
  onSelectCandidate,
  onSelectObservatoryPlanet,
  studioCandidate,
}) => {
  const subModules = [
    {
      id: 'screening' as ResearchSubTab,
      label: 'Candidate Screening',
      icon: Filter,
      description: 'Prioritize exoplanet candidates for spectroscopic follow-up using calibrated habitability and signal vetting scores.',
    },
    {
      id: 'transit' as ResearchSubTab,
      label: 'Transit Studio',
      icon: Orbit,
      description: 'Simulate and fit photometric light curves using the mathematical Mandel-Agol transit model with limb darkening.',
    },
    {
      id: 'ml' as ResearchSubTab,
      label: 'ML Diagnostics',
      icon: Cpu,
      description: 'Benchmark Random Forest (89.8% F1) vs. baseline classifiers with confusion matrices and feature importance.',
    },
    {
      id: 'statistics' as ResearchSubTab,
      label: 'Statistical Insights',
      icon: BarChart3,
      description: 'Inspect empirical distributions, the 1.8 R⊕ radius valley bimodality, and 12×12 Pearson correlation matrices.',
    },
  ];

  const currentModule = subModules.find((m) => m.id === activeSubTab) || subModules[0];

  return (
    <div className="space-y-6">
      {/* 5-Second Research Hub Header with Purpose Kicker */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-cyan-500/15">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1.5">
            <span>Research & Analysis Laboratory</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">NASA Kepler DR25 Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            {currentModule.label}
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            {currentModule.description}
          </p>
        </div>

        {/* Segmented Sub-Navigation Control */}
        <div className="flex items-center gap-1 p-1 bg-[#090d16]/90 border border-cyan-500/20 rounded-xl overflow-x-auto no-scrollbar shrink-0">
          {subModules.map((module) => {
            const Icon = module.icon;
            const isActive = activeSubTab === module.id;
            return (
              <button
                key={module.id}
                onClick={() => setActiveSubTab(module.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-cyan-200 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{module.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="researchSubTabActive"
                    className="absolute inset-0 bg-cyan-950/60 border border-cyan-500/40 rounded-lg -z-10 shadow-sm shadow-cyan-500/20"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Sub-Module Render with Smooth Motion Settling */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeSubTab === 'screening' && (
            <ScreeningTab
              onSelectCandidate={onSelectCandidate}
              onSelectObservatoryPlanet={onSelectObservatoryPlanet}
            />
          )}

          {activeSubTab === 'transit' && (
            <TransitStudioTab
              initialCandidate={studioCandidate}
            />
          )}

          {activeSubTab === 'ml' && <MLAnalysisTab />}

          {activeSubTab === 'statistics' && <StatisticsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SpaceEnvironment } from './components/SpaceEnvironment';
import { OverviewTab } from './components/OverviewTab';
import { ExplorerTab } from './components/ExplorerTab';
import { ResearchHub, ResearchSubTab } from './components/ResearchHub';
import { AIAssistantTab } from './components/AIAssistantTab';
import { CandidateDetailDrawer } from './components/CandidateDetailDrawer';
import { DatasetOverview, KeplerRecord, TransitTelemetry } from './types/kepler';
import { Orbit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeResearchSubTab, setActiveResearchSubTab] = useState<ResearchSubTab>('screening');
  const [overview, setOverview] = useState<DatasetOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | number | null>(null);
  const [explorerPresetFilter, setExplorerPresetFilter] = useState<string | null>(null);

  // Application-wide synchronized observatory planet state
  const [activeTransit, setActiveTransit] = useState<TransitTelemetry | null>(null);
  const [featuredList, setFeaturedList] = useState<TransitTelemetry[]>([]);
  const [studioCandidate, setStudioCandidate] = useState<KeplerRecord | null>(null);

  // Load dataset overview
  useEffect(() => {
    fetch('/api/overview')
      .then((res) => res.json())
      .then((data) => {
        setOverview(data);
        setLoadingOverview(false);
      })
      .catch((err) => {
        console.error('Failed to load overview data', err);
        setLoadingOverview(false);
      });
  }, []);

  // Load featured transits
  useEffect(() => {
    fetch('/api/transits/featured')
      .then((res) => res.json())
      .then((data) => {
        if (data.featuredTransits && data.featuredTransits.length > 0) {
          setFeaturedList(data.featuredTransits);
          setActiveTransit((prev) => prev || data.featuredTransits[0]);
        }
      })
      .catch((err) => console.error('Failed to load featured transits', err));
  }, []);

  // Synchronize any planet chosen across the whole application
  const handleSelectObservatoryPlanet = async (candidate: KeplerRecord) => {
    try {
      const res = await fetch(`/api/candidates/${candidate.rowid}`);
      const data = await res.json();
      if (data.nextTransit) {
        setActiveTransit(data.nextTransit);
        // Prepend to featured list if not already present
        setFeaturedList((prev) => {
          if (prev.some((f) => f.candidate.koi_identifier === candidate.koi_identifier)) {
            return prev;
          }
          return [data.nextTransit, ...prev];
        });
      }
    } catch (err) {
      console.error('Failed to synchronize observatory planet', err);
    }
  };

  const handleOpenInTransitStudio = (candidate: KeplerRecord) => {
    setStudioCandidate(candidate);
    setActiveTab('research');
    setActiveResearchSubTab('transit');
  };

  const handleExploreFilter = (preset: string) => {
    setExplorerPresetFilter(preset);
    setActiveTab('explorer');
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Global High-Performance Cosmic Space Environment */}
      <SpaceEnvironment />

      {/* 2. Observatory Futuristic HUD Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'explorer') setExplorerPresetFilter(null);
        }}
        totalObjects={overview?.totalObjects ?? 9201}
      />

      {/* 3. Main Content Viewport with Smooth Page Transitions */}
      <main className={`flex-1 w-full z-10 ${activeTab === 'overview' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                overview={overview}
                loading={loadingOverview}
                onExploreFilter={handleExploreFilter}
                onSelectCandidate={(id) => setSelectedCandidateId(id)}
                activeTransit={activeTransit}
                featuredList={featuredList}
                onSelectTransit={(item) => setActiveTransit(item)}
              />
            )}

            {activeTab === 'explorer' && (
              <ExplorerTab
                initialFilter={explorerPresetFilter}
                onSelectCandidate={(id) => setSelectedCandidateId(id)}
                onSelectObservatoryPlanet={handleSelectObservatoryPlanet}
              />
            )}

            {activeTab === 'research' && (
              <ResearchHub
                activeSubTab={activeResearchSubTab}
                setActiveSubTab={setActiveResearchSubTab}
                onSelectCandidate={(id) => setSelectedCandidateId(id)}
                onSelectObservatoryPlanet={handleSelectObservatoryPlanet}
                studioCandidate={studioCandidate}
              />
            )}

            {activeTab === 'assistant' && <AIAssistantTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. Candidate Slide-Over Telemetry Inspection Drawer */}
      <CandidateDetailDrawer
        candidateId={selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
        onSelectObservatoryPlanet={handleSelectObservatoryPlanet}
        onOpenInTransitStudio={handleOpenInTransitStudio}
      />

      {/* 5. Minimal Observatory Footer */}
      <footer className="border-t border-cyan-500/10 bg-[#020409]/80 backdrop-blur-md py-6 text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2">
            <Orbit className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">
              NASA KEPLER MISSION ARCHIVE · TEAM 21 (HACK VOK)
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            ASTROPHYSICAL DATASET: 9,201 KOIs · RANDOM FOREST SCREENING ENGINE
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

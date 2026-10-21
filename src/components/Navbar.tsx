import React, { useState, useEffect } from 'react';
import {
  Compass,
  Database,
  Filter,
  BarChart3,
  Orbit,
  Cpu,
  Bot,
  Radio,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalObjects: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalObjects,
}) => {
  const [currentUtc, setCurrentUtc] = useState<string>('');
  const [currentBkjd, setCurrentBkjd] = useState<string>('6490.05');

  // Clock tick for authentic mission telemetry
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentUtc(now.toUTCString().slice(17, 25) + ' UTC');
      // Approximate BKJD from current time
      const bkjd = (now.getTime() / 86400000) + 2440587.5 - 2454833.0;
      setCurrentBkjd(bkjd.toFixed(2));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Observatory', icon: Compass },
    { id: 'explorer', label: 'Explore', icon: Database },
    { id: 'research', label: 'Research / Analysis', icon: Orbit },
    { id: 'assistant', label: 'Kepler AI', icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-500/15 bg-[#020409]/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Telemetry Header Bar */}
        <div className="flex items-center justify-between h-14 border-b border-slate-800/50">
          {/* Platform Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20">
              <Orbit className="w-4 h-4 animate-spin-slow" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm tracking-widest uppercase text-white font-mono">
                KEPLER OBSERVATORY
              </span>
              <span className="text-slate-600 text-xs hidden sm:inline" aria-hidden="true">·</span>
              <span className="text-[11px] text-slate-400 font-mono tracking-wider hidden sm:inline">
                NASA EXOPLANET ARCHIVE
              </span>
            </div>
          </div>

          {/* Observatory Mission Telemetry (Unboxed Clean Typography) */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden md:flex items-center gap-1.5 text-slate-400">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{totalObjects > 0 ? totalObjects.toLocaleString() : '9,201'} KOIs</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-cyan-400">RF SCREENING ONLINE</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-slate-400 border-l border-slate-800/80 pl-3">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>BKJD {currentBkjd}</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-300">{currentUtc || 'SYNCING...'}</span>
            </div>
          </div>
        </div>

        {/* Minimal Futuristic Observatory Navigation Links */}
        <nav className="flex space-x-1 overflow-x-auto py-1.5 no-scrollbar" aria-label="Observatory Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>

                {/* Animated Minimal Indicator Underline */}
                {isActive && (
                  <motion.div
                    layoutId="navTabIndicator"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-sm shadow-cyan-500/50"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

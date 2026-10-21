import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { InteractivePlanet } from './InteractivePlanet';
import { TransitCountdown, FeaturedTransitData } from './TransitCountdown';
import {
  Sparkles,
  Radio,
  Eye,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { KeplerRecord } from '../types/kepler';

// Radiant Central Host Star Component (Placed at Origin [0, 0, 0])
const CentralHostStar: React.FC<{
  stellarTemp?: number;
  stellarRadius?: number;
}> = ({ stellarTemp = 5770, stellarRadius = 1.0 }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const flareRef = useRef<THREE.Mesh>(null);

  // Spectral temperature color calibration (Kelvin)
  const starColor = useMemo(() => {
    if (stellarTemp < 3700) return new THREE.Color(1.0, 0.38, 0.16); // M-dwarf (deep red-orange)
    if (stellarTemp < 5200) return new THREE.Color(1.0, 0.68, 0.28); // K-dwarf (warm orange)
    if (stellarTemp < 6000) return new THREE.Color(1.0, 0.94, 0.72); // G2V solar analog (warm golden-white)
    if (stellarTemp < 7500) return new THREE.Color(0.88, 0.94, 1.0);  // F-type (pure white)
    return new THREE.Color(0.68, 0.85, 1.0);                          // A/B blue-white
  }, [stellarTemp]);

  const coreRadius = useMemo(() => {
    return 1.35 * Math.max(0.75, Math.min(1.4, stellarRadius || 1.0));
  }, [stellarRadius]);

  useFrame((state, delta) => {
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.05;
    if (coronaRef.current) coronaRef.current.rotation.z += delta * 0.03;
    if (flareRef.current) {
      const pulse = 1.0 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.04;
      flareRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central Star Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[coreRadius, 48, 48]} />
        <meshBasicMaterial color={starColor} />
      </mesh>

      {/* Atmospheric Inner Corona Glow */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[coreRadius * 1.28, 36, 36]} />
        <meshBasicMaterial
          color={starColor}
          transparent={true}
          opacity={0.38}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Atmospheric Outer Corona Radial Flare */}
      <mesh ref={flareRef}>
        <sphereGeometry args={[coreRadius * 1.65, 32, 32]} />
        <meshBasicMaterial
          color={starColor}
          transparent={true}
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Central High-Intensity Omnidirectional PointLight radiating onto the orbiting planet */}
      <pointLight color={starColor} intensity={4.5} distance={75} decay={1.05} />
    </group>
  );
};

// Continuous Orbital System with Central Star & Revolving Planet
const OrbitingSystem: React.FC<{
  candidate?: KeplerRecord;
  onPlanetPointerActive?: (active: boolean) => void;
}> = ({ candidate, onPlanetPointerActive }) => {
  const planetHolderRef = useRef<THREE.Group>(null);
  const orbitRadius = 3.75;
  const orbitTiltX = 0.38; // ~22 degrees inclination
  const orbitTiltZ = 0.12;

  // Normalized visual orbit speed: smooth 20-30s revolution
  const orbitalPeriod = candidate?.orbital_period_days || 9.5;
  const speed = useMemo(() => {
    return Math.max(0.14, Math.min(0.38, 2.2 / Math.sqrt(Math.max(0.5, orbitalPeriod))));
  }, [orbitalPeriod]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const angle = time * speed;
    if (planetHolderRef.current) {
      planetHolderRef.current.position.x = Math.cos(angle) * orbitRadius;
      planetHolderRef.current.position.z = Math.sin(angle) * orbitRadius;
    }
  });

  return (
    <>
      {/* Central Host Star at Origin */}
      <CentralHostStar
        stellarTemp={candidate?.stellar_effective_temperature_k || 5770}
        stellarRadius={candidate?.stellar_radius_solar_radii || 1.0}
      />

      {/* Tilted Orbital Plane Group */}
      <group rotation={[orbitTiltX, 0, orbitTiltZ]}>
        {/* Continuous Orbital Trajectory Guide Path Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[orbitRadius - 0.018, orbitRadius + 0.018, 128]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent={true}
            opacity={0.28}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Orbiting Planet with Interactive GLSL Surface Displacement Shader */}
        <group ref={planetHolderRef}>
          <InteractivePlanet
            position={[0, 0, 0]}
            equilibriumTemp={candidate?.equilibrium_temperature_k || 288}
            planetRadius={candidate?.planetary_radius_earth_radii || 2.0}
            onPointerStateChange={onPlanetPointerActive}
            scale={0.92}
          />
        </group>
      </group>
    </>
  );
};

// Main Unified 3D Space Scene with Fixed Camera
const SpaceScene: React.FC<{
  activeTransit: FeaturedTransitData | null;
  onPlanetPointerActive?: (active: boolean) => void;
}> = ({ activeTransit, onPlanetPointerActive }) => {
  const candidate = activeTransit?.candidate;

  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[0, 5, 8]} intensity={0.8} />

      {/* Deep Space Cosmic Starfield */}
      <Stars radius={90} depth={45} count={3000} factor={4} saturation={0.65} fade speed={0.6} />

      {/* Central Host Star with Continuous Orbiting Planet */}
      <OrbitingSystem
        candidate={candidate}
        onPlanetPointerActive={onPlanetPointerActive}
      />
    </>
  );
};

export interface SpaceHeroProps {
  onExploreFilter: (preset: string) => void;
  onSelectCandidate: (id: string | number) => void;
  activeTransit?: FeaturedTransitData | null;
  featuredList?: FeaturedTransitData[];
  onSelectTransit?: (item: FeaturedTransitData) => void;
}

export const SpaceHero: React.FC<SpaceHeroProps> = ({
  onExploreFilter,
  onSelectCandidate,
  activeTransit: propActiveTransit,
  featuredList: propFeaturedList,
  onSelectTransit: propOnSelectTransit,
}) => {
  const [internalFeaturedList, setInternalFeaturedList] = useState<FeaturedTransitData[]>([]);
  const [internalActiveTransit, setInternalActiveTransit] = useState<FeaturedTransitData | null>(null);
  const [isPointerOnPlanet, setIsPointerOnPlanet] = useState(false);

  useEffect(() => {
    if (!propFeaturedList || propFeaturedList.length === 0) {
      fetch('/api/transits/featured')
        .then((res) => res.json())
        .then((data) => {
          if (data.featuredTransits && data.featuredTransits.length > 0) {
            setInternalFeaturedList(data.featuredTransits);
            if (!propActiveTransit) {
              setInternalActiveTransit(data.featuredTransits[0]);
            }
          }
        })
        .catch((err) => console.error('Failed to load featured transits', err));
    }
  }, [propFeaturedList, propActiveTransit]);

  const activeTransit =
    propActiveTransit !== undefined && propActiveTransit !== null
      ? propActiveTransit
      : internalActiveTransit;

  const featuredList =
    propFeaturedList !== undefined && propFeaturedList.length > 0
      ? propFeaturedList
      : internalFeaturedList;

  const handleSelectTransit = (item: FeaturedTransitData) => {
    if (propOnSelectTransit) {
      propOnSelectTransit(item);
    } else {
      setInternalActiveTransit(item);
    }
  };

  return (
    <section className="relative w-full min-h-[92vh] sm:min-h-screen overflow-hidden flex flex-col justify-between select-none">
      {/* 1. Full-Viewport WebGL 3D Canvas Layer with Fixed Camera */}
      <div className="absolute inset-0 z-0 bg-[#020409]">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center font-mono text-cyan-400/70 text-xs">
              Initializing Kepler 3D Astrophysical Engine...
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 2.0, 7.4], fov: 42 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          >
            <SpaceScene
              activeTransit={activeTransit}
              onPlanetPointerActive={(active) => setIsPointerOnPlanet(active)}
            />
          </Canvas>
        </Suspense>

        {/* Deep Space Vignettes */}
        <div className="absolute inset-0 pointer-events-none bg-radial-[circle_at_center,transparent_45%,rgba(2,4,9,0.85)_100%]" />
        <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none bg-gradient-to-t from-[#020409] via-[#020409]/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 pointer-events-none bg-gradient-to-b from-[#020409]/80 to-transparent" />
      </div>

      {/* 2. Top Floating Astronomical Header Overlay (Unboxed) */}
      <header className="relative z-10 pt-6 px-4 sm:px-8 max-w-7xl w-full mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-medium shadow-[0_0_15px_rgba(56,189,248,0.15)]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>NASA KEPLER MISSION ARCHIVE · 3D INTERACTIVE OBSERVATORY</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.25)]">
            EXOPLANET OBSERVATORY
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium drop-shadow">
            Host star at central coordinate with continuous orbital revolution, real-time GLSL surface displacement, and live ephemeris countdown.
          </p>
        </div>

        {/* Interactive Surface Deformation Status */}
        <div className="hidden sm:flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs font-mono text-slate-300 shadow-xl">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>
            {isPointerOnPlanet
              ? 'Seismic Surface Displacement Active'
              : 'Hover or touch revolving planet for seismic displacement'}
          </span>
        </div>
      </header>

      {/* 3. Central Stage Space is completely UNOBSTRUCTED to showcase the central star and revolving planet */}
      <div className="flex-1 pointer-events-none" />

      {/* 4. Bottom Dock: Real Live Transit Countdown & Observatory Telemetry Console */}
      <div className="relative z-10 px-4 pb-6 sm:pb-8 w-full max-w-6xl mx-auto">
        <TransitCountdown
          activeTransit={activeTransit}
          featuredList={featuredList}
          onSelectTransit={handleSelectTransit}
          onSelectCandidateId={onSelectCandidate}
          onExploreFilter={onExploreFilter}
        />
      </div>
    </section>
  );
};

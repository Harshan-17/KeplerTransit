import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 3D Simplex noise implementation in GLSL
const noiseGLSL = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}
`;

// Planet Vertex Shader with organic surface deformation, dents, bulges & expanding seismic ripples
const planetVertexShader = `
${noiseGLSL}

uniform float uTime;
uniform vec3 uPointer;
uniform float uPointerActive;
uniform float uDeformStrength;
uniform float uClickPulse;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying float vDisplacement;
varying float vPointerDist;

void main() {
  vUv = uv;

  // 1. Natural planetary topography (multi-octave procedural terrain)
  float terrain = snoise(position * 1.6 + vec3(uTime * 0.015)) * 0.075
                + snoise(position * 3.8) * 0.032
                + snoise(position * 7.5) * 0.012;

  // 2. Interactive displacement: Distance to pointer hit on unit sphere
  float d = distance(position, uPointer);
  vPointerDist = d;

  // Localized elastic dent and bulge under pointer
  float pointerInfluence = exp(-d * d * 3.2) * uPointerActive;
  float bulgeDent = sin(d * 4.8 - uTime * 2.5) * 0.24 * pointerInfluence * uDeformStrength;

  // Expanding seismic shockwave ripples radiating outward from touch point
  float rippleWave = sin(d * 18.0 - uTime * 8.0 - uClickPulse * 16.0)
                   * exp(-d * 2.2)
                   * uPointerActive
                   * (0.16 + uClickPulse * 0.22);

  // Total surface displacement
  float totalDisp = terrain + bulgeDent + rippleWave;
  vDisplacement = totalDisp;

  // Displace along surface normal vector
  vec3 displacedPosition = position + normal * totalDisp;

  // Perturb normals via finite differences for accurate real-time dynamic shading
  vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0) + vec3(0.001)));
  vec3 bitangent = cross(normal, tangent);
  float delta = 0.015;
  float dX = snoise((position + tangent * delta) * 1.6) - snoise(position * 1.6);
  float dY = snoise((position + bitangent * delta) * 1.6) - snoise(position * 1.6);
  vec3 perturbedNormal = normalize(normal - tangent * (dX * 0.6) - bitangent * (dY * 0.6));

  vNormal = normalize(normalMatrix * perturbedNormal);
  vPosition = displacedPosition;

  vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
  vViewPosition = -mvPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
`;

// Planet Fragment Shader with procedural biomes, atmospheric glow & ripple luminescence
const planetFragmentShader = `
uniform float uTime;
uniform vec3 uLightDir;
uniform float uEquilibriumTemp;
uniform float uPointerActive;
uniform float uClickPulse;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying float vDisplacement;
varying float vPointerDist;

void main() {
  vec3 norm = normalize(vNormal);
  vec3 lightDir = normalize(uLightDir);
  vec3 viewDir = normalize(vViewPosition);

  // Primary stellar illumination: Diffuse + Ambient
  float diff = max(0.0, dot(norm, lightDir));
  float ambient = 0.25;
  float light = diff + ambient;

  // Specular reflection (liquid oceans / ice sheets)
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(0.0, dot(norm, halfDir)), 32.0) * 0.45;

  // Procedural biome color palettes calibrated by Equilibrium Temperature (Kelvin)
  vec3 colDeep;
  vec3 colMid;
  vec3 colHigh;
  vec3 atmosphereColor;

  if (uEquilibriumTemp < 220.0) {
    // Cryosphere / Deep Frost Super-Earth
    colDeep = vec3(0.05, 0.12, 0.28);        // Liquid methane / sub-surface ocean
    colMid = vec3(0.35, 0.55, 0.75);         // Glacial nitrogen plains
    colHigh = vec3(0.85, 0.95, 1.0);         // Water-ice crests
    atmosphereColor = vec3(0.45, 0.75, 1.0); // Faint cyan-violet aurora
  } else if (uEquilibriumTemp < 340.0) {
    // Habitable / Earth-like temperate zone (e.g. Kepler-22 b)
    colDeep = vec3(0.02, 0.18, 0.45);        // Deep sapphire ocean
    colMid = vec3(0.08, 0.48, 0.32);         // Temperate landmass / biosphere
    colHigh = vec3(0.65, 0.88, 0.98);        // Mountain ranges / polar cap
    atmosphereColor = vec3(0.28, 0.72, 1.0); // Azure blue atmosphere
  } else if (uEquilibriumTemp < 750.0) {
    // Warm Sub-Neptune / Ocean Mantle World (e.g. Kepler-226 c, Kepler-661 b)
    colDeep = vec3(0.08, 0.06, 0.32);        // Deep indigo supercritical fluid
    colMid = vec3(0.02, 0.45, 0.68);         // Turquoise mantle
    colHigh = vec3(0.55, 0.92, 0.88);        // Methane cloud bands
    atmosphereColor = vec3(0.35, 0.88, 0.78);// Emerald-cyan haze
  } else {
    // Scorched Hot Jupiter / Volcanic World (e.g. Kepler-10 b, >1000 K)
    colDeep = vec3(0.12, 0.04, 0.06);        // Obsidian basalt
    colMid = vec3(0.78, 0.22, 0.04);         // Liquid magma channels
    colHigh = vec3(0.98, 0.76, 0.16);        // Incandescent sulfur ridges
    atmosphereColor = vec3(0.98, 0.48, 0.18);// Fiery orange corona
  }

  // Elevation-based biome blending
  float t = clamp((vDisplacement + 0.12) / 0.28, 0.0, 1.0);
  vec3 surfaceColor = mix(colDeep, colMid, smoothstep(0.12, 0.62, t));
  surfaceColor = mix(surfaceColor, colHigh, smoothstep(0.62, 1.0, t));

  // Only apply specular highlights on lower elevations (liquid / smooth flats)
  if (t > 0.42) {
    spec *= 0.12;
  }

  // Atmospheric Fresnel Rim Glow (Edge scattering)
  float fresnel = pow(1.0 - max(0.0, dot(norm, viewDir)), 2.6);
  vec3 rimGlow = atmosphereColor * fresnel * 1.6;

  // Pointer ripple luminescence: emits an energy pulse where surface is perturbed
  float rippleGlow = (abs(vDisplacement) * 2.8 + uClickPulse * 1.5) * exp(-vPointerDist * 1.8) * uPointerActive;
  vec3 pulseColor = mix(atmosphereColor, vec3(0.3, 0.95, 1.0), 0.7);

  // Final compositing
  vec3 finalColor = surfaceColor * light + vec3(spec) + rimGlow + pulseColor * rippleGlow;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

// Atmospheric Halo Shell Shader
const atmosphereVertexShader = `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const atmosphereFragmentShader = `
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 norm = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float intensity = pow(0.72 - dot(norm, viewDir), 2.4);
  gl_FragColor = vec4(uColor, 1.0) * intensity * 1.35;
}
`;

export interface InteractivePlanetProps {
  equilibriumTemp?: number;
  planetRadius?: number;
  position?: [number, number, number];
  rotationSpeed?: number;
  lightDirection?: [number, number, number];
  onPointerStateChange?: (active: boolean) => void;
  scale?: number;
}

export const InteractivePlanet: React.FC<InteractivePlanetProps> = ({
  equilibriumTemp = 280,
  planetRadius = 2.0,
  position = [0, 0, 0],
  rotationSpeed = 0.18,
  lightDirection = [1.2, 0.8, 1.5],
  onPointerStateChange,
  scale: customScale,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const pointerTarget = useRef(new THREE.Vector3(0, 0, 2));
  const pointerActive = useRef(0);
  const clickPulse = useRef(0);
  const deformStrength = useRef(1.0);

  // Prominent planetary scale: majestic centerpiece filling the viewport
  const scale = useMemo(() => {
    if (customScale !== undefined) return customScale;
    const baseScale = 1.85;
    const rFactor = Math.max(0.75, Math.min(1.35, Math.sqrt(planetRadius / 2.0)));
    return baseScale * rFactor;
  }, [planetRadius, customScale]);

  // Shader uniforms
  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector3(0, 0, 2) },
      uPointerActive: { value: 0 },
      uDeformStrength: { value: 1.0 },
      uClickPulse: { value: 0 },
      uLightDir: { value: new THREE.Vector3(...lightDirection).normalize() },
      uEquilibriumTemp: { value: equilibriumTemp },
    };
  }, []);

  const atmosphereUniforms = useMemo(() => {
    const color =
      equilibriumTemp < 220
        ? new THREE.Color(0.45, 0.75, 1.0)
        : equilibriumTemp < 340
        ? new THREE.Color(0.28, 0.72, 1.0)
        : equilibriumTemp < 750
        ? new THREE.Color(0.35, 0.88, 0.78)
        : new THREE.Color(0.98, 0.48, 0.18);
    return {
      uColor: { value: color },
    };
  }, [equilibriumTemp]);

  // Dynamically synchronize uniforms when props change
  useEffect(() => {
    if (uniforms.uEquilibriumTemp) {
      uniforms.uEquilibriumTemp.value = equilibriumTemp;
    }
    if (uniforms.uLightDir) {
      uniforms.uLightDir.value.set(...lightDirection).normalize();
    }
    if (atmosphereUniforms.uColor) {
      atmosphereUniforms.uColor.value =
        equilibriumTemp < 220
          ? new THREE.Color(0.45, 0.75, 1.0)
          : equilibriumTemp < 340
          ? new THREE.Color(0.28, 0.72, 1.0)
          : equilibriumTemp < 750
          ? new THREE.Color(0.35, 0.88, 0.78)
          : new THREE.Color(0.98, 0.48, 0.18);
    }
  }, [equilibriumTemp, lightDirection, uniforms, atmosphereUniforms]);

  // Animation frame loop
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (uniforms.uTime) {
      uniforms.uTime.value = time;
    }

    // Smooth lerp for pointer tracking
    if (uniforms.uPointer) {
      uniforms.uPointer.value.lerp(pointerTarget.current, delta * 9);
    }
    if (uniforms.uPointerActive) {
      uniforms.uPointerActive.value = THREE.MathUtils.lerp(
        uniforms.uPointerActive.value,
        pointerActive.current,
        delta * 6
      );
    }
    if (uniforms.uClickPulse) {
      clickPulse.current = Math.max(0, clickPulse.current - delta * 0.9);
      uniforms.uClickPulse.value = clickPulse.current;
    }
    if (uniforms.uDeformStrength) {
      uniforms.uDeformStrength.value = THREE.MathUtils.lerp(
        uniforms.uDeformStrength.value,
        deformStrength.current,
        delta * 5
      );
    }

    // Natural axial rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += delta * (rotationSpeed * 0.85);
    }

    // Dynamically calculate stellar illumination vector from central star at [0,0,0]
    if (meshRef.current && uniforms.uLightDir) {
      const worldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPos);
      if (worldPos.lengthSq() > 0.05) {
        // Vector pointing from planet towards central star at origin
        const dirToStar = new THREE.Vector3(0, 0, 0).sub(worldPos).normalize();
        uniforms.uLightDir.value.copy(dirToStar);
      }
    }
  });

  // Pointer / Touch events on the 3D surface
  const handlePointerMove = (e: any) => {
    if (e.point && meshRef.current) {
      const localPoint = meshRef.current.worldToLocal(e.point.clone());
      pointerTarget.current.copy(localPoint);
      pointerActive.current = 1.0;
      onPointerStateChange?.(true);
    }
  };

  const handlePointerDown = (e: any) => {
    pointerActive.current = 1.0;
    deformStrength.current = -1.5; // Creates elastic dent when pressed
    clickPulse.current = 1.0; // Trigger seismic ripple shockwave
    if (e.point && meshRef.current) {
      const localPoint = meshRef.current.worldToLocal(e.point.clone());
      pointerTarget.current.copy(localPoint);
    }
    onPointerStateChange?.(true);
  };

  const handlePointerUp = () => {
    deformStrength.current = 1.0; // Restores elastic bulge
  };

  const handlePointerLeave = () => {
    pointerActive.current = 0.0;
    deformStrength.current = 1.0;
    onPointerStateChange?.(false);
  };

  return (
    <group position={position}>
      {/* Interactive Deformable Planet Mesh */}
      <mesh
        ref={meshRef}
        scale={[scale, scale, scale]}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial
          vertexShader={planetVertexShader}
          fragmentShader={planetFragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* Atmospheric Glowing Rim Shell */}
      <mesh ref={atmosphereRef} scale={[scale * 1.14, scale * 1.14, scale * 1.14]}>
        <sphereGeometry args={[1, 48, 48]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosphereUniforms}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent={true}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

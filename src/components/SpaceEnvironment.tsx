import React, { useEffect, useRef } from 'react';

/**
 * Global Space Environment Component
 * Renders a lightweight, high-performance cosmic background
 * with deep space gradients, nebula lighting, twinkling micro-stars,
 * and astronomical field grid reticles.
 * (Zero WebGL duplicates; pure 2D canvas + CSS for 60fps performance across the entire app)
 */
export const SpaceEnvironment: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Generate ~160 layered stars with coordinates, depth, and twinkle phase
    const starCount = Math.min(200, Math.floor((width * height) / 10000));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
      // Slight spectral temperature tint (cool white, cyan, subtle amber)
      color:
        Math.random() > 0.8
          ? 'rgba(165, 243, 252, ' // cyan-200
          : Math.random() > 0.6
          ? 'rgba(254, 240, 138, ' // amber-200
          : 'rgba(241, 245, 249, ', // slate-100
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    const render = () => {
      // Gentle mouse parallax damping
      if (!prefersReducedMotion) {
        mouseX += (targetMouseX - mouseX) * 0.03;
        mouseY += (targetMouseY - mouseY) * 0.03;
      }

      ctx.clearRect(0, 0, width, height);

      const offsetX = ((mouseX - width / 2) / width) * 15;
      const offsetY = ((mouseY - height / 2) / height) * 15;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        if (!prefersReducedMotion) {
          star.phase += star.twinkleSpeed;
        }

        const currentAlpha = Math.max(
          0.1,
          Math.min(1.0, star.alpha + Math.sin(star.phase) * 0.3)
        );

        // Depth-based parallax offset
        const px = star.x + offsetX * (star.size * 0.6);
        const py = star.y + offsetY * (star.size * 0.6);

        ctx.fillStyle = `${star.color}${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!document.hidden && !prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    // Pause animation when tab is inactive to save battery/GPU
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden bg-[#020409]">
      {/* 1. Deep Space Cosmic Nebula Gradients */}
      <div
        className="absolute -top-[25%] -left-[10%] w-[65vw] h-[65vw] rounded-full blur-[140px] opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(6, 78, 105, 0.45) 0%, rgba(2, 6, 23, 0) 70%)',
        }}
      />
      <div
        className="absolute top-[40%] -right-[15%] w-[60vw] h-[60vw] rounded-full blur-[160px] opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(49, 18, 92, 0.4) 0%, rgba(2, 6, 23, 0) 70%)',
        }}
      />
      <div
        className="absolute -bottom-[20%] left-[20%] w-[55vw] h-[55vw] rounded-full blur-[150px] opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(8, 47, 73, 0.35) 0%, rgba(2, 6, 23, 0) 70%)',
        }}
      />

      {/* 2. Micro Twinkling Star Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* 3. Astronomical Coordinate Reticle Lines (Corner HUD Accents) */}
      <div className="absolute top-4 left-4 text-[10px] font-mono text-cyan-500/20 select-none tracking-widest hidden sm:block">
        ┌ FOV 115° · KEPLER FIELD (CYGNUS / LYRA)
      </div>
      <div className="absolute top-4 right-4 text-[10px] font-mono text-cyan-500/20 select-none tracking-widest hidden sm:block">
        OPTICAL BANDPASS 420–900 nm ┐
      </div>
      <div className="absolute bottom-4 left-4 text-[10px] font-mono text-cyan-500/15 select-none tracking-widest hidden sm:block">
        └ BARYCENTRIC KEPLER JULIAN DATE (BKJD)
      </div>
      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-cyan-500/15 select-none tracking-widest hidden sm:block">
        ASTROMETRIC SNR THRESHOLD ≥ 7.1σ ┘
      </div>

      {/* 4. Fine Astronomical Grid Lines Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
          backgroundSize: '120px 120px',
        }}
      />
    </div>
  );
};

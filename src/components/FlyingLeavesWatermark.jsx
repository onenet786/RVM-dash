import React, { useEffect, useRef } from 'react';

/**
 * FlyingLeavesWatermark
 * High-performance 60FPS background flying leaves watermark engine.
 * Renders botanical leaves and eco-spores drifting across the background
 * in a true non-intrusive watermark style (pointer-events: none, subtle opacity).
 */
export default function FlyingLeavesWatermark({ isWatermark = true, count = 28 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Leaf Color Palettes (ISP Brand Greens & Golds)
    const leafPalettes = [
      { start: '#0b5d3b', end: '#047857', vein: '#064e3b' }, // Deep Forest Emerald
      { start: '#10b981', end: '#34d399', vein: '#059669' }, // Spring Mint Jade
      { start: '#84cc16', end: '#a3e635', vein: '#65a30d' }, // Sunlit Fresh Lime
      { start: '#e5a919', end: '#f59e0b', vein: '#b45309' }, // Warm Radiant Gold
      { start: '#059669', end: '#10b981', vein: '#047857' }, // Classic Vanguard Green
    ];

    const leafCount = Math.min(count, Math.max(16, Math.floor(width / 42)));
    const leaves = [];

    for (let i = 0; i < leafCount; i++) {
      const palette = leafPalettes[Math.floor(Math.random() * leafPalettes.length)];
      const size = 12 + Math.random() * 16;
      const depth = size / 28;

      leaves.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0.35 + Math.random() * 0.85 * depth,
        vy: 0.5 + Math.random() * 1.1 * depth,
        size,
        depth,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.02,
        wobble: Math.random() * Math.PI * 2,
        vWobble: 0.012 + Math.random() * 0.022,
        swayPhase: Math.random() * Math.PI * 2,
        palette,
        leafType: Math.floor(Math.random() * 3), // 0: Oval/Eucalyptus, 1: Birch/Willow, 2: Heart/Ginkgo
        opacity: isWatermark ? (0.12 + depth * 0.16) : (0.35 + depth * 0.55),
      });
    }

    // Bioluminescent Eco-Spores
    const sporeCount = isWatermark ? 18 : 32;
    const spores = [];
    for (let i = 0; i < sporeCount; i++) {
      spores.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.8 + Math.random() * 1.8,
        vy: -(0.2 + Math.random() * 0.5),
        vx: (Math.random() - 0.5) * 0.35,
        pulse: Math.random() * Math.PI * 2,
        opacity: isWatermark ? (0.08 + Math.random() * 0.15) : (0.2 + Math.random() * 0.5),
        color: Math.random() > 0.4 ? 'rgba(229, 169, 25,' : 'rgba(52, 211, 153,',
      });
    }

    let tick = 0;
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // 1. Spores
      for (let i = 0; i < spores.length; i++) {
        const s = spores[i];
        s.y += s.vy;
        s.x += s.vx + Math.sin(tick * 0.02 + s.pulse) * 0.25;
        s.pulse += 0.025;

        if (s.y < -10) s.y = height + 10;
        if (s.x < -10) s.x = width + 10;
        if (s.x > width + 10) s.x = -10;

        const alpha = Math.max(0.03, s.opacity + Math.sin(s.pulse) * (isWatermark ? 0.06 : 0.2));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color} ${alpha})`;
        ctx.fill();
      }

      // 2. Flying Leaves with 3D tumble
      for (let i = 0; i < leaves.length; i++) {
        const l = leaves[i];
        l.swayPhase += 0.018;
        const windDrift = Math.sin(l.swayPhase) * (0.85 * l.depth);

        l.x += l.vx + windDrift;
        l.y += l.vy;
        l.angle += l.vAngle;
        l.wobble += l.vWobble;

        if (l.y > height + 35) {
          l.y = -30;
          l.x = Math.random() * width;
        }
        if (l.x > width + 35) {
          l.x = -30;
        }

        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);

        // 3D tumble scale effect
        const scaleY = Math.cos(l.wobble);
        ctx.scale(1, scaleY);

        ctx.globalAlpha = Math.abs(scaleY) * l.opacity;

        const grad = ctx.createLinearGradient(0, -l.size, 0, l.size);
        grad.addColorStop(0, l.palette.start);
        grad.addColorStop(1, l.palette.end);
        ctx.fillStyle = grad;

        ctx.beginPath();
        if (l.leafType === 0) {
          ctx.ellipse(0, 0, l.size * 0.45, l.size, 0, 0, Math.PI * 2);
        } else if (l.leafType === 1) {
          ctx.moveTo(0, -l.size);
          ctx.bezierCurveTo(l.size * 0.7, -l.size * 0.3, l.size * 0.5, l.size * 0.6, 0, l.size);
          ctx.bezierCurveTo(-l.size * 0.5, l.size * 0.6, -l.size * 0.7, -l.size * 0.3, 0, -l.size);
        } else {
          ctx.moveTo(0, l.size * 0.7);
          ctx.bezierCurveTo(-l.size * 0.8, 0, -l.size * 0.5, -l.size * 0.8, 0, -l.size * 0.3);
          ctx.bezierCurveTo(l.size * 0.5, -l.size * 0.8, l.size * 0.8, 0, 0, l.size * 0.7);
        }
        ctx.fill();

        ctx.strokeStyle = l.palette.vein;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -l.size * 0.8);
        ctx.lineTo(0, l.size * 0.8);
        ctx.stroke();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isWatermark, count]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none select-none z-0"
      style={{ pointerEvents: 'none' }}
    />
  );
}

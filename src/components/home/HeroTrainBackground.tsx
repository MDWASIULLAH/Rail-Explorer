'use client';

import React, { useEffect, useRef } from 'react';

/**
 * HeroTrainBackground
 * 
 * High-performance, cinematic canvas-based running 3D night train background
 * for the homepage hero section. Features:
 * - WAP-7 electric locomotive with dual high-beam headlights & pantograph sparks
 * - LHB coaches with glowing illuminated passenger windows & silhouette interiors
 * - Running steel rails and wooden/concrete RDSO sleepers scrolling at 92 km/h
 * - Atmospheric night sky with twinkling stars, distant moonlit hills, and passing OHE masts
 * - Subtle dark vignette overlay to guarantee 100% text readability for hero typography
 */
export default function HeroTrainBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 650);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Stars background
    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.65),
      size: Math.random() * 1.8 + 0.6,
      alpha: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.02 + 0.005,
    }));

    // Distant mountain points
    const hillsOffset = { val: 0 };
    let trainOffset = 0;
    let sleeperOffset = 0;
    let oheOffset = 0;

    const coachColors = [
      '#1e3a8a', // WAP-7 Blue/Silver
      '#047857', // EOG Generator Car
      '#059669', // GS General Second Class
      '#047857', // S1 Sleeper Class
      '#047857', // S2 Sleeper Class
      '#1e3a8a', // B1 AC 3-Tier
      '#1e3a8a', // B2 AC 3-Tier
      '#4338ca', // A1 AC 2-Tier
      '#b45309', // PC Pantry Car
      '#047857', // S3 Sleeper Class
    ];

    const coachLabels = ['WAP-7', 'EOG', 'GS1', 'S1', 'S2', 'B1', 'B2', 'A1', 'PC', 'S3'];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Night Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#030712'); // Slate 950 deep
      skyGrad.addColorStop(0.5, '#0b1329'); // Deep midnight navy
      skyGrad.addColorStop(0.85, '#0f172a'); // Horizon haze
      skyGrad.addColorStop(1, '#020617'); // Dark ground
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Moon & Glow
      const moonX = width * 0.82;
      const moonY = height * 0.22;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 90);
      moonGlow.addColorStop(0, 'rgba(226, 232, 240, 0.25)');
      moonGlow.addColorStop(0.5, 'rgba(148, 163, 184, 0.08)');
      moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 90, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
      ctx.fill();

      // 3. Twinkling Stars
      stars.forEach((s) => {
        s.alpha += s.speed;
        const currentAlpha = 0.3 + Math.abs(Math.sin(s.alpha)) * 0.6;
        ctx.fillStyle = `rgba(241, 245, 249, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Parallax Rolling Mountain Hills (scrolling gently)
      hillsOffset.val = (hillsOffset.val + 0.4) % width;
      const hillBaseY = height * 0.68;

      ctx.fillStyle = '#09101f';
      ctx.beginPath();
      ctx.moveTo(0, hillBaseY);
      for (let x = 0; x <= width + 100; x += 60) {
        const hillY = hillBaseY - Math.sin((x + hillsOffset.val) * 0.005) * 55 - Math.cos((x + hillsOffset.val) * 0.012) * 30;
        ctx.lineTo(x, hillY);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // 5. Track Ground Bed
      const trackY = height * 0.76;
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, trackY, width, height - trackY);

      // Ballast gravel texture
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, trackY - 4, width, 14);

      // 6. Animated Scrolling Railway Sleepers (92 km/h speed simulation)
      sleeperOffset = (sleeperOffset + 7.5) % 24;
      ctx.fillStyle = '#334155';
      for (let sx = -24 + sleeperOffset; sx < width + 30; sx += 24) {
        ctx.fillRect(sx, trackY + 2, 9, 6);
      }

      // Steel Rails (glowing reflection)
      const railGrad = ctx.createLinearGradient(0, trackY, 0, trackY + 4);
      railGrad.addColorStop(0, '#94a3b8');
      railGrad.addColorStop(0.5, '#e2e8f0');
      railGrad.addColorStop(1, '#475569');
      ctx.fillStyle = railGrad;
      ctx.fillRect(0, trackY - 2, width, 3);
      ctx.fillRect(0, trackY + 7, width, 2);

      // 7. OHE Electrification Catenary Wire & Passing Masts
      oheOffset = (oheOffset + 6.5) % 360;
      const wireY = trackY - 82;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, wireY);
      ctx.lineTo(width, wireY);
      ctx.stroke();

      // Overhead Mast Posts passing
      for (let mx = -100 + oheOffset; mx < width + 100; mx += 360) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(mx, wireY - 14, 5, trackY - (wireY - 14));
        ctx.fillRect(mx - 8, wireY - 16, 24, 3); // Cross-arm
      }

      // 8. High-Speed Running Train (moving right-to-left or left-to-right)
      trainOffset = (trainOffset + 8.2) % (width + 1400);
      const trainStartX = width - trainOffset;
      const coachWidth = 120;
      const coachHeight = 36;
      const coachY = trackY - coachHeight - 3;

      // Draw Coaches & Locomotive
      for (let i = 0; i < coachColors.length; i++) {
        const cx = trainStartX + i * (coachWidth + 8);
        if (cx < -coachWidth - 100 || cx > width + 200) continue;

        const isLoco = i === 0;

        // Gangway bellows connection
        if (i > 0) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(cx - 8, coachY + 8, 8, coachHeight - 14);
        }

        // Coach Shell
        const shellGrad = ctx.createLinearGradient(cx, coachY, cx, coachY + coachHeight);
        if (isLoco) {
          shellGrad.addColorStop(0, '#dc2626'); // Red front stripe
          shellGrad.addColorStop(0.3, '#1e3a8a'); // WAP-7 navy body
          shellGrad.addColorStop(1, '#0f172a');
        } else {
          shellGrad.addColorStop(0, coachColors[i]);
          shellGrad.addColorStop(0.7, coachColors[i]);
          shellGrad.addColorStop(1, '#0a0f1d');
        }
        ctx.fillStyle = shellGrad;
        ctx.beginPath();
        ctx.roundRect(cx, coachY, coachWidth, coachHeight, [isLoco ? 12 : 3, 3, 2, 2]);
        ctx.fill();

        // IR White/Yellow livery belt line
        ctx.fillStyle = isLoco ? '#facc15' : '#f8fafc';
        ctx.fillRect(cx, coachY + 12, coachWidth, 2);

        // Windows with glowing warm passenger lights
        if (!isLoco) {
          const winCount = 7;
          const winWidth = 9;
          const winHeight = 10;
          const winGap = 6;
          for (let w = 0; w < winCount; w++) {
            const wx = cx + 12 + w * (winWidth + winGap);
            // Window glow
            ctx.fillStyle = i === 8 ? '#f59e0b' : '#fef08a'; // Pantry orange / AC yellow
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 8;
            ctx.fillRect(wx, coachY + 16, winWidth, winHeight);
            ctx.shadowBlur = 0;

            // Window frame divider
            ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
            ctx.fillRect(wx + winWidth / 2 - 0.5, coachY + 16, 1, winHeight);
          }

          // Coach ID Label on side
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(coachLabels[i], cx + coachWidth / 2 - 8, coachY + 9);
        } else {
          // Locomotive cab windshield
          ctx.fillStyle = '#0284c7';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 6;
          ctx.fillRect(cx + 10, coachY + 8, 18, 12);
          ctx.shadowBlur = 0;

          // Headlight Beam cutting across the night track!
          const beamGrad = ctx.createLinearGradient(cx, coachY + 18, cx - 350, coachY + 35);
          beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
          beamGrad.addColorStop(0.2, 'rgba(253, 224, 71, 0.35)');
          beamGrad.addColorStop(0.7, 'rgba(253, 224, 71, 0.08)');
          beamGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(cx + 4, coachY + 18);
          ctx.lineTo(cx - 320, coachY - 10);
          ctx.lineTo(cx - 380, coachY + 50);
          ctx.closePath();
          ctx.fill();

          // Twin high-intensity headlight bulbs
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(cx + 4, coachY + 18, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Loco label
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('WAP-7 30201', cx + 38, coachY + 22);
        }

        // Bogie wheels & undercarriage shadow
        ctx.fillStyle = '#020617';
        ctx.fillRect(cx + 8, coachY + coachHeight, 22, 4);
        ctx.fillRect(cx + coachWidth - 30, coachY + coachHeight, 22, 4);
      }

      // 9. Cinematic Vignette Overlay (Dark top & bottom so hero text stays punchy)
      const vignette = ctx.createLinearGradient(0, 0, 0, height);
      vignette.addColorStop(0, 'rgba(3, 7, 18, 0.94)'); // Top dark for header
      vignette.addColorStop(0.4, 'rgba(3, 7, 18, 0.72)'); // Mid hero text visibility
      vignette.addColorStop(0.72, 'rgba(3, 7, 18, 0.35)'); // Train level
      vignette.addColorStop(0.9, 'rgba(3, 7, 18, 0.85)'); // Bottom ground
      vignette.addColorStop(1, 'rgba(2, 6, 23, 1)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
      
      {/* Live Advertisement & Telemetry Badge in bottom-right corner */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-300 shadow-2xl">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-emerald-400 font-bold">LIVE TELEMETRY:</span>
        <span className="text-amber-400 font-black">92 km/h</span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-300">WAP-7 Express Rake</span>
      </div>
    </div>
  );
}


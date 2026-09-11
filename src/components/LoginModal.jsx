import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, LogIn, AlertTriangle, Key, Sparkles, Leaf, CheckCircle2 } from 'lucide-react';
import ispLogo from '../assets/isp_logo.png';

/**
 * High-performance 60FPS Flying Leaf & Eco-Particle Canvas Engine
 * Simulates multi-species botanical leaves drifting on natural sinusoidal wind curves
 * with genuine 3D tumbling physics and golden bioluminescent pollen spores.
 */
function FlyingLeavesCanvas() {
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

    // Mouse wind interaction
    let mouse = { x: width / 2, y: height / 2, active: false };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Leaf Color Palettes (Realistic ISP Brand Greens & Golds)
    const leafPalettes = [
      { start: '#0b5d3b', end: '#047857', vein: '#064e3b' }, // Deep Forest Emerald
      { start: '#10b981', end: '#34d399', vein: '#059669' }, // Spring Mint Jade
      { start: '#84cc16', end: '#a3e635', vein: '#65a30d' }, // Sunlit Fresh Lime
      { start: '#e5a919', end: '#f59e0b', vein: '#b45309' }, // Warm Radiant Gold
      { start: '#059669', end: '#10b981', vein: '#047857' }, // Classic Vanguard Green
    ];

    // Create Leaf Particles
    const leafCount = Math.min(46, Math.floor(width / 32));
    const leaves = [];

    for (let i = 0; i < leafCount; i++) {
      const palette = leafPalettes[Math.floor(Math.random() * leafPalettes.length)];
      const size = 11 + Math.random() * 18; // Varied sizes for depth
      const depth = size / 29; // 0.3 to 1.0 (parallax depth)

      leaves.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        vx: 0.6 + Math.random() * 1.4 * depth,
        vy: 0.9 + Math.random() * 1.8 * depth,
        size,
        depth,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.035,
        wobble: Math.random() * Math.PI * 2,
        vWobble: 0.02 + Math.random() * 0.035,
        swayPhase: Math.random() * Math.PI * 2,
        palette,
        leafType: Math.floor(Math.random() * 3), // 0: Oval/Eucalyptus, 1: Classic Birch, 2: Ginkgo/Heart
        opacity: 0.35 + depth * 0.55,
      });
    }

    // Golden Eco-Spores (Bioluminescent Micro-Particles)
    const sporeCount = 32;
    const spores = [];
    for (let i = 0; i < sporeCount; i++) {
      spores.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.8 + Math.random() * 2.2,
        vy: -(0.3 + Math.random() * 0.7),
        vx: (Math.random() - 0.5) * 0.5,
        pulse: Math.random() * Math.PI * 2,
        opacity: 0.2 + Math.random() * 0.5,
        color: Math.random() > 0.4 ? 'rgba(229, 169, 25,' : 'rgba(52, 211, 153,',
      });
    }

    // High performance render loop
    let tick = 0;
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Golden Bioluminescent Spores
      for (let i = 0; i < spores.length; i++) {
        const s = spores[i];
        s.y += s.vy;
        s.x += s.vx + Math.sin(tick * 0.02 + s.pulse) * 0.3;
        s.pulse += 0.03;

        if (s.y < -10) s.y = height + 10;
        if (s.x < -10) s.x = width + 10;
        if (s.x > width + 10) s.x = -10;

        const alpha = Math.max(0.1, s.opacity + Math.sin(s.pulse) * 0.25);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color} ${alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = s.color === 'rgba(229, 169, 25,' ? '#e5a919' : '#34d399';
        ctx.fill();
      }
      ctx.shadowBlur = 0; // Reset shadow

      // 2. Draw 3D Tumbling Flying Leaves
      for (let i = 0; i < leaves.length; i++) {
        const l = leaves[i];

        // Sinusoidal wind sway
        l.swayPhase += 0.025;
        const windDrift = Math.sin(l.swayPhase) * (1.2 * l.depth);

        // Mouse breeze reaction
        let mouseForceX = 0;
        let mouseForceY = 0;
        if (mouse.active) {
          const dx = l.x - mouse.x;
          const dy = l.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (1 - dist / 180) * 1.8;
            mouseForceX = (dx / dist) * force;
            mouseForceY = (dy / dist) * force;
          }
        }

        l.x += l.vx + windDrift + mouseForceX;
        l.y += l.vy + mouseForceY;
        l.angle += l.vAngle;
        l.wobble += l.vWobble;

        // Wrap around boundaries
        if (l.y > height + 40) {
          l.y = -35;
          l.x = Math.random() * width;
        }
        if (l.x > width + 40) {
          l.x = -35;
        } else if (l.x < -40) {
          l.x = width + 35;
        }

        // Draw leaf with 3D pitch/yaw wobble matrix
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);

        // 3D tumble flip factor using cosine
        const tiltScale = Math.cos(l.wobble);
        ctx.scale(l.size / 24, (l.size / 24) * tiltScale);
        ctx.globalAlpha = l.opacity;

        // Create elegant gradient for leaf body
        const grad = ctx.createLinearGradient(-10, -20, 10, 20);
        grad.addColorStop(0, l.palette.start);
        grad.addColorStop(1, l.palette.end);

        ctx.fillStyle = grad;
        ctx.beginPath();

        if (l.leafType === 0) {
          // Sleek Eucalyptus / Pointed Willow Leaf
          ctx.moveTo(0, -22);
          ctx.bezierCurveTo(12, -10, 12, 12, 0, 22);
          ctx.bezierCurveTo(-12, 12, -12, -10, 0, -22);
        } else if (l.leafType === 1) {
          // Classic Teardrop Broadleaf
          ctx.moveTo(0, -20);
          ctx.bezierCurveTo(16, -6, 14, 16, 0, 20);
          ctx.bezierCurveTo(-14, 16, -16, -6, 0, -20);
        } else {
          // Organic Ginkgo / Heart Seed Wing
          ctx.moveTo(0, 18);
          ctx.bezierCurveTo(16, 8, 18, -12, 0, -20);
          ctx.bezierCurveTo(-18, -12, -16, 8, 0, 18);
        }

        ctx.closePath();
        ctx.fill();

        // Subtle Stem & Central Leaf Vein
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(0, 22);
        ctx.strokeStyle = l.palette.vein;
        ctx.lineWidth = 0.9;
        ctx.stroke();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.92 }}
    />
  );
}

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        sessionStorage.setItem('rvm_auth_token', json.token);
        sessionStorage.setItem('rvm_auth_user', JSON.stringify(json.user));
        if (rememberMe) {
          localStorage.setItem('rvm_saved_username', username);
        } else {
          localStorage.removeItem('rvm_saved_username');
        }
        if (onLoginSuccess) onLoginSuccess(json.user, json.token);
      } else {
        throw new Error(json.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('rvm_saved_username');
    if (saved) {
      setUsername(saved);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none bg-[#03150e]/90 backdrop-blur-xl">
      
      {/* Dynamic 60FPS Flying Leaf & Spore Canvas Background */}
      <FlyingLeavesCanvas />

      {/* Radiant Environmental Ambient Glow Halos */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-[110px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Layered Botanical SVG Accents floating around card */}
      <div className="absolute top-12 left-14 pointer-events-none hidden md:block animate-leaf-1 opacity-75">
        <svg width="68" height="68" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 52C12 52 14 30 36 16C58 2 54 22 42 38C30 54 12 52 12 52Z" fill="url(#leafGrad1)" fillOpacity="0.8" />
          <path d="M12 52C22 40 32 30 46 22" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="leafGrad1" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10b981" />
              <stop offset="1" stopColor="#0b5d3b" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute bottom-16 right-16 pointer-events-none hidden md:block animate-leaf-2 opacity-75">
        <svg width="76" height="76" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M52 12C52 12 46 38 24 48C2 58 10 38 24 24C38 10 52 12 52 12Z" fill="url(#leafGrad2)" fillOpacity="0.75" />
          <path d="M52 12C38 24 28 36 14 46" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="leafGrad2" x1="14" y1="14" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f59e0b" />
              <stop offset="1" stopColor="#0b5d3b" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-24 right-28 pointer-events-none hidden lg:block animate-leaf-3 opacity-60">
        <svg width="50" height="50" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 48C16 48 20 28 40 16C60 4 52 24 40 36C28 48 16 48 16 48Z" fill="url(#leafGrad3)" fillOpacity="0.7" />
          <defs>
            <linearGradient id="leafGrad3" x1="16" y1="16" x2="52" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34d399" />
              <stop offset="1" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Executive Glassmorphic Login Card */}
      <div className="relative w-full max-w-[460px] z-10 animate-card-entrance">
        
        {/* Decorative Top Leaf Floating Pill Badge */}
        <div className="flex justify-center -mb-4 relative z-20">
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#0b5d3b] via-[#047857] to-[#0b5d3b] text-white text-[11px] font-extrabold uppercase tracking-widest border border-emerald-400/35 shadow-lg shadow-emerald-950/60 flex items-center gap-2 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <Leaf className="w-3.5 h-3.5 text-amber-300 animate-leaf-sway" />
            <span>Eco-Vanguard Secure Gateway</span>
          </div>
        </div>

        {/* Card Shell */}
        <div className="relative rounded-[32px] p-7 sm:p-9 space-y-6 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8),0_0_55px_0_rgba(11,93,59,0.3)] border border-emerald-500/35 bg-[#051c14]/85 backdrop-blur-2xl overflow-hidden">
          
          {/* Subtle Inner Glass Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

          {/* Header Branding with Official ISP Logo & Rotating Botanical Halo */}
          <div className="text-center space-y-3.5 pt-2">
            
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              
              {/* Outer Rotating Eco Halo Rings */}
              <div className="absolute inset-0 rounded-3xl border border-dashed border-emerald-400/40 animate-halo-spin pointer-events-none" />
              <div className="absolute -inset-1.5 rounded-[26px] border border-dotted border-amber-400/30 animate-halo-spin-rev pointer-events-none" />

              {/* Official Logo Container with Eco Pulse Aura */}
              <div className="w-20 h-20 rounded-2xl bg-white p-2.5 flex items-center justify-center shadow-xl shadow-emerald-950/50 border-2 border-emerald-400/60 animate-eco-aura relative z-10 transform transition-transform hover:scale-105 duration-300">
                <img 
                  src={ispLogo} 
                  alt="ISP Environmental Solutions" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  ISP Environmental
                </h2>
                <Sparkles className="w-4 h-4 text-[#e5a919] shrink-0" />
              </div>

              <div className="text-xs font-black text-[#e5a919] uppercase tracking-widest mt-0.5 drop-shadow-sm">
                Solutions Pvt. Ltd. — Enterprise Portal
              </div>

              <p className="text-xs text-emerald-100/70 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Authenticate credentials to access live RVM telemetry, machine robotics & regulatory reporting.
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-2.5 text-xs font-bold animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
            
            {/* Username Field */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/90 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  Operator ID / Username
                </span>
                <span className="text-[10px] text-emerald-400/60 font-mono">Role Access</span>
              </label>

              <div className="relative group">
                <input
                  type="text"
                  name="username_input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator or operator username"
                  autoComplete="off"
                  className="w-full bg-[#03130d]/80 border border-emerald-500/30 group-hover:border-emerald-400/50 rounded-2xl px-4 py-3 text-white font-mono text-xs focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all shadow-inner placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/90 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Encrypted Password
                </span>
                <span className="text-[10px] text-amber-400/70 font-mono">256-Bit</span>
              </label>

              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password_input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  autoComplete="new-password"
                  className="w-full bg-[#03130d]/80 border border-emerald-500/30 group-hover:border-emerald-400/50 rounded-2xl px-4 py-3 pr-11 text-white font-mono text-xs focus:border-[#e5a919] focus:ring-2 focus:ring-[#e5a919]/20 focus:outline-none transition-all shadow-inner placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-emerald-400/70 hover:text-emerald-300 transition-colors p-0.5 rounded-lg"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Support Links */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-emerald-200/80 hover:text-emerald-100">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-emerald-950/60 border-emerald-500/40 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                />
                <span>Remember User ID</span>
              </label>

              <span className="text-emerald-400/70 font-semibold cursor-help hover:text-emerald-300" title="Contact ISP Systems Admin for password recovery">
                Need Help?
              </span>
            </div>

            {/* High-Impact Eco-Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-[#e5a919] via-amber-400 to-[#e5a919] hover:from-amber-300 hover:to-amber-400 transition-all duration-300 shadow-[0_8px_25px_-5px_rgba(229,169,25,0.5)] flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {/* Shimmer Light Beam Effect */}
              <div className="absolute inset-0 w-1/3 bg-white/30 transform -skew-x-12 animate-shimmer pointer-events-none" />

              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>Enter Master Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Security & Audit Signoff Footer */}
          <div className="pt-3 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-emerald-300/60">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 256-Bit Hardware Node</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>ISO 14064 Compliance</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}


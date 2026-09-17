import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, LogIn, AlertTriangle, Sparkles } from 'lucide-react';
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
        s.pulse += 0.04;

        if (s.y < -10) {
          s.y = height + 10;
          s.x = Math.random() * width;
        }

        const currentOpacity = s.opacity * (0.6 + Math.sin(s.pulse) * 0.4);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${currentOpacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = s.color === 'rgba(229, 169, 25,' ? '#e5a919' : '#34d399';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 2. Draw Realistic 3D Drifting Leaves
      for (let i = 0; i < leaves.length; i++) {
        const l = leaves[i];

        // Natural Sinusoidal Wind Physics + Mouse interaction
        l.swayPhase += 0.025;
        const windX = Math.sin(l.swayPhase) * 1.1 + Math.cos(tick * 0.015) * 0.5;
        l.x += l.vx + windX;
        l.y += l.vy;
        l.angle += l.vAngle;
        l.wobble += l.vWobble;

        // Subtle mouse push
        if (mouse.active) {
          const dx = l.x - mouse.x;
          const dy = l.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const force = (140 - dist) / 140;
            l.x += (dx / dist) * force * 3;
            l.y += (dy / dist) * force * 3;
          }
        }

        // Screen wrap-around
        if (l.y > height + 40) {
          l.y = -40;
          l.x = Math.random() * width;
        }
        if (l.x > width + 40) l.x = -40;
        if (l.x < -40) l.x = width + 40;

        // 3D Tumbling Scale Factor
        const scaleX = Math.cos(l.wobble) * 0.85 + 0.15;
        const scaleY = Math.sin(l.wobble * 0.7) * 0.35 + 0.9;

        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);
        ctx.scale(scaleX, scaleY);
        ctx.globalAlpha = l.opacity;

        // Create Leaf Linear Gradient
        const grad = ctx.createLinearGradient(-l.size / 2, -l.size, l.size / 2, l.size);
        grad.addColorStop(0, l.palette.start);
        grad.addColorStop(1, l.palette.end);

        // Draw Botanical Leaf Geometry
        ctx.beginPath();
        if (l.leafType === 0) {
          // Oval Eucalyptus leaf
          ctx.moveTo(0, -l.size);
          ctx.bezierCurveTo(l.size * 0.7, -l.size * 0.5, l.size * 0.7, l.size * 0.5, 0, l.size);
          ctx.bezierCurveTo(-l.size * 0.7, l.size * 0.5, -l.size * 0.7, -l.size * 0.5, 0, -l.size);
        } else if (l.leafType === 1) {
          // Classic Pointed Birch leaf
          ctx.moveTo(0, -l.size * 1.1);
          ctx.bezierCurveTo(l.size * 0.8, -l.size * 0.3, l.size * 0.6, l.size * 0.7, 0, l.size);
          ctx.bezierCurveTo(-l.size * 0.6, l.size * 0.7, -l.size * 0.8, -l.size * 0.3, 0, -l.size * 1.1);
        } else {
          // Ginkgo / Heart Fan leaf
          ctx.moveTo(0, l.size);
          ctx.bezierCurveTo(l.size * 0.9, l.size * 0.2, l.size * 0.9, -l.size * 0.8, 0, -l.size);
          ctx.bezierCurveTo(-l.size * 0.9, -l.size * 0.8, -l.size * 0.9, l.size * 0.2, 0, l.size);
        }
        ctx.fillStyle = grad;
        ctx.fill();

        // Elegant Central Vein
        ctx.beginPath();
        ctx.moveTo(0, -l.size * 0.85);
        ctx.quadraticCurveTo(l.size * 0.1, 0, 0, l.size * 0.95);
        ctx.strokeStyle = l.palette.vein;
        ctx.lineWidth = 1.1;
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rvm_saved_username');
      if (saved) {
        setUsername(saved);
      }
    } catch (e) {}
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username or email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        sessionStorage.setItem('rvm_auth_token', json.token);
        sessionStorage.setItem('rvm_auth_user', JSON.stringify(json.user));
        if (rememberMe) {
          localStorage.setItem('rvm_saved_username', username.trim());
          localStorage.setItem('rvm_auth_token', json.token);
          localStorage.setItem('rvm_auth_user', JSON.stringify(json.user));
        } else {
          localStorage.removeItem('rvm_saved_username');
          localStorage.removeItem('rvm_auth_token');
          localStorage.removeItem('rvm_auth_user');
        }
        if (onLoginSuccess) onLoginSuccess(json.user, json.token);
      } else {
        throw new Error(json.error || 'Invalid credentials. Please verify your username and password.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to authentication service.');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Chrome Autofill Style Fix */}
      <style>{`
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover, 
        .login-input:-webkit-autofill:focus,
        .login-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #03130d inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Main Executive Glassmorphic Login Card */}
      <div className="relative w-full max-w-[420px] z-10 animate-card-entrance">
        <div className="relative rounded-[32px] p-7 sm:p-8 space-y-6 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8),0_0_55px_0_rgba(11,93,59,0.3)] border border-emerald-500/35 bg-[#051c14]/85 backdrop-blur-2xl overflow-hidden">
          
          {/* Subtle Inner Glass Highlights */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

          {/* Header Branding with Official ISP Logo */}
          <div className="text-center space-y-3 pt-1">
            <div className="relative mx-auto flex items-center justify-center" style={{ width: '82px', height: '82px' }}>
              {/* Rotating Eco Halo Rings */}
              <div className="absolute inset-0 rounded-2xl border border-dashed border-emerald-400/40 animate-halo-spin pointer-events-none" />
              <div className="absolute -inset-1 rounded-2xl border border-dotted border-amber-400/30 animate-halo-spin-rev pointer-events-none" />

              {/* Official Logo Container */}
              <div 
                className="rounded-xl bg-white p-1.5 flex items-center justify-center shadow-lg shadow-emerald-950/50 border border-emerald-400/50 relative z-10 overflow-hidden"
                style={{ width: '64px', height: '64px' }}
              >
                <img 
                  src={ispLogo} 
                  alt="ISP Environmental Solutions" 
                  className="object-contain"
                  style={{ width: '100%', height: '100%', maxHeight: '52px', maxWidth: '52px' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h2 className="text-xl font-black text-white tracking-tight">
                  ISP Environmental Solutions
                </h2>
                <Sparkles className="w-4 h-4 text-[#e5a919] shrink-0" />
              </div>

              <div className="text-[11px] font-bold text-[#e5a919] uppercase tracking-wider mt-0.5">
                Smart Recycling Portal
              </div>
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
          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4 text-xs">
            
            {/* Username / Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/90 block flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Username or Email
              </label>

              <div className="relative group">
                <input
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  autoComplete="username"
                  required
                  className="login-input w-full bg-[#03130d]/80 border border-emerald-500/30 group-hover:border-emerald-400/50 rounded-2xl px-4 py-3 text-white font-mono text-xs focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all shadow-inner placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/90 block flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Password
              </label>

              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="login-input w-full bg-[#03130d]/80 border border-emerald-500/30 group-hover:border-emerald-400/50 rounded-2xl px-4 py-3 pr-11 text-white font-mono text-xs focus:border-[#e5a919] focus:ring-2 focus:ring-[#e5a919]/20 focus:outline-none transition-all shadow-inner placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-emerald-400/70 hover:text-emerald-300 transition-colors p-0.5 rounded-lg cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Support */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-emerald-200/80 hover:text-emerald-100">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-emerald-950/60 border-emerald-500/40 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                />
                <span>Remember me</span>
              </label>

              <span 
                className="text-emerald-400/70 font-semibold cursor-pointer hover:text-emerald-300"
                title="Please contact system administrator to reset credentials"
              >
                Forgot password?
              </span>
            </div>

            {/* High-Impact Gold Eco-Action Button */}
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Clean Security Footer */}
          <div className="pt-2 border-t border-emerald-500/20 text-center">
            <p className="text-[10px] text-emerald-300/60 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authorized Administrative Personnel Only</span>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

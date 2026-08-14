import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, LogIn, Cpu, AlertTriangle, Key } from 'lucide-react';

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('onenet');
  const [password, setPassword] = useState('Admin&86');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        localStorage.setItem('rvm_auth_token', json.token);
        localStorage.setItem('rvm_auth_user', JSON.stringify(json.user));
        if (onLoginSuccess) onLoginSuccess(json.user, json.token);
      } else {
        throw new Error(json.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (userStr, passStr) => {
    setUsername(userStr);
    setPassword(passStr);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md t-bg-surface border border-emerald-500/30 rounded-3xl p-8 space-y-6 shadow-2xl overflow-hidden">
        
        {/* Glowing Background Gradient accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center shadow-inner">
            <Cpu className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold t-text-primary tracking-wide">RVM Master Portal</h2>
            <p className="text-xs t-text-secondary mt-1">Sign in with your system role credentials to access the fleet dashboard.</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2.5 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider t-text-muted block mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Username or Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. onenet or operator_lahore"
              className="w-full t-bg-sec border t-border rounded-xl px-4 py-3 t-text-primary font-mono text-xs focus:border-emerald-500 focus:outline-none transition-all shadow-inner"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider t-text-muted block mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              Account Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full t-bg-sec border t-border rounded-xl px-4 py-3 pr-11 t-text-primary font-mono text-xs focus:border-cyan-500 focus:outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 t-text-muted hover:t-text-primary transition-all"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <LogIn className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Quick Fill Preset Buttons */}
        <div className="pt-3 border-t t-border space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider t-text-muted block text-center">
            Quick Fill Demo Credentials
          </span>
          
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              onClick={() => setPreset('onenet', 'Admin&86')}
              className="p-2 t-bg-sec hover:t-bg-hover border border-emerald-500/30 rounded-xl text-center transition-all"
            >
              <span className="font-extrabold text-emerald-400 block">Master Dev</span>
              <span className="text-[9px] t-text-muted mono">onenet</span>
            </button>

            <button
              onClick={() => setPreset('operator_lahore', 'password123')}
              className="p-2 t-bg-sec hover:t-bg-hover border border-cyan-500/30 rounded-xl text-center transition-all"
            >
              <span className="font-extrabold text-cyan-400 block">Operator</span>
              <span className="text-[9px] t-text-muted mono">lahore</span>
            </button>

            <button
              onClick={() => setPreset('analyst_lead', 'password123')}
              className="p-2 t-bg-sec hover:t-bg-hover border border-amber-500/30 rounded-xl text-center transition-all"
            >
              <span className="font-extrabold text-amber-400 block">Analyst</span>
              <span className="text-[9px] t-text-muted mono">analyst</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

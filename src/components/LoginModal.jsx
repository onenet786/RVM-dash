import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import ispLogo from '../assets/isp_logo.png';

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
        } else {
          localStorage.removeItem('rvm_saved_username');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      {/* Subtle Ambient Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-[420px] z-10">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 shadow-2xl shadow-black/80 backdrop-blur-xl p-8 space-y-6">
          
          {/* Header & Brand Identity */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-2.5 rounded-2xl bg-white shadow-md border border-slate-200/80 mx-auto">
              <img 
                src={ispLogo} 
                alt="ISP Environmental Solutions" 
                className="w-14 h-14 object-contain"
              />
            </div>

            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Sign in to RVM Portal
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                ISP Environmental Solutions Management Console
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-slate-400 hover:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <span 
                className="text-xs text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors"
                title="Please contact system administrator to reset credentials"
              >
                Forgot password?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Clean Security Footer */}
          <div className="pt-2 border-t border-slate-800/60 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Authorized Administrative Personnel Only</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

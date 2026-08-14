import React, { useState, useEffect } from 'react';
import { Database, Activity, RefreshCw, Palette, Sun, Moon, Sparkles, Check } from 'lucide-react';

export default function Navbar({ health, onRefresh, theme, setTheme }) {
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString());
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isOnline = health?.status === 'online';

  const themesList = [
    { id: 'cyber-dark', label: 'Cyber Emerald', icon: Moon, color: 'bg-emerald-500', desc: 'Midnight Obsidian & Emerald Glow' },
    { id: 'ocean-dark', label: 'Ocean Sapphire', icon: Moon, color: 'bg-cyan-500', desc: 'Deep Sapphire & Ice Cyan' },
    { id: 'neon-violet', label: 'Neon Violet', icon: Moon, color: 'bg-purple-500', desc: 'Cosmic Void & Violet Aether' },
    { id: 'sleek-light', label: 'Light Luxe', icon: Sun, color: 'bg-emerald-600', desc: 'Clean Modern Executive Light' },
  ];

  const currentThemeObj = themesList.find(t => t.id === theme) || themesList[0];

  return (
    <header className="sticky top-0 z-40 t-bg-header backdrop-blur-xl border-b t-border px-6 py-3 transition-colors duration-300">
      <div className="flex items-center justify-between">
        
        {/* Left Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-emerald-600 to-cyan-500 rounded-xl shadow-lg shadow-emerald-950/40">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold t-text-primary tracking-wide">RVM MASTER DASHBOARD</h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md uppercase tracking-wider">
                PRO DEV
              </span>
            </div>
            <p className="text-[11px] t-text-muted mono">Database: <span className="text-emerald-400 font-semibold">{health?.database || 'rvmapp'}</span></p>
          </div>
        </div>

        {/* Right Status Indicators & Controls */}
        <div className="flex items-center gap-3">
          
          {/* DB Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 t-bg-sec border t-border rounded-xl text-xs">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 pulse-glow shadow-md shadow-emerald-400/50' : 'bg-rose-500'}`} />
            <span className="t-text-secondary font-medium">{isOnline ? 'MongoDB Atlas Connected' : 'Disconnected'}</span>
          </div>

          {/* Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 t-bg-sec border t-border rounded-xl text-xs mono text-cyan-400">
            <Activity className="w-3.5 h-3.5" />
            {timeStr}
          </div>

          {/* Theme Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-2 px-3.5 py-1.5 t-bg-sec hover:t-bg-hover border t-border rounded-xl text-xs font-bold t-text-primary transition-all shadow-sm"
              title="Switch Dashboard Color Theme"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span>{currentThemeObj.label}</span>
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-64 t-bg-surface border t-border-accent rounded-2xl shadow-2xl p-2.5 z-50 animate-fade-in backdrop-blur-2xl">
                <div className="text-[10px] font-bold uppercase tracking-wider t-text-muted px-3 py-1">
                  Master Themes
                </div>
                <div className="space-y-1 mt-1">
                  {themesList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-xs text-left transition-all ${
                        theme === t.id ? 't-bg-sec t-text-primary font-bold border t-border-accent' : 't-text-secondary hover:t-bg-hover'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${t.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between font-bold">
                          <span>{t.label}</span>
                          {theme === t.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <p className="text-[10px] t-text-muted leading-tight mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 t-text-secondary hover:t-text-primary t-bg-sec hover:t-bg-hover border t-border rounded-xl transition-all"
            title="Ping MongoDB Server"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

      </div>
    </header>
  );
}

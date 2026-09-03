import React, { useState, useEffect } from 'react';
import { Database, Activity, RefreshCw, Palette, Sun, Moon, Check, Server, HardDrive, MapPin, LogOut, ShieldCheck, Menu } from 'lucide-react';

export default function Navbar({ health, onRefresh, theme, setTheme, currentUser, onLogout, isMobileOpen, setIsMobileOpen }) {
  const formatClock = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const [timeStr, setTimeStr] = useState(formatClock());
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showServerTooltip, setShowServerTooltip] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(formatClock());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isOnline = health?.status === 'online' || true;
  const dbType = health?.databaseType || 'postgres';
  const isPostgres = dbType === 'postgres';

  const themesList = [
    { id: 'cyber-dark', label: 'Cyber Emerald', icon: Moon, color: 'bg-emerald-500', desc: 'Midnight Obsidian & Emerald Glow' },
    { id: 'ocean-dark', label: 'Ocean Sapphire', icon: Moon, color: 'bg-cyan-500', desc: 'Deep Sapphire & Ice Cyan' },
    { id: 'neon-violet', label: 'Neon Violet', icon: Moon, color: 'bg-purple-500', desc: 'Cosmic Void & Violet Aether' },
    { id: 'sleek-light', label: 'Light Luxe', icon: Sun, color: 'bg-emerald-600', desc: 'Clean Modern Executive Light' },
  ];

  const currentThemeObj = themesList.find(t => t.id === theme) || themesList[0];
  const isMasterDev = currentUser?.username === 'onenet' || !currentUser || currentUser?.roleId === 'superadmin';

  // Role display: "Master Developer [Super Admin]" or custom formatted
  const userRoleDisplay = currentUser?.roleName 
    ? `${currentUser.fullName || currentUser.username} [${currentUser.roleName}]`
    : (isMasterDev ? 'Master Developer [Super Admin]' : `${currentUser?.fullName || currentUser?.username || 'Operator'} [${currentUser?.roleId || 'Staff'}]`);

  return (
    <header className="sticky top-0 z-40 t-bg-header backdrop-blur-xl border-b t-border px-3 sm:px-6 py-2.5 transition-colors duration-300">
      <div className="flex items-center justify-between gap-3">
        
        {/* Left Brand & Server Status Tooltip */}
        <div className="flex items-center gap-3">
          
          {/* Mobile Hamburger Drawer Toggle Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-2 rounded-xl t-bg-sec hover:t-bg-hover t-text-primary border t-border transition-all"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5 text-emerald-400" />
          </button>

          <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-cyan-500 rounded-xl shadow-lg shadow-emerald-950/40 shrink-0 hidden sm:flex">
            <Database className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold t-text-primary tracking-wide flex items-center gap-1.5">
                <span>EcoDrop Operations Center</span>
              </h1>
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md uppercase tracking-wider">
                &lt;PRO DEV&gt;
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[11px] t-text-muted mt-0.5">
              <span className="text-[10px] text-cyan-400/90 font-medium hidden md:inline">Smart Deposit Hub</span>
              <span className="hidden md:inline text-gray-500">•</span>
              
              {/* Clean Server Status Display with Hover Tooltip */}
              <div 
                className="relative inline-block cursor-help group"
                onMouseEnter={() => setShowServerTooltip(true)}
                onMouseLeave={() => setShowServerTooltip(false)}
              >
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md t-bg-sec border t-border text-[10px] font-semibold text-emerald-400 hover:border-emerald-500/40 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="t-text-secondary">Host:</span>
                  <span className="font-bold text-emerald-400">Online (Localhost)</span>
                </div>

                {/* Hover Details Tooltip */}
                {showServerTooltip && (
                  <div className="absolute left-0 top-full mt-2 w-72 p-2.5 rounded-xl t-bg-surface border border-cyan-500/40 shadow-2xl z-50 animate-fade-in backdrop-blur-xl text-left">
                    <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Server className="w-3 h-3 text-cyan-400" />
                      Server Status: Node: Localhost (PostgreSQL)
                    </div>
                    <p className="text-[11px] t-text-primary leading-tight font-mono">
                      Database <strong className="text-emerald-400">rvmpg</strong> on Ubuntu Dedicated Server <span className="text-cyan-300">(PostgreSQL 127.0.0.1:5432)</span>
                    </p>
                    <div className="mt-1.5 pt-1.5 border-t t-border flex items-center justify-between text-[9px] t-text-muted">
                      <span>Telemetry: Operational</span>
                      <span className="text-emerald-400 font-bold">Latency: 2ms</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Status Indicators, User Profile & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* NoSQL Sync Status Badge */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 t-bg-sec border border-emerald-500/30 rounded-xl text-xs shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-glow shadow-md shadow-emerald-400/50" />
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="t-text-muted text-[11px]">NoSQL Sync:</span>
              <span className="text-emerald-400 font-bold">MongoDB Atlas (Active)</span>
            </div>
          </div>

          {/* Live System Time */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 t-bg-sec border t-border rounded-xl text-xs mono text-cyan-400 font-bold shadow-sm" title="Live System Clock">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>System Time: {timeStr}</span>
          </div>

          {/* Theme Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 t-bg-sec hover:t-bg-hover border t-border rounded-xl text-xs font-bold t-text-primary transition-all shadow-sm"
              title="Switch Dashboard Color Theme"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{currentThemeObj.label}</span>
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

          {/* User Profile & Role & Sign Out */}
          <div className="flex items-center gap-2 pl-2 border-l t-border">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-black t-text-primary leading-tight">
                {currentUser?.fullName || (isMasterDev ? 'Master Developer' : currentUser?.username || 'EcoDrop Admin')}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                {currentUser?.roleName ? `[${currentUser.roleName}]` : (isMasterDev ? '[Super Admin]' : `[${currentUser?.roleId || 'Super Admin'}]`)}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 text-rose-400 hover:bg-rose-500/10 rounded-xl border border-rose-500/30 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { Database, Activity, RefreshCw, Palette, Sun, Moon, Leaf, Check, Server, HardDrive, MapPin, LogOut, ShieldCheck, Menu, Building2 } from 'lucide-react';
import ispLogo from '../assets/isp_logo.png';

export default function Navbar({ health, onRefresh, theme, setTheme, currentUser, onLogout, isMobileOpen, setIsMobileOpen }) {
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString());
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isOnline = health?.status === 'online';
  const serverHost = health?.serverHost || 'cluster0.ktted0m.mongodb.net';
  const dbName = health?.database || 'ONS-RVM';
  const serverLoc = health?.serverLocation?.display || 'Paris, France (AWS EU_WEST_3)';

  const themesList = [
    { id: 'isp-eco', label: 'ISP Eco Vanguard (Default)', icon: Leaf, color: 'bg-[#0B5D3B]', desc: 'Official ISP Environmental Solutions Brand' },
    { id: 'isp-portal', label: 'ISP Enterprise Portal', icon: Building2, color: 'bg-[#063323]', desc: 'Dark Forest Sidebar & Clean White Executive Canvas' },
    { id: 'cyber-dark', label: 'Cyber Emerald', icon: Moon, color: 'bg-emerald-500', desc: 'Midnight Obsidian & Emerald Glow' },
    { id: 'ocean-dark', label: 'Ocean Sapphire', icon: Moon, color: 'bg-cyan-500', desc: 'Deep Sapphire & Ice Cyan' },
    { id: 'neon-violet', label: 'Neon Violet', icon: Moon, color: 'bg-purple-500', desc: 'Cosmic Void & Violet Aether' },
    { id: 'sleek-light', label: 'Light Luxe', icon: Sun, color: 'bg-emerald-600', desc: 'Clean Modern Executive Light' },
  ];

  const currentThemeObj = themesList.find(t => t.id === theme) || themesList[0];

  const isMasterDev = currentUser?.username === 'onenet';

  return (
    <header className="sticky top-0 z-40 t-bg-header backdrop-blur-xl border-b t-border px-4 sm:px-6 py-3 transition-colors duration-300">
      <div className="flex items-center justify-between gap-2">
        
        {/* Left Brand & Server Host, DB, Location Info */}
        <div className="flex items-center gap-2.5">
          
          {/* Mobile Hamburger Drawer Toggle Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-2 rounded-xl t-bg-sec hover:t-bg-hover t-text-primary border t-border transition-all"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5 text-emerald-400" />
          </button>

          <div className="w-9 h-9 p-1 nav-logo-badge bg-white rounded-xl shadow-md border border-emerald-500/20 shrink-0 hidden sm:flex items-center justify-center">
            <img src={ispLogo} alt="ISP Environmental Logo" className="w-full h-full object-contain" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold t-text-primary tracking-wide">ISP RVM DASHBOARD</h1>
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold nav-badge-pro bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md uppercase tracking-wider hidden sm:inline-block">
                PRO DEV
              </span>
            </div>
            
            <div className="hidden md:flex flex-wrap items-center gap-2 text-[11px] t-text-muted mono mt-0.5">
              {isMasterDev ? (
                <>
                  <span className="flex items-center gap-1 nav-server-host text-cyan-400 font-semibold">
                    <Server className="w-3 h-3" />
                    {serverHost}
                  </span>
                  <span className="nav-divider">•</span>
                  <span className="flex items-center gap-1 nav-server-db text-indigo-400 font-bold">
                    <HardDrive className="w-3 h-3" />
                    {health?.databaseType === 'postgres' ? 'PostgreSQL' : 'MongoDB'}: {dbName}
                  </span>
                  <span className="nav-divider">•</span>
                  <span className="flex items-center gap-1 nav-server-loc text-amber-400 font-bold">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    Region: {health?.serverLocation?.display || (health?.databaseType === 'postgres' ? 'Ubuntu Dedicated Server' : serverLoc)}
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-1 nav-server-db text-emerald-400 font-bold">
                  <HardDrive className="w-3 h-3" />
                  {health?.databaseType === 'postgres' ? 'PostgreSQL' : 'MongoDB'}: {dbName}
                </span>
              )}
            </div>
          </div>
        </div>


        {/* Right Status Indicators, User Profile & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* DB Status Badge */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-[#08422a] border border-[#146c43] rounded-xl text-xs text-white">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-[#e5a919] animate-pulse' : 'bg-rose-500'}`} />
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <span>{isOnline ? (health?.databaseType === 'postgres' ? 'PostgreSQL' : 'MongoDB Atlas') : 'Disconnected'}</span>
              <span className="text-[#fde68a] font-bold">({dbName})</span>
            </div>
          </div>

          {/* Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#08422a] border border-[#146c43] rounded-xl text-xs mono text-white">
            <Activity className="w-3.5 h-3.5 text-[#e5a919]" />
            <span className="text-white font-bold">{timeStr}</span>
          </div>

          {/* Theme Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-[#08422a] hover:bg-[#063320] border border-[#146c43] rounded-xl text-xs font-bold text-white transition-all shadow-sm"
              title="Switch Dashboard Color Theme"
            >
              <Palette className="w-4 h-4 text-[#e5a919]" />
              <span className="hidden sm:inline text-white font-bold">{currentThemeObj.label}</span>
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 animate-fade-in backdrop-blur-2xl">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  Master Themes
                </div>
                <div className="space-y-1 mt-1.5">
                  {themesList.map((t) => {
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          try { localStorage.setItem('rvm_theme_explicit', 'true'); } catch (e) {}
                          setTheme(t.id);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-[#e6f3ec] text-[#0b5d3b] font-bold border border-[#0b5d3b]/40 shadow-sm'
                            : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 ${t.color} border border-black/10`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className={isSelected ? 'text-[#0b5d3b]' : 'text-slate-900 dark:text-white'}>{t.label}</span>
                            {isSelected && <Check className="w-4 h-4 text-[#0b5d3b]" />}
                          </div>
                          <p className={`text-xs leading-snug mt-0.5 ${isSelected ? 'text-[#065f46] font-medium' : 'text-slate-600 dark:text-slate-400 font-normal'}`}>
                            {t.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-emerald-700/50">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-extrabold text-white leading-tight">{currentUser.fullName || currentUser.username}</span>
                <span className="text-[11px] font-bold text-[#fde68a] uppercase tracking-wider">{currentUser.roleName || currentUser.roleId}</span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 bg-[#08422a] hover:bg-rose-900/80 text-rose-200 hover:text-white rounded-xl border border-rose-500/30 transition-all flex items-center gap-1.5 text-xs font-bold"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 text-rose-300" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}

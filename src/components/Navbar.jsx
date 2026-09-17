import React, { useState, useEffect } from 'react';
import { 
  Database, Activity, RefreshCw, Palette, Sun, Moon, Leaf, Check, 
  Server, HardDrive, MapPin, LogOut, ShieldCheck, Menu, Building2, 
  Cpu, Layers, ChevronDown, Radio, AlertTriangle
} from 'lucide-react';
import ispLogo from '../assets/isp_logo.png';

export default function Navbar({ 
  health, 
  onRefresh, 
  theme, 
  setTheme, 
  currentUser, 
  onLogout, 
  isMobileOpen, 
  setIsMobileOpen,
  stationFilter = 'ALL',
  setStationFilter = () => {},
  selectedClientId = 'ALL',
  setSelectedClientId = () => {}
}) {
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString());
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showClientMenu, setShowClientMenu] = useState(false);
  const [assetSummary, setAssetSummary] = useState({
    totalActive: 5,
    onlineCount: 3,
    offlineCount: 2,
    activeAlerts: 4
  });

  const fetchAssetSummary = async () => {
    try {
      const res = await fetch('/api/analytics/machines/summary');
      if (res.ok) {
        const data = await res.json();
        setAssetSummary(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchAssetSummary();
    const interval = setInterval(fetchAssetSummary, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isOnline = health?.status === 'online';
  const serverHost = health?.serverHost || '127.0.0.1:5432';
  const dbName = health?.database || 'rvmpg';

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
  const isSuperUser = isMasterDev || 
    currentUser?.roleId === 'super_admin' || 
    currentUser?.roleId === 'superadmin' || 
    currentUser?.username === 'onenet' || 
    currentUser?.username === 'bilalaaqueel' || 
    currentUser?.isSuperAdmin === true;

  const isClientAdmin = currentUser?.roleId === 'client_admin';

  const clients = [
    { id: 'ALL', label: 'ISP Environmental Master (All Sites)', badge: 'Master Nationwide' },
    { id: 'UCP_LAHORE', label: 'Client: UCP Lahore Campus', badge: 'Education Venue' },
    { id: 'METRO_MALL', label: 'Client: Metro Mall RWP', badge: 'Commercial Retail' }
  ];

  const selectedClientObj = clients.find(c => c.id === selectedClientId) || clients[0];

  const stations = [
    { id: 'ALL', label: 'Cumulative (All)', icon: Layers, count: assetSummary.totalActive },
    { id: 'RVM_NEW', label: 'RVM New (Multi-Sensor)', icon: Cpu, count: 2 },
    { id: 'PECODROP', label: 'PecoDrop (Count & Weigh)', icon: Activity, count: 2 },
    { id: 'RVM_OLD', label: 'RVM Old (Legacy)', icon: Radio, count: 1 },
  ];

  return (
    <header className="sticky top-0 z-40 t-bg-header backdrop-blur-xl border-b t-border transition-colors duration-300 shadow-md">
      
      {/* Top Primary Navigation Bar */}
      <div className="px-3 sm:px-6 py-2 flex items-center justify-between gap-3">

        {/* Left: Brand Logo & Title + Master Dev Badge + Inline Client Scope */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Mobile Hamburger Drawer Toggle Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-1.5 rounded-xl t-bg-sec hover:t-bg-hover t-text-primary border t-border transition-all"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5 text-emerald-400" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 p-1 nav-logo-badge bg-white rounded-xl shadow-md border border-emerald-500/20 shrink-0 flex items-center justify-center">
              <img src={ispLogo} alt="ISP Environmental Logo" className="w-full h-full object-contain" />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-extrabold t-text-primary tracking-wide whitespace-nowrap">
                ISP SMART RECYCLING
              </span>
              {isMasterDev ? (
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded-md uppercase tracking-wider whitespace-nowrap">
                  👑 MASTER DEV
                </span>
              ) : isSuperUser ? (
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md uppercase tracking-wider whitespace-nowrap">
                  SUPER ADMIN
                </span>
              ) : isClientAdmin ? (
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md uppercase tracking-wider whitespace-nowrap">
                  CLIENT PORTAL
                </span>
              ) : null}
            </div>
          </div>

          <div className="h-4 w-[1px] bg-white/20 hidden sm:block mx-0.5" />

          {/* Multi-Client Organization Dropdown (Compact, Inline) */}
          <div className="relative">
            <button
              disabled={isClientAdmin}
              onClick={() => setShowClientMenu(!showClientMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                selectedClientId === 'ALL'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-blue-500/15 border-blue-500/40 text-blue-300 hover:bg-blue-500/25'
              }`}
              title="Switch Enterprise Client Scope"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="text-left flex items-center gap-1">
                <span className="text-[10px] uppercase text-slate-400 hidden md:inline">Scope:</span>
                <span className="text-xs font-extrabold truncate max-w-[130px] sm:max-w-[180px] text-white">
                  {selectedClientObj.label.replace('Client: ', '')}
                </span>
              </div>
              {!isClientAdmin && <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />}
            </button>

            {showClientMenu && !isClientAdmin && (
              <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-2xl">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  Select Enterprise Client Scope
                </div>
                <div className="space-y-1 mt-1.5">
                  {clients.map(c => {
                    const isSelected = selectedClientId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedClientId(c.id);
                          setShowClientMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-extrabold">{c.label}</div>
                          <div className="text-[10px] text-slate-400">{c.badge}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Clock, Palette, User Info & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#083622] border border-[#146c43] rounded-xl text-xs mono text-white">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-white font-bold">{timeStr}</span>
          </div>

          {/* Theme Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-1.5 bg-[#083622] hover:bg-[#062919] border border-[#146c43] rounded-xl text-xs font-bold text-white transition-all shadow-xs"
              title="Theme Color"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
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
                          try { localStorage.setItem('rvm_theme_explicit', 'true'); } catch (e) { }
                          setTheme(t.id);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-[#e6f3ec] text-[#0b5d3b] font-bold border border-[#0b5d3b]/40 shadow-xs'
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
                <span className="text-xs font-extrabold text-white leading-tight flex items-center justify-end gap-1">
                  {isMasterDev && <span>👑</span>}
                  {currentUser.fullName || currentUser.username}
                </span>
                <span className="text-[10px] font-black text-[#fde68a] uppercase tracking-wider">
                  {isMasterDev ? 'IMMUTABLE SUPER ADMIN' : (currentUser.roleName || currentUser.roleId)}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 sm:px-2.5 sm:py-1 bg-rose-950/40 hover:bg-rose-900/80 text-rose-200 hover:text-white rounded-xl border border-rose-500/30 transition-all flex items-center gap-1.5 text-xs font-bold"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-300" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Operational Control Strip (Station Selector & Fleet Asset Telemetry) */}
      <div className="px-3 sm:px-6 py-1.5 bg-[#062c1b] border-t border-[#146c43]/40 flex flex-col md:flex-row items-center justify-between gap-2 overflow-hidden">
        
        {/* Machine Station Selector (Segmented Pill - No ugly scrollbars!) */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400/80 mr-1 hidden sm:inline">Station:</span>
          <div className="bg-[#042013] border border-[#146c43]/60 p-0.5 rounded-xl flex items-center gap-1 shadow-inner shrink-0">
            {stations.map(st => {
              const isSelected = stationFilter === st.id;
              const Icon = st.icon;
              return (
                <button
                  key={st.id}
                  onClick={() => setStationFilter(st.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-1 ring-white/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                  title={`Filter dashboard to ${st.label}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                    isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {st.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Status Indicators & Asset Counters */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#042013] border border-[#146c43]/60 rounded-xl text-xs font-mono">
            <span className="text-slate-300 font-bold">Fleet:</span>
            <span className="text-white font-extrabold">{assetSummary.totalActive} Total</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-extrabold">🟢 {assetSummary.onlineCount} Online</span>
            <span className="text-slate-500">/</span>
            <span className="text-rose-400 font-bold">🔴 {assetSummary.offlineCount} Offline</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              {assetSummary.activeAlerts} Alerts
            </span>
          </div>

          <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 bg-[#042013] border border-[#146c43]/60 rounded-xl text-[11px] font-mono font-extrabold text-emerald-300">
            PostgreSQL rvmpg
          </span>
        </div>

      </div>

    </header>
  );
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, Palette, Sun, Moon, Leaf, Check, 
  LogOut, Menu, Building2, ChevronDown, Search, X, MapPin, Cpu
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
  const [clientSearch, setClientSearch] = useState('');

  const clientMenuRef = useRef(null);
  const themeMenuRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close menus when clicking outside or pressing Escape (Resolves QA Issue 1.c: dropdown not closing on blur)
  useEffect(() => {
    function handleClickOutside(event) {
      if (clientMenuRef.current && !clientMenuRef.current.contains(event.target)) {
        setShowClientMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setShowClientMenu(false);
        setShowThemeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
  const isCorporateSubUser = currentUser?.roleId === 'corporate_sub_user' || currentUser?.isSubUser === true;
  const isCorporatePortal = isClientAdmin || isCorporateSubUser;

  const [clients, setClients] = useState([
    { 
      id: 'ALL', 
      label: 'ISP Environmental Master (All Sites)', 
      rawName: 'ISP Environmental Master',
      badge: 'Master Nationwide', 
      address: 'Nationwide Public Network',
      domain: 'isprvm.binishaqsoft.com',
      machineCount: 12
    }
  ]);

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.clients)) {
          setClients(data.clients.map(c => ({
            id: c.id,
            label: c.name || c.label,
            rawName: c.rawName || (c.name || '').replace('Client: ', ''),
            badge: c.badge || 'Corporate Client',
            address: c.address || 'Corporate Facility',
            domain: c.domain || '',
            machineCount: c.machineCount || 0
          })));
        }
      })
      .catch(() => {});
  }, []);

  const selectedClientObj = clients.find(c => c.id === selectedClientId) || clients[0];

  // Client filtering in Mega Menu
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(c => 
      (c.label || '').toLowerCase().includes(q) ||
      (c.badge || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.domain || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  return (
    <header className="sticky top-0 z-40 t-bg-header backdrop-blur-xl border-b t-border transition-colors duration-300 shadow-md">
      
      {/* Top Primary Navigation Bar */}
      <div className="px-3 sm:px-6 py-2 flex items-center justify-between gap-3">

        {/* Left: Brand Logo & Title + Scope Mega Menu */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile Hamburger Drawer Toggle Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-1.5 rounded-xl t-bg-sec hover:t-bg-hover t-text-primary border t-border transition-all"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5 text-emerald-500" />
          </button>

          {/* Prominent ISP Brand Identity (Resolves QA Issue 1.a) */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 p-1.5 bg-white rounded-xl shadow-md border-2 border-emerald-500/35 ring-2 ring-emerald-500/10 shrink-0 flex items-center justify-center overflow-hidden transition-transform hover:scale-105">
              <img 
                src={currentUser?.organization?.logoUrl || ispLogo} 
                alt={currentUser?.organization?.name || "ISP Logo"} 
                className="w-full h-full object-contain" 
              />
            </div>

            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-black t-text-primary tracking-tight whitespace-nowrap">
                {currentUser?.organization?.dashboardTitle || currentUser?.organization?.name || 'ISP SMART RECYCLING'}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 -mt-0.5 hidden sm:inline tracking-wider">
                NATIONWIDE MASTER PORTAL
              </span>
            </div>
            {/* Note: MASTER DEV badge deliberately removed from left title bar as per QA Issue 1.b */}
          </div>

          <div className="h-5 w-[1px] bg-slate-300 dark:bg-white/20 hidden sm:block mx-1" />

          {/* Multi-Client Organization Mega Menu Dropdown (Resolves QA Issue 1.c) */}
          {isCorporatePortal ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <Building2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              <span className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400 font-extrabold hidden md:inline">
                {isCorporateSubUser ? 'Assigned Kiosks:' : 'Organization Fleet:'}
              </span>
              <span className="text-xs font-black mono t-text-primary">
                {Array.isArray(currentUser?.assignedMachines) && currentUser.assignedMachines.length > 0
                  ? currentUser.assignedMachines.join(', ')
                  : 'All Assigned Fleet'}
              </span>
            </div>
          ) : (
            <div ref={clientMenuRef} className="relative">
              <button
                onClick={() => setShowClientMenu(!showClientMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                  selectedClientId === 'ALL'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25'
                    : 'bg-blue-500/15 border-blue-500/40 text-blue-800 dark:text-blue-300 hover:bg-blue-500/25'
                }`}
                title="Switch Enterprise Client Scope"
                aria-expanded={showClientMenu}
              >
                <Building2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                <div className="text-left flex items-center gap-1.5">
                  <span className="text-[10px] uppercase t-text-muted font-bold hidden md:inline">SCOPE:</span>
                  <span className="text-xs font-extrabold truncate max-w-[140px] sm:max-w-[200px] t-text-primary">
                    {selectedClientObj.label.replace('Client: ', '')}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 t-text-muted transition-transform duration-200 ${showClientMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Menu Dropdown with Multi-Columns & Instant Search */}
              {showClientMenu && (
                <div className="absolute left-0 mt-2 w-[720px] max-w-[94vw] lg:w-[820px] glass-panel border t-border rounded-2xl shadow-2xl p-3.5 z-50 animate-fade-in backdrop-blur-2xl">
                  
                  {/* Top Bar of Mega Menu */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b t-border">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-black uppercase tracking-wider t-text-primary">
                        Select Enterprise Client Scope
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        {filteredClients.length} Organizations
                      </span>
                    </div>

                    {/* Fast Filter Input */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input 
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Search client, venue, city..."
                        className="w-full pl-8 pr-7 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      {clientSearch && (
                        <button 
                          onClick={() => setClientSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Multi-Column Grid Display (Resolves QA Issue 1.c) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto p-1 mt-2.5">
                    {filteredClients.map(c => {
                      const isSelected = selectedClientId === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedClientId(c.id);
                            setShowClientMenu(false);
                            window.dispatchEvent(new CustomEvent('rvm_switch_client', { detail: c.id }));
                          }}
                          className={`w-full text-left p-3 rounded-xl transition-all flex flex-col justify-between group relative border ${
                            isSelected
                              ? 'bg-emerald-500/15 border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                              : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-500/60 shadow-xs'
                          }`}
                        >
                          {/* Top row: Name & Selection Indicator */}
                          <div className="flex items-start justify-between gap-1.5">
                            <span className={`text-xs tracking-tight line-clamp-1 ${
                              isSelected 
                                ? 'font-black text-emerald-950 dark:text-emerald-200' 
                                : 'font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-900 dark:group-hover:text-emerald-100'
                            }`}>
                              {c.label.replace('Client: ', '')}
                            </span>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          {/* Sub address / Venue value: Clearly visible bold black text in normal state (Resolves QA Issue 1.c) */}
                          <div className="mt-1 flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className={`font-bold line-clamp-1 ${
                              isSelected
                                ? 'text-black dark:text-white'
                                : 'text-black dark:text-slate-200 group-hover:text-black dark:group-hover:text-white'
                            }`}>
                              {c.address || c.badge}
                            </span>
                          </div>

                          {/* Bottom metadata tags */}
                          <div className="mt-2 pt-1.5 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-900 dark:group-hover:bg-emerald-900 dark:group-hover:text-emerald-100'
                            }`}>
                              {c.badge}
                            </span>
                            {c.machineCount > 0 && (
                              <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                                <Cpu className="w-2.5 h-2.5" />
                                {c.machineCount} {c.machineCount === 1 ? 'Kiosk' : 'Kiosks'}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {filteredClients.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No client organizations match "<span className="font-bold">{clientSearch}</span>"
                    </div>
                  )}

                  {/* Mega Menu Footer Note */}
                  <div className="mt-2.5 pt-2 border-t t-border flex items-center justify-between text-[11px] t-text-muted">
                    <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">Esc</kbd> or click outside to close</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Multi-Tenant Scoped Isolation Active</span>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Clock, Palette, User Info & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 t-bg-sec border t-border rounded-xl text-xs mono t-text-primary shadow-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold">{timeStr}</span>
          </div>

          {/* Theme Selector Dropdown (Resolves QA Issue 1.d: Color switching) */}
          <div ref={themeMenuRef} className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 t-bg-sec hover:t-bg-hover border t-border rounded-xl text-xs font-bold t-text-primary transition-all shadow-xs flex items-center gap-1.5"
              title="Theme Color Palette"
              aria-expanded={showThemeMenu}
            >
              <Palette className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span className="hidden xl:inline text-xs font-semibold">{currentThemeObj.label.split(' ')[0]}</span>
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-80 glass-panel border t-border rounded-2xl shadow-2xl p-3 z-50 animate-fade-in backdrop-blur-2xl">
                <div className="flex items-center justify-between pb-2 border-b t-border">
                  <div className="text-xs font-black uppercase tracking-wider t-text-primary">
                    Master Color Themes
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Instant Switch
                  </span>
                </div>

                <div className="space-y-1.5 mt-2 max-h-[360px] overflow-y-auto">
                  {themesList.map((t) => {
                    const isSelected = theme === t.id;
                    const IconComponent = t.icon;
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
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-bold border-2 border-emerald-500/50 shadow-xs'
                            : 't-text-primary hover:t-bg-hover hover:border border border-transparent'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full mt-0.5 shrink-0 ${t.color} border border-black/20 shadow-xs flex items-center justify-center`}>
                          <IconComponent className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between font-extrabold">
                            <span className={isSelected ? 'text-emerald-950 dark:text-emerald-200' : 't-text-primary'}>
                              {t.label}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                          </div>
                          <p className={`text-[11px] leading-snug mt-0.5 ${isSelected ? 'text-emerald-800 dark:text-emerald-300 font-medium' : 't-text-muted font-normal'}`}>
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

          {/* User Profile & Logout (Resolves QA Issue 1.b: Remove immutable word) */}
          {currentUser && (
            <div className="flex items-center gap-2.5 pl-2 border-l t-border">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-extrabold t-text-primary leading-tight flex items-center justify-end gap-1">
                  {currentUser.fullName || currentUser.username}
                </span>
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {isMasterDev ? 'SUPER ADMIN' : (currentUser.roleName || currentUser.roleId || 'OPERATOR')}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl border border-rose-500/25 transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Database, Trophy, Cpu, Users, Recycle, 
  MessageSquare, AlertTriangle, Shield, Settings, ChevronRight, ChevronDown, 
  HardDrive, ArrowRightLeft, Lock, Leaf, X, Layers, Table, Tv, Smartphone,
  Scale, Gauge, FileText, Activity, Sliders, Server, ClipboardList
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, health, currentUser, isMobileOpen, setIsMobileOpen }) {
  const isMasterDev = currentUser?.username === 'onenet' || !currentUser || currentUser?.roleId === 'superadmin';
  const isPostgres = health?.databaseType === 'postgres';

  // Category collapse states - open all operational by default
  const [collapsedCategories, setCollapsedCategories] = useState({
    fleet: false,
    analytics: false,
    userImpact: false,
    reporting: false,
    admin: false,
    developer: true, // Collapsed by default to keep clean
  });

  const toggleCategory = (key) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTabClick = (id) => {
    setActiveTab(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const categories = [
    {
      id: 'fleet',
      title: 'Operations & Fleet Management',
      icon: '📊',
      badge: 'Core',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, desc: 'High-level throughput & fleet health' },
        { id: 'device_fleet', label: 'Device Fleet', icon: Cpu, badge: 'RVM + Pico', desc: 'All Devices | RVM Fleet | PicoDrop' },
        { id: 'advertisements', label: 'Ad Signage Manager', icon: Tv, desc: 'RVM screens & PicoDrop media bars' },
      ]
    },
    {
      id: 'analytics',
      title: 'Collection & Weight Analytics',
      icon: '⚖️',
      items: [
        { id: 'throughput', label: 'Material Throughput', icon: Recycle, desc: 'RVM unit counts + PicoDrop load scale weight' },
        { id: 'capacities', label: 'Load & Bin Capacities', icon: Scale, desc: 'RVM bins & PicoDrop paper weight thresholds' },
      ]
    },
    {
      id: 'reporting',
      title: 'Reporting & Analytics Hub',
      icon: '📈',
      badge: '4 Audits',
      items: [
        { id: 'reporting_hub', label: 'Executive Reporting Hub', icon: FileText, desc: 'Tare calibration, ESG, efficiency & financial audits' },
      ]
    },
    {
      id: 'userImpact',
      title: 'User & Impact',
      icon: '👥',
      items: [
        { id: 'mobile_users', label: 'App Users', icon: Smartphone, desc: 'Citizen profiles & balances' },
        { id: 'esg_impact', label: 'ESG & Carbon Impact', icon: Leaf, desc: 'CO₂ offsets & diverted volume' },
        { id: 'rewards_leaderboard', label: 'Rewards & Leaderboard', icon: Trophy, desc: 'Point rules, rankings & redemptions' },
      ]
    },
    {
      id: 'admin',
      title: 'System Administration',
      icon: '🛡️',
      items: [
        { id: 'security', label: 'Access Control (RBAC)', icon: Lock, desc: 'Operator, maintenance & dev roles' },
        { id: 'db_switcher', label: 'Database Connections', icon: ArrowRightLeft, desc: 'PostgreSQL & MongoDB Atlas host routing' },
        { id: 'db_backup', label: 'Backups & Recovery', icon: HardDrive, desc: 'Scheduled DB snapshots & restore points' },
      ]
    },
    {
      id: 'developer',
      title: 'Developer & Database Inspection',
      icon: '🛠️',
      badge: 'Tables',
      items: [
        { id: 'dev_transactions', label: 'Transaction Logs', icon: Activity, desc: 'Raw unit deposits & paper weight events' },
        { id: 'dev_hardware', label: 'Hardware Devices', icon: Server, desc: 'Machine UUIDs, types (rvm vs picodrop)' },
        { id: 'dev_users', label: 'User Records', icon: Users, desc: 'Direct user records inspection' },
        { id: 'dev_configs', label: 'Device Configurations', icon: Sliders, desc: 'Tare weights, load cell calibration & optics' },
        { id: 'dev_storage', label: 'App Storage (NoSQL)', icon: Database, desc: 'MongoDB Atlas collections browser' },
      ]
    }
  ];

  const renderContent = () => (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="space-y-4 overflow-y-auto pr-1">
        
        {/* Brand System Header */}
        <div className="px-3 pt-1 pb-2 border-b t-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📁</span>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                EcoDrop Operations Center
              </span>
            </div>
          </div>
          <p className="text-[10px] t-text-muted mt-1 leading-snug">
            Intake Telemetry: <strong className="text-cyan-300">RVM</strong> (Count) + <strong className="text-emerald-300">PicoDrop</strong> (Count + Weight)
          </p>
        </div>

        {/* 5 Categories Navigation */}
        <div className="space-y-3">
          {categories.map(cat => {
            const isCollapsed = collapsedCategories[cat.id];
            // Check if any child item is active
            const hasActiveChild = cat.items.some(item => activeTab === item.id);

            return (
              <div key={cat.id} className="rounded-xl border t-border overflow-hidden bg-surface-sec/40 transition-all">
                {/* Category Header Accordion Button */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${
                    hasActiveChild 
                      ? 'bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20' 
                      : 't-text-muted hover:t-text-primary hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {cat.badge && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {cat.badge}
                      </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? '-rotate-90 text-gray-500' : 'rotate-0 text-emerald-400'}`} />
                  </div>
                </button>

                {/* Sub Items List */}
                {!isCollapsed && (
                  <nav className="p-1.5 space-y-0.5 animate-fade-in">
                    {cat.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabClick(item.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                            isActive 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm font-black' 
                              : 't-text-secondary hover:t-text-primary hover:t-bg-hover'
                          }`}
                          title={item.desc}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 't-text-muted'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {isActive ? (
                            <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            item.badge && (
                              <span className="text-[9px] font-mono font-normal px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0">
                                {item.badge}
                              </span>
                            )
                          )}
                        </button>
                      );
                    })}
                  </nav>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Footer Info */}
      <div className="p-3 t-bg-sec border t-border rounded-xl space-y-1 text-center mt-auto shrink-0">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-black t-text-primary">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>EcoDrop Unified Hub</span>
        </div>
        <div className="text-[9px] t-text-muted truncate font-mono">
          RVM: Single Hopper • PicoDrop: 3 Inputs
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-72 t-bg-surface border-r t-border flex-col shrink-0 p-3.5 space-y-4 transition-colors duration-300">
        {renderContent()}
      </aside>

      {/* Mobile Slide-Over Overlay Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          ></div>

          <div className="relative z-10 w-80 max-w-[85vw] t-bg-surface h-full border-r t-border p-4 flex flex-col justify-between overflow-y-auto shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b t-border pb-3 mb-3">
              <span className="font-extrabold text-sm text-emerald-400">EcoDrop Menu</span>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-xl t-bg-sec hover:t-bg-hover t-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
}

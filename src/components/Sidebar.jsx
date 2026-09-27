import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Database, Trophy, Cpu, Users, Recycle, 
  MessageSquare, AlertTriangle, Shield, Settings, ChevronRight, ChevronDown, 
  HardDrive, ArrowRightLeft, Lock, Leaf, X, Layers, Table, Tv, 
  Smartphone, FileText, Building2, BarChart3, Folder, FolderOpen
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, health, currentUser, isMobileOpen, setIsMobileOpen }) {
  const isMasterDev = currentUser?.username === 'onenet';
  const isPostgres = health?.databaseType === 'postgres';

  // Collapse MongoDB tables by default when connected to PostgreSQL
  const [isMongoCollapsed, setIsMongoCollapsed] = useState(isPostgres);

  useEffect(() => {
    if (isPostgres) {
      setIsMongoCollapsed(true);
    } else {
      setIsMongoCollapsed(false);
    }
  }, [isPostgres]);

  const getCollectionCount = (colName) => {
    if (!health?.collections) return null;
    const col = health.collections.find(c => c.name === colName);
    return col ? col.count : 0;
  };

  const isClientAdmin = currentUser?.roleId === 'client_admin';
  const isCorporateSubUser = currentUser?.roleId === 'corporate_sub_user' || currentUser?.isSubUser === true;

  const isSuperAdmin = !isClientAdmin && !isCorporateSubUser && (
    isMasterDev || 
    currentUser?.roleId === 'super_admin' || 
    currentUser?.roleId === 'superadmin' || 
    currentUser?.username === 'onenet' || 
    currentUser?.username === 'bilalaaqueel' || 
    currentUser?.isSuperAdmin === true
  );

  // Resolve user modules strictly. If not superadmin, compute allowed modules from user/role
  const getUserAllowedModules = () => {
    if (isClientAdmin) {
      return ['overview', 'sub_users', 'security', 'reporting_hub', 'esg_impact', 'analytics', 'machines', 'advertisements'];
    }
    if (isCorporateSubUser) {
      return ['overview', 'reporting_hub', 'esg_impact', 'analytics', 'machines'];
    }
    if (isSuperAdmin) return ['*'];
    if (Array.isArray(currentUser?.modules) && currentUser.modules.length > 0) {
      return currentUser.modules;
    }
    const roleId = currentUser?.roleId;
    if (roleId === 'fleet_operator') return ['overview', 'machines'];
    if (roleId === 'analytics_analyst') return ['overview', 'analytics', 'reporting_hub', 'esg_impact'];
    if (roleId === 'support_specialist') return ['overview', 'mobile_users', 'feedbacks', 'users'];
    return ['overview'];
  };

  const allowedModules = getUserAllowedModules();

  const isModuleAllowed = (moduleId) => {
    if (isClientAdmin) {
      if (['enterprise_clients', 'db_switcher', 'db_backup'].includes(moduleId)) return false;
      if (moduleId.startsWith('col_')) return false;
    }
    if (isCorporateSubUser) {
      if (['enterprise_clients', 'sub_users', 'security', 'db_switcher', 'db_backup', 'mobile_users', 'advertisements'].includes(moduleId)) return false;
      if (moduleId.startsWith('col_')) return false;
    }
    if (isSuperAdmin) return true;
    if (moduleId.startsWith('col_')) return false;
    if (allowedModules.includes('*') || allowedModules.includes('all')) return true;
    return allowedModules.includes(moduleId);
  };

  // Structured Accordion Main Menus (Yellow Rows) and Submenus
  const MENU_SECTIONS = [
    {
      id: 'CORE',
      label: 'CORE',
      icon: LayoutDashboard,
      badge: 'Operations',
      items: [
        { id: 'overview', orderNo: 1, label: 'Executive Overview', icon: LayoutDashboard },
        { id: 'machines', orderNo: 2, label: 'Machine Health & Operations', icon: Cpu },
        ...(!isCorporateSubUser ? [
          { id: 'advertisements', orderNo: 3, label: 'Digital Signage', icon: Tv }
        ] : [])
      ]
    },
    {
      id: 'COMMUNITY',
      label: 'COMMUNITY & USERS',
      icon: Users,
      badge: 'Public & Mobile',
      items: [
        ...(!isClientAdmin && !isCorporateSubUser ? [
          { id: 'mobile_users', orderNo: 4, label: 'Recycler Community', icon: Users }
        ] : []),
        { id: 'analytics', orderNo: 5, label: 'Rewards & Leaderboards', icon: Trophy }
      ]
    },
    {
      id: 'COMMERCIAL',
      label: 'COMMERCIAL & ESG',
      icon: Building2,
      badge: 'Enterprise & CSR',
      items: [
        ...(!isClientAdmin && !isCorporateSubUser ? [
          { id: 'enterprise_clients', orderNo: 6, label: 'Enterprise Accounts', icon: Building2 }
        ] : []),
        { id: 'esg_impact', orderNo: 7, label: 'ESG & Carbon Impact', icon: Leaf }
      ]
    },
    {
      id: 'INTELLIGENCE',
      label: 'INTELLIGENCE',
      icon: BarChart3,
      badge: 'Data & Reports',
      items: [
        { id: 'reporting_hub', orderNo: 8, label: 'Analytics & Reports', icon: BarChart3 }
      ]
    },
    {
      id: 'SYSTEM',
      label: 'SYSTEM & ADMIN',
      icon: Settings,
      badge: 'System Governance',
      items: [
        ...((isSuperAdmin || isClientAdmin || isMasterDev || isModuleAllowed('security') || isModuleAllowed('sub_users')) ? [
          { 
            id: isClientAdmin ? 'sub_users' : 'security', 
            orderNo: 9, 
            label: 'Access & Security (RBAC)', 
            icon: Lock 
          }
        ] : []),
        ...(!isClientAdmin && !isCorporateSubUser && (isMasterDev || isModuleAllowed('db_switcher')) ? [
          { id: 'db_switcher', orderNo: 10, label: 'Database Connections', icon: ArrowRightLeft }
        ] : []),
        ...(!isClientAdmin && !isCorporateSubUser && (isMasterDev || isModuleAllowed('db_backup')) ? [
          { id: 'db_backup', orderNo: 11, label: 'Backups & Restore', icon: HardDrive }
        ] : [])
      ]
    }
  ];

  // Helper to determine parent section for any tab
  const getSectionForTab = (tabId) => {
    for (const sec of MENU_SECTIONS) {
      if (sec.items.some(item => item.id === tabId)) {
        return sec.id;
      }
    }
    return 'CORE';
  };

  // State: STRICTLY ONLY ONE MENU IS OPEN AT A TIME
  const [openSectionId, setOpenSectionId] = useState(() => getSectionForTab(activeTab));

  // Auto-sync parent menu when activeTab changes
  useEffect(() => {
    const parentSection = getSectionForTab(activeTab);
    if (parentSection && parentSection !== openSectionId) {
      setOpenSectionId(parentSection);
    }
  }, [activeTab]);

  // Accordion Toggle: only one menu open at a time
  const handleToggleSection = (sectionId) => {
    setOpenSectionId(prev => (prev === sectionId ? null : sectionId));
  };

  // Primary PostgreSQL Relational Tables
  const postgresTables = [
    { id: 'col_recycling_sessions', name: 'recycling_sessions', label: 'recycling_sessions', icon: Recycle },
    { id: 'col_machines', name: 'machines', label: 'Smart Recycling Machines', icon: Cpu },
    { id: 'col_users', name: 'users', label: 'users', icon: Users },
    { id: 'col_machine_configs', name: 'machine_configs', label: 'Smart Recycling Configurations', icon: Settings },
    { id: 'col_redemptions', name: 'redemptions', label: 'redemptions', icon: Trophy },
  ];

  // MongoDB Legacy / rvmapp Collections
  const defaultMongoCollections = [
    { id: 'col_recyclingsessions', name: 'recyclingsessions', label: 'recyclingsessions (JSONB)', icon: Recycle },
    { id: 'col_userprofile', name: 'userprofile', label: 'userprofile', icon: Users },
    { id: 'col_feedbacks', name: 'feedbacks', label: 'feedbacks', icon: MessageSquare },
    { id: 'col_binfullnotifications', name: 'binfullnotifications', label: 'binfullnotifications', icon: AlertTriangle },
    { id: 'col_redemptions', name: 'redemptions', label: 'redemptions', icon: Trophy },
    ...(isMasterDev ? [
      { id: 'col_adminaccounts', name: 'adminaccounts', label: 'adminaccounts', icon: Shield }
    ] : [])
  ];

  const pgTableNames = new Set(postgresTables.map(t => t.name));
  const mongoNamesInDefault = new Set(defaultMongoCollections.map(c => c.name));

  const dynamicCollections = (health?.collections || [])
    .filter(c => !pgTableNames.has(c.name) && !mongoNamesInDefault.has(c.name))
    .map(c => ({
      id: `col_${c.name}`,
      name: c.name,
      label: c.name,
      icon: Database
    }));

  const mongoCollectionItems = [...defaultMongoCollections, ...dynamicCollections];

  // Raw relational database tables & raw collections are strictly restricted to Super Admins
  const allowedPgTables = isSuperAdmin ? postgresTables.filter(item => isModuleAllowed(item.id)) : [];
  const allowedMongoCollections = isSuperAdmin ? mongoCollectionItems.filter(item => isModuleAllowed(item.id)) : [];

  const handleTabClick = (id) => {
    setActiveTab(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const renderContent = () => (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="space-y-4">
        

        {/* Database Status Pill for Super Admin */}
        {isSuperAdmin && (
          <div className="px-3 flex items-center justify-between text-xs font-extrabold t-text-muted">
            <span className="text-[10px] uppercase tracking-wider">Storage Engine:</span>
            <span className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase mono ${
              isPostgres 
                ? 'bg-sky-50 text-[#0369a1] border border-sky-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30' 
                : 'bg-emerald-50 text-[#0b5d3b] border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
            }`}>
              {isPostgres ? '🐘 PostgreSQL' : '🍃 MongoDB'}
            </span>
          </div>
        )}

        {/* Main Menu Accordion Navigation (Yellow Main Menus & Single Open Behavior) */}
        <div className="space-y-2">
          {MENU_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(item => isModuleAllowed(item.id));
            if (visibleItems.length === 0) return null;

            const isOpen = openSectionId === section.id;
            const hasActiveChild = visibleItems.some(item => item.id === activeTab);
            const SectionIcon = section.icon;

            return (
              <div 
                key={section.id} 
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'border-amber-400/50 dark:border-amber-400/40 bg-amber-500/5 shadow-xs' 
                    : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:border-amber-400/30'
                }`}
              >
                {/* Yellow Main Menu Header (Resolves User instruction: Yellow Main Menu with Accordion) */}
                <button
                  type="button"
                  onClick={() => handleToggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all ${
                    isOpen 
                      ? 'bg-amber-400/20 dark:bg-amber-400/15 border-b border-amber-400/30 text-amber-950 dark:text-amber-200 font-black' 
                      : 'text-slate-800 dark:text-slate-200 hover:bg-amber-400/10 hover:text-amber-900 dark:hover:text-amber-100 font-extrabold'
                  }`}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Yellow/Amber highlighted icon badge representing Main Menu */}
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                      isOpen
                        ? 'bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950'
                        : 'bg-amber-400/20 text-amber-700 dark:text-amber-300'
                    }`}>
                      <SectionIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>

                    <span className="text-xs uppercase tracking-wider truncate">
                      {section.label}
                    </span>

                    {/* Active child dot indicator */}
                    {hasActiveChild && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" title="Active selection inside" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                      isOpen
                        ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {visibleItems.length}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-amber-600 dark:text-amber-400' : 'text-slate-400'
                    }`} />
                  </div>
                </button>

                {/* Submenu Items (Expanded ONLY when this menu is active) */}
                {isOpen && (
                  <div className="p-1.5 space-y-1 animate-fade-in bg-white/60 dark:bg-slate-900/60">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabClick(item.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left group ${
                            isActive 
                              ? 'bg-emerald-600/15 text-emerald-900 dark:text-emerald-200 border border-emerald-600/40 border-l-4 border-l-[#0b5d3b] shadow-xs' 
                              : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={`text-[10px] font-mono px-1 rounded shrink-0 font-bold ${
                              isActive
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'
                            }`}>
                              {item.orderNo}
                            </span>
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'text-[#0b5d3b] dark:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-600'
                            }`} />
                            <span className="truncate leading-snug">{item.label}</span>
                          </div>

                          {isActive && (
                            <ChevronRight className="w-3.5 h-3.5 text-[#0b5d3b] dark:text-emerald-400 shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* PostgreSQL Relational Tables (Only shown to Super Admins when in Postgres Mode) */}
        {isSuperAdmin && isPostgres && allowedPgTables.length > 0 && (
          <div className="pt-2 border-t t-border">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[#0b5d3b] dark:text-cyan-400 mb-2 px-2 text-left">
              <span className="flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5" />
                Raw Database Tables
              </span>
              <span className="text-emerald-800 dark:text-cyan-300 mono bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 font-bold text-[10px]">
                {allowedPgTables.length} Tables
              </span>
            </div>

            <nav className="space-y-1">
              {allowedPgTables.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const count = getCollectionCount(item.name);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left ${
                      isActive 
                        ? 'bg-emerald-600/15 text-emerald-800 dark:text-cyan-300 border border-emerald-600/40 border-l-4 border-l-[#0b5d3b] shadow-xs' 
                        : 't-text-secondary hover:t-text-primary hover:t-bg-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-left min-w-0 flex-1">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#0b5d3b] dark:text-cyan-300' : 't-text-muted'}`} />
                      <span className="truncate mono text-left leading-snug">{item.label}</span>
                    </div>
                    {count !== null && (
                      <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-md mono shrink-0 ml-1.5 ${
                        isActive ? 'bg-[#0b5d3b] text-white' : 't-bg-sec t-text-muted'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* MongoDB rvmapp Tables Browser (Only shown to Super Admins) */}
        {isSuperAdmin && allowedMongoCollections.length > 0 && (
          <div className="pt-2 border-t t-border">
            <button
              onClick={() => setIsMongoCollapsed(!isMongoCollapsed)}
              className="w-full flex items-center justify-between text-xs font-extrabold uppercase tracking-wider t-text-muted mb-2 px-2 py-1 rounded-lg hover:t-bg-hover transition-colors group text-left"
              title={isMongoCollapsed ? "Click to expand MongoDB collections" : "Click to collapse MongoDB collections"}
            >
              <span className="flex items-center gap-1.5 text-left">
                <Layers className="w-3.5 h-3.5 text-[#0b5d3b] dark:text-emerald-400 shrink-0" />
                <span className="text-left text-xs">MongoDB Collections</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-emerald-800 dark:text-emerald-400 mono text-[10px] bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                  {allowedMongoCollections.length}
                </span>
                <ChevronDown className={`w-3 h-3 t-text-muted transition-transform duration-200 ${isMongoCollapsed ? '-rotate-90' : 'rotate-0'}`} />
              </div>
            </button>

            {!isMongoCollapsed && (
              <nav className="space-y-1 max-h-48 overflow-y-auto mt-1 animate-fade-in">
                {allowedMongoCollections.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const count = getCollectionCount(item.name);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all text-left ${
                        isActive 
                          ? 'bg-emerald-600/15 text-emerald-800 dark:text-cyan-400 border border-emerald-600/40 border-l-4 border-l-[#0b5d3b] shadow-xs' 
                          : 't-text-secondary hover:t-text-primary hover:t-bg-hover'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-left min-w-0 flex-1">
                        <Icon className={`w-3 h-3 shrink-0 ${isActive ? 'text-[#0b5d3b] dark:text-cyan-400' : 't-text-muted'}`} />
                        <span className="truncate text-xs text-left leading-snug">{item.label}</span>
                      </div>
                      {count !== null && (
                        <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-md mono shrink-0 ml-1.5 ${
                          isActive ? 'bg-[#0b5d3b] text-white' : 't-bg-sec t-text-muted'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="p-3 t-bg-sec border t-border rounded-xl space-y-0.5 text-left mt-auto">
        <div className="text-[11px] font-bold t-text-primary">ISP Smart Recycling Hub</div>
        <div className="text-[10px] t-text-muted truncate">
          {isSuperAdmin ? (
            isPostgres ? `PG Host: ${health?.serverHost || '127.0.0.1:5432'}` : (isMasterDev ? `MongoDB Atlas (${health?.serverHost || 'cluster0.ktted0m.mongodb.net'})` : `Database: ${health?.database || 'ONS-RVM'}`)
          ) : (
            <span className="text-emerald-500 font-semibold">Active &amp; Operational</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 t-bg-surface border-r t-border flex-col shrink-0 p-3.5 space-y-4 transition-colors duration-300 overflow-y-auto">
        {renderContent()}
      </aside>

      {/* Mobile Slide-Over Overlay Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          ></div>

          <div className="relative z-10 w-72 max-w-[85vw] t-bg-surface h-full border-r t-border p-4 flex flex-col justify-between overflow-y-auto shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b t-border pb-3 mb-2">
              <span className="font-extrabold text-sm text-emerald-400">Smart Recycling Navigation</span>
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

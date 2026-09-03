import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Database, Trophy, Cpu, Users, Recycle, 
  MessageSquare, AlertTriangle, Shield, Settings, ChevronRight, ChevronDown, HardDrive, ArrowRightLeft, Lock, Leaf, X, Layers, Table, Tv, Smartphone, FileText
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

  const isSuperAdmin = isMasterDev || currentUser?.roleId === 'super_admin';
  const userModules = currentUser?.modules;

  const isModuleAllowed = (moduleId) => {
    if (isSuperAdmin) return true;
    if (!userModules || !Array.isArray(userModules) || userModules.length === 0) return true;
    if (userModules.includes('*') || userModules.includes('all')) return true;
    const cleanId = moduleId.replace('col_', '');
    return userModules.includes(moduleId) || userModules.includes(cleanId) || userModules.includes(`col_${cleanId}`);
  };

  const navItems = [
    { id: 'overview', label: 'System Overview', icon: LayoutDashboard },
    { id: 'reporting_hub', label: 'Reporting & Analytics Hub', icon: FileText },
    { id: 'mobile_users', label: 'Mobile App Citizens', icon: Smartphone },
    { id: 'esg_impact', label: 'ESG Carbon Impact', icon: Leaf },
    { id: 'analytics', label: 'Analytics & Leaderboard', icon: Trophy },
    { id: 'machines', label: 'RVM Fleet Health', icon: Cpu },
    { id: 'advertisements', label: 'Ad Video Signage', icon: Tv },
    ...((isMasterDev || isModuleAllowed('security')) ? [
      { id: 'security', label: 'User & Security RBAC', icon: Lock },
    ] : []),
    ...((isMasterDev || isModuleAllowed('db_switcher')) ? [
      { id: 'db_switcher', label: 'DB Connection Manager', icon: ArrowRightLeft },
    ] : []),
    ...((isMasterDev || isModuleAllowed('db_backup')) ? [
      { id: 'db_backup', label: 'DB Backup & Restore', icon: HardDrive },
    ] : [])
  ];

  // Primary PostgreSQL Relational Tables
  const postgresTables = [
    { id: 'col_recycling_sessions', name: 'recycling_sessions', label: 'recycling_sessions', icon: Recycle },
    { id: 'col_machines', name: 'machines', label: 'RVMs', icon: Cpu },
    { id: 'col_users', name: 'users', label: 'users', icon: Users },
    { id: 'col_machine_configs', name: 'machine_configs', label: 'RVM Configurations', icon: Settings },
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

  const handleTabClick = (id) => {
    setActiveTab(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const renderContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-6">
        
        {/* Main Section */}
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider t-text-muted mb-2 px-3 flex items-center justify-between">
            <span>Core Dashboards</span>
            <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase mono ${
              isPostgres ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isPostgres ? '🐘 PostgreSQL' : '🍃 MongoDB'}
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.filter(item => isModuleAllowed(item.id)).map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md' 
                      : 't-text-secondary hover:t-text-primary hover:t-bg-hover'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 't-text-muted'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* PostgreSQL Relational Tables (Shown when in Postgres Mode) */}
        {isPostgres && (
          <div>
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 mb-2 px-3">
              <span className="flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5" />
                PostgreSQL Relational Tables
              </span>
              <span className="text-cyan-300 mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {postgresTables.filter(item => isModuleAllowed(item.id) || isModuleAllowed(item.name)).length} Tables
              </span>
            </div>

            <nav className="space-y-1">
              {postgresTables.filter(item => isModuleAllowed(item.id) || isModuleAllowed(item.name)).map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const count = getCollectionCount(item.name);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md' 
                        : 't-text-secondary hover:t-text-primary hover:t-bg-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-300' : 't-text-muted'}`} />
                      <span className="truncate mono">{item.label}</span>
                    </div>
                    {count !== null && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md mono ${
                        isActive ? 'bg-cyan-500/40 text-white' : 't-bg-sec t-text-muted'
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

        {/* MongoDB rvmapp Tables Browser (Collapsible in Postgres Mode) */}
        <div>
          <button
            onClick={() => setIsMongoCollapsed(!isMongoCollapsed)}
            className="w-full flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider t-text-muted mb-2 px-3 py-1.5 rounded-lg hover:t-bg-hover transition-colors group"
            title={isMongoCollapsed ? "Click to expand MongoDB rvmapp collections to sync data" : "Click to collapse MongoDB collections"}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>MongoDB rvmapp Collections</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 mono text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {mongoCollectionItems.filter(item => isModuleAllowed(item.id) || isModuleAllowed(item.name)).length}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 t-text-muted transition-transform duration-200 ${isMongoCollapsed ? '-rotate-90' : 'rotate-0'}`} />
            </div>
          </button>

          {isPostgres && isMongoCollapsed && (
            <div 
              onClick={() => setIsMongoCollapsed(false)}
              className="mx-3 p-2.5 text-[10px] font-semibold t-bg-sec border border-amber-500/30 rounded-xl text-amber-300 flex items-center justify-between cursor-pointer hover:bg-amber-500/10 transition-all"
            >
              <span>📁 Collapsed (Connected to PostgreSQL)</span>
              <span className="text-[9px] underline font-bold">Sync Data</span>
            </div>
          )}

          {!isMongoCollapsed && (
            <nav className="space-y-1 max-h-60 lg:max-h-none overflow-y-auto mt-1 animate-fade-in">
              {mongoCollectionItems.filter(item => isModuleAllowed(item.id) || isModuleAllowed(item.name)).map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const count = getCollectionCount(item.name);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-md' 
                        : 't-text-secondary hover:t-text-primary hover:t-bg-hover'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 't-text-muted'}`} />
                      <span className="truncate text-[11px]">{item.label}</span>
                    </div>
                    {count !== null && (
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md mono ${
                        isActive ? 'bg-cyan-500/30 text-cyan-300' : 't-bg-sec t-text-muted'
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

      </div>

      {/* Footer Info */}
      <div className="p-3 t-bg-sec border t-border rounded-xl space-y-0.5 text-center mt-auto">
        <div className="text-[11px] font-bold t-text-primary">ISP RVM Master Hub</div>
        <div className="text-[10px] t-text-muted truncate">
          {isPostgres ? `PG Host: ${health?.serverHost || '127.0.0.1:5432'}` : (isMasterDev ? `MongoDB Atlas (${health?.serverHost || 'cluster0.ktted0m.mongodb.net'})` : `Database: ${health?.database || 'ONS-RVM'}`)}
        </div>
      </div>
    </div>
  );


  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 t-bg-surface border-r t-border flex-col shrink-0 p-4 space-y-6 transition-colors duration-300">
        {renderContent()}
      </aside>

      {/* Mobile Slide-Over Overlay Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          ></div>

          <div className="relative z-10 w-72 max-w-[85vw] t-bg-surface h-full border-r t-border p-5 flex flex-col justify-between overflow-y-auto shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b t-border pb-3 mb-2">
              <span className="font-extrabold text-sm text-emerald-400">RVM Navigation</span>
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

import React from 'react';
import { 
  LayoutDashboard, Database, Trophy, Cpu, Users, Recycle, 
  MessageSquare, AlertTriangle, Shield, Settings, ChevronRight, HardDrive, ArrowRightLeft, Lock, Leaf, X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, health, currentUser, isMobileOpen, setIsMobileOpen }) {
  const isMasterDev = currentUser?.username === 'onenet';
  
  const getCollectionCount = (colName) => {
    if (!health?.collections) return null;
    const col = health.collections.find(c => c.name === colName);
    return col ? col.count : 0;
  };

  const navItems = [
    { id: 'overview', label: 'System Overview', icon: LayoutDashboard },
    { id: 'esg_impact', label: 'ESG Carbon Impact', icon: Leaf },
    { id: 'analytics', label: 'Analytics & Leaderboard', icon: Trophy },
    { id: 'machines', label: 'RVM Fleet Health', icon: Cpu },
    ...(isMasterDev ? [
      { id: 'security', label: 'User & Security RBAC', icon: Lock },
      { id: 'db_switcher', label: 'DB Connection Manager', icon: ArrowRightLeft },
      { id: 'db_backup', label: 'DB Backup & Restore', icon: HardDrive },
    ] : [])
  ];

  const defaultCollections = [
    { id: 'col_recyclingsessions', name: 'recyclingsessions', label: 'Recycling Sessions', icon: Recycle },
    { id: 'col_userprofile', name: 'userprofile', label: 'User Profiles', icon: Users },
    { id: 'col_feedbacks', name: 'feedbacks', label: 'User Feedbacks', icon: MessageSquare },
    { id: 'col_binfullnotifications', name: 'binfullnotifications', label: 'Bin Full Alerts', icon: AlertTriangle },
    { id: 'col_redemptions', name: 'redemptions', label: 'Redemptions', icon: Trophy },
    ...(isMasterDev ? [
      { id: 'col_adminaccounts', name: 'adminaccounts', label: 'Admin Accounts', icon: Shield }
    ] : [])
  ];

  const collectionNamesInDefault = new Set(defaultCollections.map(c => c.name));
  const dynamicCollections = (health?.collections || []).filter(c => !collectionNamesInDefault.has(c.name)).map(c => ({
    id: `col_${c.name}`,
    name: c.name,
    label: c.name,
    icon: Database
  }));

  const collectionItems = [...defaultCollections, ...dynamicCollections];

  const handleTabClick = (id) => {
    setActiveTab(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const renderContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-6">
        
        {/* Main Section */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider t-text-muted mb-2 px-3">
            Core Dashboards
          </div>

          <nav className="space-y-1">
            {navItems.map(item => {
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

        {/* MongoDB Tables Browser */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider t-text-muted mb-2 px-3">
            <span>MongoDB Tables</span>
            <span className="text-emerald-400 mono">{health?.collectionsCount || 0}</span>
          </div>

          <nav className="space-y-1 max-h-60 lg:max-h-none overflow-y-auto">
            {collectionItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const count = getCollectionCount(item.name);
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-md' 
                      : 't-text-secondary hover:t-text-primary hover:t-bg-hover'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 't-text-muted'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {count !== null && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md mono ${
                      isActive ? 'bg-cyan-500/30 text-cyan-300' : 't-bg-sec t-text-muted'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Footer Info */}
      <div className="p-3 t-bg-sec border t-border rounded-xl space-y-0.5 text-center mt-auto">
        <div className="text-[11px] font-bold t-text-primary">ISP RVM Master Hub</div>
        <div className="text-[10px] t-text-muted">
          {isMasterDev ? `MongoDB Atlas (${health?.serverHost || 'cluster0.ktted0m.mongodb.net'})` : `Database: ${health?.database || 'ONS-RVM'}`}
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

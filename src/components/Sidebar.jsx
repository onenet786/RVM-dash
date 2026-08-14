import React from 'react';
import { 
  LayoutDashboard, Database, Trophy, Cpu, Users, Recycle, 
  MessageSquare, AlertTriangle, Shield, Settings, ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, health }) {
  
  const getCollectionCount = (colName) => {
    if (!health?.collections) return null;
    const col = health.collections.find(c => c.name === colName);
    return col ? col.count : 0;
  };

  const navItems = [
    { id: 'overview', label: 'System Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics & Leaderboard', icon: Trophy },
    { id: 'machines', label: 'RVM Fleet Health', icon: Cpu },
  ];

  const defaultCollections = [
    { id: 'col_recyclingsessions', name: 'recyclingsessions', label: 'Recycling Sessions', icon: Recycle },
    { id: 'col_userprofile', name: 'userprofile', label: 'User Profiles', icon: Users },
    { id: 'col_feedbacks', name: 'feedbacks', label: 'User Feedbacks', icon: MessageSquare },
    { id: 'col_binfullnotifications', name: 'binfullnotifications', label: 'Bin Full Alerts', icon: AlertTriangle },
    { id: 'col_redemptions', name: 'redemptions', label: 'Redemptions', icon: Trophy },
    { id: 'col_adminaccounts', name: 'adminaccounts', label: 'Admin Accounts', icon: Shield },
  ];

  // Merge any additional collections from MongoDB
  const collectionNamesInDefault = new Set(defaultCollections.map(c => c.name));
  const dynamicCollections = (health?.collections || []).filter(c => !collectionNamesInDefault.has(c.name)).map(c => ({
    id: `col_${c.name}`,
    name: c.name,
    label: c.name,
    icon: Database
  }));

  const collectionItems = [...defaultCollections, ...dynamicCollections];


  return (
    <aside className="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col justify-between shrink-0 p-4 space-y-6">
      
      <div className="space-y-6">
        
        {/* Main Section */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-3">
            Core Dashboards
          </div>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* MongoDB Tables / Collections Browser */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-3">
            <span>MongoDB Tables</span>
            <span className="text-emerald-400 mono">{health?.collectionsCount || 0}</span>
          </div>

          <nav className="space-y-1">
            {collectionItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const count = getCollectionCount(item.name);
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive 
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {count !== null && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md mono ${
                      isActive ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-900 text-slate-400'
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
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1 text-center">
        <div className="text-[11px] font-bold text-slate-300">ISP RVM Master Hub</div>
        <div className="text-[10px] text-slate-500">MongoDB Atlas Connection Live</div>
      </div>

    </aside>
  );
}

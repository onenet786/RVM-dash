import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OverviewTab from './components/OverviewTab';
import AnalyticsTab from './components/AnalyticsTab';
import MachineHealthTab from './components/MachineHealthTab';
import MachineConfigsTab from './components/MachineConfigsTab';
import AdvertisementsTab from './components/AdvertisementsTab';
import RvmManagementTab from './components/RvmManagementTab';
import DbBackupTab from './components/DbBackupTab';
import DbSwitcherTab from './components/DbSwitcherTab';
import SecurityTab from './components/SecurityTab';
import EnvironmentalImpactTab from './components/EnvironmentalImpactTab';
import MobileUsersTab from './components/MobileUsersTab';
import DataTable from './components/DataTable';
import LoginModal from './components/LoginModal';
import ReportingHubTab from './components/ReportingHubTab';
import { Leaf } from 'lucide-react';
import ispLogo from './assets/isp_logo.png';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      const explicit = localStorage.getItem('rvm_theme_explicit');
      if (explicit) {
        return localStorage.getItem('rvm_theme') || 'isp-eco';
      }
    } catch (e) {}
    return 'isp-eco';
  });

  // Authentication State (sessionStorage: demands re-login on browser window restart)

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('rvm_auth_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {}
    return null; // Force login modal on fresh browser session
  });

  const [isLoggedOut, setIsLoggedOut] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    const isDark = ['cyber-dark', 'ocean-dark', 'neon-violet'].includes(theme);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('rvm_theme', theme);
  }, [theme]);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setHealth(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch health status', err);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // Auto-refresh health every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    setIsLoggedOut(false);
    setActiveTab('overview');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    sessionStorage.removeItem('rvm_auth_token');
    sessionStorage.removeItem('rvm_auth_user');
    localStorage.removeItem('rvm_auth_token');
    localStorage.removeItem('rvm_auth_user');
    setCurrentUser(null);
    setIsLoggedOut(true);
  };


  const renderContent = () => {
    const isMasterDev = currentUser?.username === 'onenet';
    const isSuperAdmin = isMasterDev || currentUser?.roleId === 'super_admin';
    const userModules = currentUser?.modules || [];
    const isAllowedTab = (tab) => {
      if (isSuperAdmin) return true;
      if (userModules.includes('*') || userModules.includes('all')) return true;
      const clean = tab.replace('col_', '');
      return userModules.includes(tab) || userModules.includes(clean) || userModules.includes(`col_${clean}`);
    };

    // Block unauthorized users from master administrative tabs
    if (!isSuperAdmin && ['security', 'db_switcher', 'db_backup', 'col_adminaccounts'].includes(activeTab) && !isAllowedTab(activeTab)) {
      return <OverviewTab currentUser={currentUser} />;
    }

    if (activeTab === 'overview') {
      return <OverviewTab currentUser={currentUser} />;
    }

    if (activeTab === 'reporting_hub') {
      return <ReportingHubTab />;
    }

    if (activeTab === 'mobile_users' || activeTab === 'col_users') {
      return <MobileUsersTab />;
    }

    if (activeTab === 'esg_impact') {
      return <EnvironmentalImpactTab />;
    }
    if (activeTab === 'analytics') {
      return <AnalyticsTab />;
    }

    if (activeTab === 'machines') {
      return <MachineHealthTab currentUser={currentUser} />;
    }
    if (activeTab === 'advertisements') {
      return <AdvertisementsTab />;
    }
    if (activeTab === 'col_machines') {
      return <RvmManagementTab currentUser={currentUser} />;
    }
    if (activeTab === 'col_machine_configs' || activeTab === 'machine_configs') {
      return <MachineConfigsTab currentUser={currentUser} />;
    }
    if (activeTab === 'security' && (isSuperAdmin || isAllowedTab('security'))) {
      return <SecurityTab />;
    }
    if (activeTab === 'db_switcher' && (isSuperAdmin || isAllowedTab('db_switcher'))) {
      return <DbSwitcherTab onRefreshHealth={fetchHealth} />;
    }
    if (activeTab === 'db_backup' && (isSuperAdmin || isAllowedTab('db_backup'))) {
      return <DbBackupTab onRefreshHealth={fetchHealth} />;
    }


    if (activeTab.startsWith('col_')) {
      const colName = activeTab.replace('col_', '');
      const displayNames = {
        recyclingsessions: 'Recycling Sessions Table',
        recycling_sessions: 'Recycling Sessions (Relational Table)',
        userprofile: 'Registered User Profiles Table',
        feedbacks: 'User Feedbacks Log Table',
        binfullnotifications: 'Bin Full Alerts Table',
        redemptions: 'Redemptions Table',
        adminaccounts: 'Admin Accounts Table',
        settings: 'System Settings Table',
        machine_configs: 'Machine Reward Points Config (machine_configs) Table',
        machines: 'Registered Fleet Machines Table'
      };

      return (
        <DataTable 
          key={colName} 
          collectionName={colName} 
          displayName={displayNames[colName] || `${colName} Table`} 
        />
      );
    }

    return <OverviewTab />;
  };

  return (
    <div className="min-h-screen t-bg-app flex flex-col font-sans transition-colors duration-300">
      
      {/* Login Portal Modal overlay when logged out */}
      {(isLoggedOut || !currentUser) && (
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Top Navbar */}
      <Navbar 
        health={health} 
        onRefresh={fetchHealth} 
        theme={theme}
        setTheme={setTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          health={health} 
          currentUser={currentUser}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Main Content Area: Media Queries Full-Width Adaptive Utilization */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 xl:p-7 2xl:p-8 3xl:px-10 transition-all duration-200 relative">
          
          {/* Ambient Floating Top Gate Crest - Background Watermark Style */}
          <div className="fixed inset-0 pointer-events-none select-none z-0 flex items-center justify-center overflow-hidden">
            <div className="opacity-[0.03] dark:opacity-[0.045] flex flex-col items-center justify-center transform -rotate-12 scale-110 sm:scale-125 lg:scale-140 transition-transform duration-1000">
              <img src={ispLogo} alt="ISP Watermark" className="w-[420px] h-[420px] object-contain filter grayscale" />
              <div className="mt-3 text-center font-black tracking-[0.35em] uppercase text-slate-900 dark:text-emerald-100 text-base border-t-2 border-b-2 border-current py-1.5 px-8">
                ISP Eco-Vanguard Secure Gateway
              </div>
              <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-slate-700 dark:text-emerald-300 mt-1">
                Official RVM Telemetry & Regulatory Compliance Network
              </div>
            </div>
          </div>

          {/* Floating Top Gate Badge - Watermark Style */}
          <div className="sticky top-0 z-30 flex justify-center pointer-events-none select-none -mt-1 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/75 dark:bg-[#051c14]/75 backdrop-blur-xl border border-emerald-600/25 dark:border-emerald-400/25 shadow-[0_4px_20px_-2px_rgba(11,93,59,0.12)] text-[#0b5d3b] dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-widest pointer-events-auto transition-all duration-300 hover:scale-[1.02] hover:bg-white/90 dark:hover:bg-[#051c14]/90">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Leaf className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300 animate-leaf-sway" />
              <span>Eco-Vanguard Secure Gateway</span>
              <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-mono font-bold tracking-normal">
                ISO 14064
              </span>
            </div>
          </div>

          <div className="dashboard-viewport space-y-6 relative z-10">
            {renderContent()}
          </div>
        </main>

      </div>

    </div>
  );
}

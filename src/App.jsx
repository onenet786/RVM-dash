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
    } catch (e) { }
    return 'isp-eco';
  });

  // Authentication State (sessionStorage: demands re-login on browser window restart)

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('rvm_auth_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) { }
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
    } catch (e) { }
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
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 xl:p-7 2xl:p-8 3xl:px-10 transition-all duration-200">
          <div className="dashboard-viewport space-y-6">
            {renderContent()}
          </div>
        </main>

      </div>

    </div>
  );
}

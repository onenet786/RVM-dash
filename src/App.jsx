import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OverviewTab from './components/OverviewTab';
import AnalyticsTab from './components/AnalyticsTab';
import MachineHealthTab from './components/MachineHealthTab';
import MachineConfigsTab from './components/MachineConfigsTab';
import RvmManagementTab from './components/RvmManagementTab';
import DbBackupTab from './components/DbBackupTab';
import DbSwitcherTab from './components/DbSwitcherTab';
import SecurityTab from './components/SecurityTab';
import EnvironmentalImpactTab from './components/EnvironmentalImpactTab';
import DataTable from './components/DataTable';
import LoginModal from './components/LoginModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('rvm_theme') || 'cyber-dark');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

    // Block non-onenet users from master administrative tabs
    if (!isMasterDev && ['security', 'db_switcher', 'db_backup', 'col_adminaccounts'].includes(activeTab)) {
      return <OverviewTab currentUser={currentUser} />;
    }

    if (activeTab === 'overview') {
      return <OverviewTab currentUser={currentUser} />;
    }

    if (activeTab === 'esg_impact') {
      return <EnvironmentalImpactTab />;
    }
    if (activeTab === 'analytics') {
      return <AnalyticsTab />;
    }

    if (activeTab === 'machines') {
      return <MachineHealthTab />;
    }
    if (activeTab === 'col_machines') {
      return <RvmManagementTab />;
    }
    if (activeTab === 'col_machine_configs' || activeTab === 'machine_configs') {
      return <MachineConfigsTab />;
    }
    if (activeTab === 'security' && isMasterDev) {
      return <SecurityTab />;
    }
    if (activeTab === 'db_switcher' && isMasterDev) {
      return <DbSwitcherTab onRefreshHealth={fetchHealth} />;
    }
    if (activeTab === 'db_backup' && isMasterDev) {
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderContent()}
          </div>
        </main>

      </div>

    </div>
  );
}

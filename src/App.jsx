import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OverviewTab from './components/OverviewTab';
import AnalyticsTab from './components/AnalyticsTab';
import MachineHealthTab from './components/MachineHealthTab';
import DbBackupTab from './components/DbBackupTab';
import DataTable from './components/DataTable';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('rvm_theme') || 'cyber-dark');

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

  const renderContent = () => {
    if (activeTab === 'overview') {
      return <OverviewTab />;
    }
    if (activeTab === 'analytics') {
      return <AnalyticsTab />;
    }
    if (activeTab === 'machines') {
      return <MachineHealthTab />;
    }
    if (activeTab === 'db_backup') {
      return <DbBackupTab onRefreshHealth={fetchHealth} />;
    }

    if (activeTab.startsWith('col_')) {
      const colName = activeTab.replace('col_', '');
      const displayNames = {
        recyclingsessions: 'Recycling Sessions Table',
        userprofile: 'Registered User Profiles Table',
        feedbacks: 'User Feedbacks Log Table',
        binfullnotifications: 'Bin Full Alerts Table',
        redemptions: 'Redemptions Table',
        adminaccounts: 'Admin Accounts Table',
        settings: 'System Settings Table'
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
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      
      {/* Top Navbar */}
      <Navbar 
        health={health} 
        onRefresh={fetchHealth} 
        theme={theme}
        setTheme={setTheme}
      />

      <div className="flex flex-1 overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          health={health} 
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>

      </div>
    </div>
  );
}

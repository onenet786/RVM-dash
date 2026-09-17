import React, { useState, useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OverviewTab from './components/OverviewTab';
import LoginModal from './components/LoginModal';
import FlyingLeavesWatermark from './components/FlyingLeavesWatermark';

// Code-split dynamic tabs for instant initial web & mobile bundle load
const AnalyticsTab = lazy(() => import('./components/AnalyticsTab'));
const MachineHealthTab = lazy(() => import('./components/MachineHealthTab'));
const MachineConfigsTab = lazy(() => import('./components/MachineConfigsTab'));
const AdvertisementsTab = lazy(() => import('./components/AdvertisementsTab'));
const RvmManagementTab = lazy(() => import('./components/RvmManagementTab'));
const DbBackupTab = lazy(() => import('./components/DbBackupTab'));
const DbSwitcherTab = lazy(() => import('./components/DbSwitcherTab'));
const SecurityTab = lazy(() => import('./components/SecurityTab'));
const EnvironmentalImpactTab = lazy(() => import('./components/EnvironmentalImpactTab'));
const MobileUsersTab = lazy(() => import('./components/MobileUsersTab'));
const DataTable = lazy(() => import('./components/DataTable'));
const ReportingHubTab = lazy(() => import('./components/ReportingHubTab'));

// Secure Fetch Interceptor: Automatically attaches Authorization: Bearer <token> to /api/ requests
if (typeof window !== 'undefined' && !window._rvm_fetch_intercepted) {
  window._rvm_fetch_intercepted = true;
  const originalFetch = window.fetch;
  window.fetch = async function (resource, init = {}) {
    try {
      const url = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
      if (url.includes('/api/')) {
        const token = sessionStorage.getItem('rvm_auth_token') || localStorage.getItem('rvm_auth_token');
        if (token) {
          init = init || {};
          init.headers = init.headers || {};
          if (init.headers instanceof Headers) {
            if (!init.headers.has('Authorization')) {
              init.headers.set('Authorization', `Bearer ${token}`);
            }
          } else if (Array.isArray(init.headers)) {
            const hasAuth = init.headers.some(([k]) => k.toLowerCase() === 'authorization');
            if (!hasAuth) {
              init.headers.push(['Authorization', `Bearer ${token}`]);
            }
          } else {
            if (!init.headers['Authorization'] && !init.headers['authorization']) {
              init.headers['Authorization'] = `Bearer ${token}`;
            }
          }
        }
      }
    } catch (e) { }

    const response = await originalFetch.call(this, resource, init);
    if (response && response.status === 401) {
      const url = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
      if (url.includes('/api/') && !url.includes('/api/auth/login')) {
        // Expired or invalid token: purge and trigger clean login prompt
        sessionStorage.removeItem('rvm_auth_token');
        sessionStorage.removeItem('rvm_auth_user');
        localStorage.removeItem('rvm_auth_token');
        localStorage.removeItem('rvm_auth_user');
        window.dispatchEvent(new CustomEvent('rvm_auth_expired'));
      }
    }
    return response;
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [stationFilter, setStationFilter] = useState('ALL'); // 'ALL' | 'RVM_OLD' | 'RVM_NEW' | 'PECODROP'
  const [selectedClientId, setSelectedClientId] = useState('ALL'); // 'ALL' | 'ISP_MASTER' | 'UCP_LAHORE' | 'METRO_MALL'
  const [theme, setTheme] = useState(() => {
    try {
      const explicit = localStorage.getItem('rvm_theme_explicit');
      if (explicit) {
        return localStorage.getItem('rvm_theme') || 'isp-eco';
      }
    } catch (e) { }
    return 'isp-eco';
  });

  // Authentication State (sessionStorage with persistent rememberMe fallback)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('rvm_auth_user') || localStorage.getItem('rvm_auth_user');
      const savedToken = sessionStorage.getItem('rvm_auth_token') || localStorage.getItem('rvm_auth_token');
      if (savedUser && savedToken) {
        sessionStorage.setItem('rvm_auth_user', savedUser);
        sessionStorage.setItem('rvm_auth_token', savedToken);
        return JSON.parse(savedUser);
      }
    } catch (e) { }
    return null; // Demands login modal when unauthenticated
  });

  const [isLoggedOut, setIsLoggedOut] = useState(false);

  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      setIsLoggedOut(true);
    };
    const handleSwitchClient = (e) => {
      if (e.detail) setSelectedClientId(e.detail);
    };
    const handleSwitchStation = (e) => {
      if (e.detail) setStationFilter(e.detail);
    };

    window.addEventListener('rvm_auth_expired', handleAuthExpired);
    window.addEventListener('rvm_switch_client', handleSwitchClient);
    window.addEventListener('rvm_switch_station', handleSwitchStation);
    return () => {
      window.removeEventListener('rvm_auth_expired', handleAuthExpired);
      window.removeEventListener('rvm_switch_client', handleSwitchClient);
      window.removeEventListener('rvm_switch_station', handleSwitchStation);
    };
  }, []);

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
    if (user?.roleId === 'client_admin' && user?.assignedClient) {
      setSelectedClientId(user.assignedClient);
    }
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
    const isSuperAdmin = isMasterDev || 
      currentUser?.roleId === 'super_admin' || 
      currentUser?.roleId === 'superadmin' || 
      currentUser?.username === 'onenet' || 
      currentUser?.username === 'bilalaaqueel' || 
      currentUser?.isSuperAdmin === true;

    const isClientAdmin = currentUser?.roleId === 'client_admin';

    const getUserAllowedModules = () => {
      if (isSuperAdmin) return ['*'];
      if (isClientAdmin) return ['overview', 'analytics', 'esg_impact', 'reporting_hub', 'advertisements', 'machines'];
      if (Array.isArray(currentUser?.modules) && currentUser.modules.length > 0) {
        return currentUser.modules;
      }
      const roleId = currentUser?.roleId;
      if (roleId === 'pecodrop_technician') return ['overview', 'machines', 'reporting_hub'];
      if (roleId === 'rvm_field_technician') return ['overview', 'machines', 'reporting_hub'];
      if (roleId === 'fleet_operator') return ['overview', 'machines'];
      if (roleId === 'analytics_analyst') return ['overview', 'analytics', 'reporting_hub', 'esg_impact'];
      if (roleId === 'support_specialist') return ['overview', 'mobile_users', 'feedbacks', 'users'];
      return ['overview'];
    };

    const userModules = getUserAllowedModules();

    const isAllowedTab = (tab) => {
      if (isClientAdmin && ['db_switcher', 'db_backup', 'security'].includes(tab)) return false;
      if (isClientAdmin && tab.startsWith('col_')) return false;
      if (isSuperAdmin) return true;
      if (userModules.includes('*') || userModules.includes('all')) return true;
      const clean = tab.replace('col_', '');
      return userModules.includes(tab) || userModules.includes(clean) || userModules.includes(`col_${clean}`);
    };

    // Block unauthorized users from any un-allowed tabs
    if (!isAllowedTab(activeTab)) {
      return <OverviewTab currentUser={currentUser} stationFilter={stationFilter} selectedClientId={selectedClientId} />;
    }

    if (activeTab === 'overview') {
      return <OverviewTab currentUser={currentUser} stationFilter={stationFilter} selectedClientId={selectedClientId} />;
    }

    if (activeTab === 'reporting_hub') {
      return <ReportingHubTab stationFilter={stationFilter} selectedClientId={selectedClientId} currentUser={currentUser} />;
    }

    if (activeTab === 'mobile_users' || activeTab === 'col_users') {
      return <MobileUsersTab stationFilter={stationFilter} selectedClientId={selectedClientId} currentUser={currentUser} />;
    }

    if (activeTab === 'esg_impact') {
      return <EnvironmentalImpactTab stationFilter={stationFilter} selectedClientId={selectedClientId} currentUser={currentUser} />;
    }
    if (activeTab === 'analytics') {
      return <AnalyticsTab stationFilter={stationFilter} selectedClientId={selectedClientId} currentUser={currentUser} />;
    }

    if (activeTab === 'machines') {
      return <MachineHealthTab currentUser={currentUser} stationFilter={stationFilter} selectedClientId={selectedClientId} />;
    }
    if (activeTab === 'advertisements') {
      return <AdvertisementsTab stationFilter={stationFilter} selectedClientId={selectedClientId} currentUser={currentUser} />;
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

    return <OverviewTab currentUser={currentUser} stationFilter={stationFilter} selectedClientId={selectedClientId} />;
  };

  if (isLoggedOut || !currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen t-bg-app flex flex-col font-sans transition-colors duration-300 relative">

      {/* Dynamic Flying Leaf Watermark across all Dashboard pages */}
      <FlyingLeavesWatermark isWatermark={true} count={28} />

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
        stationFilter={stationFilter}
        setStationFilter={setStationFilter}
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
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
            <Suspense fallback={
              <div className="space-y-6 animate-pulse p-4">
                <div className="h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center px-6">
                  <div className="h-6 w-48 bg-emerald-500/20 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="h-36 rounded-2xl bg-emerald-500/10 border border-emerald-500/15" />
                  <div className="h-36 rounded-2xl bg-emerald-500/10 border border-emerald-500/15" />
                  <div className="h-36 rounded-2xl bg-emerald-500/10 border border-emerald-500/15" />
                </div>
                <div className="h-80 rounded-2xl bg-emerald-500/10 border border-emerald-500/15" />
              </div>
            }>
              {renderContent()}
            </Suspense>
          </div>
        </main>

      </div>

    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserCheck, Smartphone, Wallet, Gift, Recycle, RefreshCw, Search, 
  Download, Clock, Phone, Mail, ChevronRight, X, Shield, Sparkles, Trophy, 
  Check, Copy, Ticket, Star, Building2, CheckCircle2
} from 'lucide-react';

export default function MobileUsersTab() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineNow: 0,
    totalPoints: 0,
    totalBottles: 0,
    totalCups: 0,
    totalTetra: 0,
    totalPaper: 0,
    totalGlass: 0,
    totalRedeemed: 0,
    totalRedemptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState('all'); // 'all', 'public', 'corporate', 'top'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [userRedemptions, setUserRedemptions] = useState([]);
  const [activeModalTab, setActiveModalTab] = useState('recycling'); // 'recycling' | 'redemptions'
  const [copiedVoucher, setCopiedVoucher] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const fetchMobileUsers = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const res = await fetch('/api/analytics/mobile-users');
      if (res.ok) {
        const data = await res.json();
        const allUsers = data.users || [];
        setUsers(allUsers);

        const calculatedRedemptions = allUsers.reduce((sum, u) => sum + (u.redemptionsCount || 0), 0);

        if (data.stats) {
          setStats({
            ...data.stats,
            totalUsers: allUsers.length,
            onlineNow: allUsers.filter(u => u.isOnline).length,
            totalRedemptions: data.stats.totalRedemptions || calculatedRedemptions
          });
        }
        if (isManual) showToast('Recycler directory refreshed with live telemetry');
      }
    } catch (err) {
      console.error('Failed to fetch recyclers directory:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMobileUsers();
    const interval = setInterval(() => fetchMobileUsers(false), 20000); // Polling every 20s
    return () => clearInterval(interval);
  }, []);

  const openUserHistory = async (user) => {
    setSelectedUser(user);
    setUserHistory([]);
    setUserRedemptions([]);
    setActiveModalTab('recycling');
    setLoadingHistory(true);
    try {
      const queryParams = new URLSearchParams();
      if (user.id) queryParams.append('userId', user.id);
      if (user.mobile && user.mobile !== '-') queryParams.append('mobile', user.mobile);
      if (user.username) queryParams.append('username', user.username);
      if (user.email) queryParams.append('email', user.email);
      const target = user.id || user.mobile || user.username;
      const res = await fetch(`/api/getrecycle/${encodeURIComponent(target)}?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUserHistory(data.history || []);
        setUserRedemptions(data.redemptions || []);
      }
    } catch (e) {
      console.error('Failed to fetch user history & redemptions:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    try {
      navigator.clipboard?.writeText(text);
      setCopiedVoucher(text);
      showToast(`Voucher code copied: ${text}`);
      setTimeout(() => setCopiedVoucher(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Category identification
  const isCorporateUser = (u) => {
    return (u.userType && u.userType.toUpperCase() === 'ENTERPRISE') || Boolean(u.orgId || u.orgName);
  };

  const isTopChampion = (u) => {
    const totalItems = (u.bottles || 0) + (u.cups || 0) + (u.tetra || 0) + (u.paper || 0);
    return (u.points || 0) >= 5000 || totalItems >= 500;
  };

  // Counts for Segment Buttons
  const segmentCounts = useMemo(() => {
    const pub = users.filter(u => !isCorporateUser(u)).length;
    const corp = users.filter(u => isCorporateUser(u)).length;
    const top = users.filter(u => isTopChampion(u)).length;
    return { all: users.length, public: pub, corporate: corp, top };
  }, [users]);

  // Active in last 30 days
  const activeThisMonth = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return users.filter(u => {
      if (u.isOnline) return true;
      if (u.lastActive && new Date(u.lastActive).getTime() > thirtyDaysAgo) return true;
      if (u.sessions > 0) return true;
      return false;
    });
  }, [users]);

  const activeRate = useMemo(() => {
    if (!users.length) return 0;
    return Math.min(100, Math.round((activeThisMonth.length / users.length) * 1000) / 10);
  }, [users, activeThisMonth]);

  // Total Lifetime Items
  const totalLifetimeItems = useMemo(() => {
    return (stats.totalBottles || 0) + (stats.totalCups || 0) + (stats.totalTetra || 0) + (stats.totalPaper || 0) + (stats.totalGlass || 0);
  }, [stats]);

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Segment filter
      if (activeSegment === 'public' && isCorporateUser(u)) return false;
      if (activeSegment === 'corporate' && !isCorporateUser(u)) return false;
      if (activeSegment === 'top' && !isTopChampion(u)) return false;

      // Query filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.mobile && u.mobile.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.id && String(u.id).toLowerCase().includes(q)) ||
        (u.nic && u.nic.toLowerCase().includes(q)) ||
        (u.orgName && u.orgName.toLowerCase().includes(q))
      );
    });
  }, [users, activeSegment, searchQuery]);

  // Export CSV
  const exportCSV = () => {
    if (!users.length) {
      showToast('No user records available to export');
      return;
    }

    const headers = [
      'User ID',
      'Full Name',
      'Username',
      'Account Type',
      'Organization',
      'Mobile Number',
      'Email',
      'Points Balance',
      'Redeemed Points',
      'Total Items',
      'Bottles (PET)',
      'Cans (ALU)',
      'Cartons (UBC)',
      'Paper (kg)',
      'Total Sessions',
      'Online Status',
      'Last Active'
    ];

    const rows = filteredUsers.map(u => [
      `"${u.id || ''}"`,
      `"${(u.fullName || '').replace(/"/g, '""')}"`,
      `"${(u.username || '').replace(/"/g, '""')}"`,
      `"${isCorporateUser(u) ? 'Corporate' : 'Public Kiosk'}"`,
      `"${(u.orgName || 'Public Citizen').replace(/"/g, '""')}"`,
      `"${u.mobile || ''}"`,
      `"${u.email || ''}"`,
      u.points || 0,
      u.totalRedeemedPoints || u.redeemedPoints || 0,
      (u.bottles || 0) + (u.cups || 0) + (u.tetra || 0) + (u.paper || 0),
      u.bottles || 0,
      u.cups || 0,
      u.tetra || 0,
      u.paper || 0,
      u.sessions || 0,
      u.isOnline ? 'Online' : 'Offline',
      `"${u.lastActive ? new Date(u.lastActive).toISOString() : 'Never'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ISP_Recyclers_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredUsers.length} recyclers to CSV successfully`);
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Never';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Panel */}
      <div className="glass-panel p-6 rounded-3xl border t-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shrink-0">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                User Management Portal
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Mobile Ecosystem Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight t-text-primary mt-1">
              Recyclers &amp; App Community
            </h1>
            <p className="text-xs t-text-secondary mt-0.5">
              Live directory of verified citizen recyclers, corporate campus members, wallet point balances, and machine activity.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => fetchMobileUsers(true)}
            disabled={refreshing || loading}
            className="px-3.5 py-2 t-bg-sec hover:t-bg-hover t-text-primary border t-border rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Directory</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-600/25 transition-all active:scale-95"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Recycler List</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Row (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Registered Recyclers */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Registered Recyclers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold t-text-primary tracking-tight mono">
              {stats.totalUsers}
            </span>
            <span className="text-xs font-semibold t-text-muted">accounts</span>
          </div>
          <div className="mt-2.5 text-xs t-text-muted flex items-center justify-between flex-wrap gap-1">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">{segmentCounts.public} Public (RVM)</span>
            <span className="text-slate-400">•</span>
            <span className="text-purple-700 dark:text-purple-400 font-medium">{segmentCounts.corporate} Corporate</span>
          </div>
        </div>

        {/* Card 2: Active This Month */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Active This Month</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold t-text-primary tracking-tight mono">
              {activeThisMonth.length}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {activeRate}% Rate
            </span>
          </div>
          <div className="mt-2.5 text-xs t-text-muted">
            {stats.onlineNow} users currently logged in
          </div>
        </div>

        {/* Card 3: Unclaimed Points */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Unclaimed Points</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mono">
              {(stats.totalPoints || 0).toLocaleString()}
            </span>
            <span className="text-xs font-semibold t-text-muted">pts</span>
          </div>
          <div className="mt-2.5 text-xs flex items-center justify-between flex-wrap gap-1">
            <span className="t-text-muted">Voucher Value:</span>
            <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 mono">
              PKR {Math.round((stats.totalPoints || 0) * 0.20).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 4: Vouchers Cashed In */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Vouchers Cashed In</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight mono">
              {(stats.totalRedeemed || 0).toLocaleString()}
            </span>
            <span className="text-xs font-semibold t-text-muted">pts</span>
          </div>
          <div className="mt-2.5 text-xs t-text-muted">
            Reconciled across {stats.totalRedemptions || 0} vouchers
          </div>
        </div>

        {/* Card 5: Lifetime Items */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Total Items Deposited</span>
            <div className="w-8 h-8 rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-400 flex items-center justify-center">
              <Recycle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight mono">
              {totalLifetimeItems.toLocaleString()}
            </span>
            <span className="text-xs font-semibold t-text-muted">items</span>
          </div>
          <div className="mt-2.5 text-xs t-text-muted truncate">
            {(stats.totalBottles || 0).toLocaleString()} PET • {(stats.totalCups || 0).toLocaleString()} Cans • {(stats.totalTetra || 0) + (stats.totalPaper || 0)} Other
          </div>
        </div>

      </div>

      {/* Filter & Search Strip */}
      <div className="glass-panel p-4 rounded-2xl border t-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 t-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, masked mobile number, email, or user ID..."
            className="w-full pl-10 pr-10 py-2.5 t-bg-sec border t-border text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 t-text-primary placeholder:t-text-muted font-medium transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 t-text-muted hover:t-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Category Segment Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
          <button
            onClick={() => { setActiveSegment('all'); showToast('Showing: All Recyclers'); }}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSegment === 'all'
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 't-text-secondary hover:t-text-primary t-bg-sec border t-border'
            }`}
          >
            All Recyclers ({segmentCounts.all})
          </button>

          <button
            onClick={() => { setActiveSegment('public'); showToast('Showing: Smart RVM Public Recyclers'); }}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSegment === 'public'
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 't-text-secondary hover:t-text-primary t-bg-sec border t-border'
            }`}
          >
            Smart RVM Public ({segmentCounts.public})
          </button>

          <button
            onClick={() => { setActiveSegment('corporate'); showToast('Showing: PecoDrop Corporate Recyclers'); }}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSegment === 'corporate'
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 't-text-secondary hover:t-text-primary t-bg-sec border t-border'
            }`}
          >
            PecoDrop Corporate ({segmentCounts.corporate})
          </button>

          <button
            onClick={() => { setActiveSegment('top'); showToast('Showing: Top Green Champions'); }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
              activeSegment === 'top'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 't-text-secondary hover:t-text-primary t-bg-sec border t-border'
            }`}
          >
            <span>Top Green Champions</span>
            <Star className="w-3 h-3 fill-current text-amber-300" />
            <span>({segmentCounts.top})</span>
          </button>
        </div>

      </div>

      {/* Recyclers Directory Table */}
      <div className="glass-panel rounded-3xl border t-border overflow-hidden">
        <div className="p-5 border-b t-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold t-text-primary flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Registered Recyclers Directory
            </h2>
            <p className="text-xs t-text-secondary mt-0.5">
              Live points balances, lifetime deposits, verified channel, and machine activity
            </p>
          </div>
          <span className="text-xs font-semibold t-text-secondary t-bg-sec border t-border px-3 py-1 rounded-lg">
            Showing {filteredUsers.length} of {users.length} Verified Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="t-bg-sec/70 border-b t-border t-text-muted uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User Profile</th>
                <th className="py-3.5 px-4">Account Type &amp; Channel</th>
                <th className="py-3.5 px-4">Points Balance</th>
                <th className="py-3.5 px-4">Total Items Recycled</th>
                <th className="py-3.5 px-4">Material Breakdown</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border t-text-primary">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center t-text-muted">
                    <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                    <p className="font-semibold text-sm">No recyclers found matching search criteria</p>
                    <p className="text-xs mt-1">Try switching category segments or clearing the search query.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCorp = isCorporateUser(user);
                  const isTop = isTopChampion(user);
                  const totalItems = (user.bottles || 0) + (user.cups || 0) + (user.tetra || 0) + (user.paper || 0) + (user.glass || 0);
                  const initials = (user.fullName || user.username || 'User').substring(0, 2).toUpperCase();

                  return (
                    <tr key={user.id} className="hover:t-bg-hover transition-colors">
                      
                      {/* User Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center shrink-0 text-sm ${
                            isCorp 
                              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30' 
                              : isTop 
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30' 
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold t-text-primary flex items-center gap-1.5 flex-wrap">
                              <span>{user.fullName || user.username}</span>
                              {isCorp ? (
                                <span className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30 font-semibold">
                                  {user.orgName ? user.orgName.replace('Client: ', '') : 'Corporate'}
                                </span>
                              ) : isTop ? (
                                <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 font-bold flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  Top Recycler
                                </span>
                              ) : (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 font-semibold">
                                  Public Kiosk
                                </span>
                              )}
                              {user.isOnline && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online Now"></span>
                              )}
                            </div>
                            <div className="text-[11px] t-text-muted mt-0.5 mono">
                              ID: {String(user.id).substring(0, 10)} • {user.authProvider === 'google' ? 'Google Auth' : 'Verified Profile'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Account Type & Channel */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium mono t-text-primary flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <span>{user.mobile && user.mobile !== '-' ? user.mobile : 'Unlinked Phone'}</span>
                        </div>
                        <div className="text-[11px] t-text-muted truncate max-w-[190px] mt-0.5">
                          {user.email && !user.email.endsWith('@rvm.local') ? user.email : 'SMS OTP Verified'}
                        </div>
                      </td>

                      {/* Points Balance */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-sm mono text-amber-600 dark:text-amber-400">
                          {(user.points || 0).toLocaleString()} Pts
                        </div>
                        <div className="text-[11px] t-text-muted mt-0.5">
                          {user.totalRedeemedPoints > 0 
                            ? `${user.totalRedeemedPoints.toLocaleString()} redeemed`
                            : `PKR ${Math.round((user.points || 0) * 0.20)} value`}
                        </div>
                      </td>

                      {/* Total Items Recycled */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold t-text-primary text-sm mono">
                          {totalItems.toLocaleString()} Items
                        </span>
                        <div className="text-[10px] t-text-muted mt-0.5">
                          {user.sessions || 0} drop sessions
                        </div>
                      </td>

                      {/* Material Breakdown */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(user.bottles || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30 text-[11px]">
                              {user.bottles} Bottles
                            </span>
                          )}
                          {(user.cups || 0) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30 text-[11px]">
                              {user.cups} Cans
                            </span>
                          )}
                          {((user.tetra || 0) > 0 || (user.tetraGrams || 0) > 0) && (
                            <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold border border-sky-500/30 text-[11px]">
                              {user.tetra || Math.round((user.tetraGrams || 0) / 25)} Cartons
                            </span>
                          )}
                          {((user.paper || 0) > 0 || (user.paperGrams || 0) > 0) && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold border border-purple-500/30 text-[11px]">
                              {user.paper || Math.round((user.paperGrams || 0) / 50)} Paper
                            </span>
                          )}
                          {totalItems === 0 && (
                            <span className="text-[11px] t-text-muted italic">No items yet</span>
                          )}
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs t-text-primary flex items-center gap-1">
                          {user.isOnline ? (
                            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Online Now
                            </span>
                          ) : (
                            formatTimeAgo(user.lastActive)
                          )}
                        </div>
                        <div className="text-[11px] t-text-muted mt-0.5">
                          {user.lastActive ? new Date(user.lastActive).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Never'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openUserHistory(user)}
                          className="px-3 py-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl font-bold transition-all inline-flex items-center gap-1 text-xs"
                        >
                          <span>View History</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User History & Activity Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl max-w-2xl w-full p-6 border t-border shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b t-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm">
                  {(selectedUser.fullName || selectedUser.username || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold t-text-primary text-base flex items-center gap-2">
                    <span>{selectedUser.fullName || selectedUser.username} – Recycling Activity</span>
                  </h3>
                  <p className="text-xs t-text-muted mono mt-0.5">
                    User ID: {selectedUser.id} • Mobile: {selectedUser.mobile}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 t-text-muted hover:t-text-primary t-bg-sec rounded-xl border t-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stat Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 rounded-2xl t-bg-sec border border-amber-500/30">
                <div className="text-[10px] text-amber-500 uppercase font-bold">Active Balance</div>
                <div className="font-extrabold text-amber-600 dark:text-amber-400 text-base mono mt-0.5">
                  {(selectedUser.points || 0).toLocaleString()} pts
                </div>
              </div>
              <div className="p-3 rounded-2xl t-bg-sec border border-purple-500/30">
                <div className="text-[10px] text-purple-500 uppercase font-bold">Redeemed</div>
                <div className="font-extrabold text-purple-600 dark:text-purple-400 text-base mono mt-0.5">
                  {(selectedUser.totalRedeemedPoints || 0).toLocaleString()} pts
                </div>
              </div>
              <div className="p-3 rounded-2xl t-bg-sec border border-emerald-500/30">
                <div className="text-[10px] text-emerald-500 uppercase font-bold">Lifetime Items</div>
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base mono mt-0.5">
                  {(selectedUser.bottles || 0) + (selectedUser.cups || 0) + (selectedUser.tetra || 0) + (selectedUser.paper || 0)}
                </div>
              </div>
              <div className="p-3 rounded-2xl t-bg-sec border t-border">
                <div className="text-[10px] t-text-muted uppercase font-bold">Total Sessions</div>
                <div className="font-extrabold t-text-primary text-base mono mt-0.5">
                  {selectedUser.sessions || userHistory.length}
                </div>
              </div>
            </div>

            {/* Activity Modal Tabs */}
            <div className="flex items-center gap-2 border-b t-border pb-2">
              <button
                onClick={() => setActiveModalTab('recycling')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeModalTab === 'recycling'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 't-text-secondary hover:t-text-primary t-bg-sec border t-border'
                }`}
              >
                <Recycle className="w-3.5 h-3.5" />
                <span>Recycling Sessions ({userHistory.length})</span>
              </button>

              <button
                onClick={() => setActiveModalTab('redemptions')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeModalTab === 'redemptions'
                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30'
                    : 't-text-secondary hover:t-text-primary t-bg-sec border t-border'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Vouchers & Redemptions ({userRedemptions.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            {activeModalTab === 'recycling' ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {loadingHistory ? (
                  <div className="py-10 text-center t-text-muted flex items-center justify-center gap-2 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                    <span>Loading recycling history...</span>
                  </div>
                ) : userHistory.length === 0 ? (
                  <div className="p-8 text-center t-bg-sec rounded-2xl border t-border text-xs t-text-muted">
                    <Recycle className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                    <p className="font-bold t-text-primary">No Session History Found</p>
                    <p className="mt-1">This user has not completed any machine deposits yet.</p>
                  </div>
                ) : (
                  userHistory.map((s, idx) => (
                    <div key={s.session_id || idx} className="p-3 rounded-2xl t-bg-sec border t-border flex items-center justify-between text-xs hover:t-bg-hover transition-colors">
                      <div>
                        <div className="font-bold t-text-primary flex items-center gap-2">
                          <span>{s.machine_id || 'Smart RVM Unit'}</span>
                          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20 font-mono">
                            {s.session_id ? s.session_id.substring(0, 10) : `SES-${idx + 1}`}
                          </span>
                        </div>
                        <div className="t-text-muted text-[11px] mt-0.5">
                          {s.created_at || s.recycledAt ? new Date(s.created_at || s.recycledAt).toLocaleString() : 'Recent'} • 
                          {' '}{s.plastic_count || s.bottles || 0} PET • {s.aluminium_count || s.cups || 0} Cans • {s.tetrapak_count || s.tetra_count || 0} Cartons
                        </div>
                      </div>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30 mono">
                        +{s.points_earned || s.points || 0} Pts
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {loadingHistory ? (
                  <div className="py-10 text-center t-text-muted flex items-center justify-center gap-2 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                    <span>Loading voucher redemptions...</span>
                  </div>
                ) : userRedemptions.length === 0 ? (
                  <div className="p-8 text-center t-bg-sec rounded-2xl border t-border text-xs t-text-muted">
                    <Ticket className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-500" />
                    <p className="font-bold t-text-primary">No Vouchers Cashed</p>
                    <p className="mt-1">All earned points remain fully active in user balance.</p>
                  </div>
                ) : (
                  userRedemptions.map((r, idx) => (
                    <div key={r.redemption_id || idx} className="p-3 rounded-2xl t-bg-sec border t-border flex items-center justify-between text-xs hover:t-bg-hover transition-colors">
                      <div>
                        <div className="font-bold t-text-primary flex items-center gap-2 flex-wrap">
                          {r.category === 'easypaisa' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <Wallet className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              EasyPaisa
                            </span>
                          ) : r.category === 'jazzcash' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                              <Smartphone className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              JazzCash
                            </span>
                          ) : r.category === 'mobile_load' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <Smartphone className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              Mobile Load
                            </span>
                          ) : r.category === 'raast' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                              <Wallet className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                              Raast
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                              <Gift className="w-3 h-3 text-purple-500" />
                              Voucher
                            </span>
                          )}
                          <span>{r.item_name || 'Reward Payout'}</span>
                          {r.voucher_code && (
                            <button
                              onClick={() => copyToClipboard(r.voucher_code)}
                              className="font-mono text-[11px] text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/20 flex items-center gap-1"
                              title="Click to copy code"
                            >
                              <span>{r.voucher_code}</span>
                              {copiedVoucher === r.voucher_code ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        <div className="t-text-muted text-[11px] mt-0.5">
                          {r.created_at ? new Date(r.created_at).toLocaleString() : 'Recent'} • Status: {(r.status || 'Completed').toUpperCase()}
                        </div>
                      </div>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/30 mono">
                        -{r.points_redeemed || 0} Pts
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t t-border">
              <div className="text-[11px] t-text-muted flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Audited Database Record</span>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer Strip */}
      <footer className="glass-panel p-4 rounded-2xl border t-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs t-text-secondary">
        <div className="flex items-center gap-2">
          <span>© 2026 ISP Environmental Solutions Pvt. Ltd.</span>
          <span>•</span>
          <span>Recyclers &amp; Mobile App Directory</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{users.length} Registered Recyclers</span>
          <span>•</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Directory Synchronized
          </span>
        </div>
      </footer>

    </div>
  );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, Award, RefreshCw, BarChart2, Sparkles, Gift, Building2, Send, 
  Search, CheckCircle2, ChevronRight, X, Phone, User, Filter, ArrowUpRight,
  ShieldCheck, Zap, Flame, HeartHandshake, DollarSign, Calendar, Check,
  UserCheck, Users, Wallet, Smartphone, Landmark, CheckCheck, AlertTriangle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';

export default function AnalyticsTab({ stationFilter, selectedClientId, currentUser }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scope, setScope] = useState('all'); // 'all' | 'month' | 'corporate' | 'citizens'
  const [selectedClient, setSelectedClient] = useState(
    selectedClientId && selectedClientId !== 'ALL' ? selectedClientId : 'all'
  ); // 'all' | 'citizens' | specific orgId or clientName
  const [scaleMetric, setScaleMetric] = useState('kilo'); // 'kilo' | 'points'
  const [searchQuery, setSearchQuery] = useState('');
  const analyticsRequestId = useRef(0);
  
  // Payout & Voucher Modal state
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedChampion, setSelectedChampion] = useState(null);
  const [payoutMethod, setPayoutMethod] = useState('easypaisa'); // 'easypaisa' | 'jazzcash' | 'mobile_load' | 'voucher' | 'raast'
  const [voucherAmount, setVoucherAmount] = useState('1000');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState('1000');
  const [walletNumber, setWalletNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [voucherTitle, setVoucherTitle] = useState('Special Milestone Payout');
  const [voucherNote, setVoucherNote] = useState('');
  const [allowOverdraft, setAllowOverdraft] = useState(false);
  const [isSubmittingVoucher, setIsSubmittingVoucher] = useState(false);

  const PAYOUT_METHODS = [
    {
      id: 'easypaisa',
      name: 'EasyPaisa Wallet',
      tagline: 'Instant 03XX mobile wallet transfer',
      badge: 'Instant 24/7',
      theme: 'emerald',
      icon: Wallet
    },
    {
      id: 'jazzcash',
      name: 'JazzCash Wallet',
      tagline: 'Direct mobile wallet cash transfer',
      badge: 'Instant 24/7',
      theme: 'rose',
      icon: Smartphone
    },
    {
      id: 'mobile_load',
      name: 'Mobile Airtime Top-Up',
      tagline: 'Prepaid load (Jazz/Zong/Telenor/Ufone)',
      badge: 'Airtime',
      theme: 'amber',
      icon: Zap
    },
    {
      id: 'voucher',
      name: 'Retail Merchant E-Voucher',
      tagline: 'Vouch365 SMS retail & grocery coupon',
      badge: 'SMS Voucher',
      theme: 'purple',
      icon: Gift
    },
    {
      id: 'raast',
      name: 'Raast Instant Pay',
      tagline: 'SBP 1-Link National IBAN payout',
      badge: 'Bank Transfer',
      theme: 'cyan',
      icon: Landmark
    }
  ];

  const PRESET_AMOUNTS = [
    { value: '500', label: 'PKR 500', points: '2,500 pts', tier: 'Quick Eco Reward' },
    { value: '1000', label: 'PKR 1,000', points: '5,000 pts', tier: 'Special Milestone Payout' },
    { value: '2500', label: 'PKR 2,500', points: '12,500 pts', tier: 'Monthly Champion Payout' },
    { value: '5000', label: 'PKR 5,000', points: '25,000 pts', tier: 'Corporate ESG Hero Award' },
  ];

  // Broadcast modal state
  const [broadcastAudience, setBroadcastAudience] = useState('Top 10 Recyclers');
  const [broadcastMessage, setBroadcastMessage] = useState('🎉 Congratulations to our Top Green Champions! Keep recycling at any ISP Smart RVM or PecoDrop kiosk to maximize your monthly cash-out rewards.');
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3200);
  };

  // Helper to mask phone numbers for contact column
  const maskPhone = (val) => {
    if (!val) return 'Anonymous';
    const s = String(val).trim();
    if (s.length >= 10 && !s.includes('@') && /^\d+$/.test(s.replace(/[-+ ]/g, ''))) {
      const clean = s.replace(/[-+ ]/g, '');
      return clean.slice(0, 4) + '****' + clean.slice(-3);
    }
    if (s.includes('@')) {
      const parts = s.split('@');
      return parts[0].slice(0, 3) + '***@' + parts[1];
    }
    return s;
  };

  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return 'EC';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getMachinesQuery = () => {
    try {
      const u = currentUser || JSON.parse(localStorage.getItem('rvm_auth_user') || '{}');
      if (!u.assignedMachines) return '';
      const arr = Array.isArray(u.assignedMachines) ? u.assignedMachines : [u.assignedMachines];
      if (arr.includes('*')) return '';
      return `&assignedMachines=${encodeURIComponent(arr.join(','))}`;
    } catch (e) {
      return '';
    }
  };

  // Fetch organizations for the client filter dropdown
  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/enterprise/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrganizations(Array.isArray(data) ? data : (data.organizations || []));
      }
    } catch (e) {
      console.error('Failed to fetch orgs:', e);
    }
  };

  const fetchAnalytics = async (selectedScope = scope, client = selectedClient) => {
    const requestId = ++analyticsRequestId.current;
    try {
      setRefreshing(true);
      let url = `/api/analytics/leaderboard?scope=${selectedScope}${getMachinesQuery()}`;
      if (client && client !== 'all') {
        url += `&client=${encodeURIComponent(client)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (requestId === analyticsRequestId.current) {
          setLeaderboard(Array.isArray(data) ? data : []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      showToast('Error syncing live leaderboard data', 'error');
    } finally {
      if (requestId === analyticsRequestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Keep this tab aligned with the organization selected in the master portal
  // navbar. The tab still allows an independent filter while the global scope is ALL.
  useEffect(() => {
    if (selectedClientId && selectedClientId !== 'ALL') {
      setSelectedClient(selectedClientId);
    } else if (selectedClientId === 'ALL') {
      setSelectedClient('all');
    }
  }, [selectedClientId]);

  useEffect(() => {
    fetchAnalytics(scope, selectedClient);
  }, [scope, selectedClient]);

  const handleRefresh = () => {
    fetchAnalytics(scope, selectedClient);
    showToast('Leaderboard rankings updated in real-time');
  };

  const handleScopeChange = (newScope) => {
    setScope(newScope);
    const label = newScope === 'all' ? 'All Time' : newScope === 'month' ? 'This Month' : newScope === 'corporate' ? 'Corporate Units' : 'Citizens Only';
    showToast(`Showing leaderboard for: ${label}`);
  };

  const handleClientChange = (newClient) => {
    setSelectedClient(newClient);
    const label = newClient === 'all' 
      ? 'All Clients & Citizens' 
      : newClient === 'citizens' 
      ? 'Citizens Only (Public RVMs)' 
      : organizations.find(o => o.org_id === newClient)?.name || newClient;
    showToast(`Filtered by: ${label}`);
  };

  // Filter leaderboard table by search query and client
  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter(u => {
      // 1. Client filter
      if (selectedClient !== 'all') {
        if (selectedClient === 'citizens') {
          if (u.userType !== 'CITIZEN' && u.orgId) return false;
        } else {
          const matchOrg = (u.orgId && u.orgId.toLowerCase() === selectedClient.toLowerCase()) ||
                           (u.clientName && u.clientName.toLowerCase().includes(selectedClient.toLowerCase()));
          if (!matchOrg) return false;
        }
      }

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (u.registeredName && u.registeredName.toLowerCase().includes(q)) ||
        (u.userName && u.userName.toLowerCase().includes(q)) ||
        (u.clientName && u.clientName.toLowerCase().includes(q)) ||
        (u.mobile && u.mobile.toLowerCase().includes(q)) ||
        (u._id && String(u._id).toLowerCase().includes(q)) ||
        (u.machineId && u.machineId.toLowerCase().includes(q))
      );
    });
  }, [leaderboard, searchQuery, selectedClient]);

  // Open voucher & payout modal targeted to a specific user
  const handleOpenVoucherModal = (champion = null) => {
    const target = champion || filteredLeaderboard[0];
    if (!target) {
      showToast('No recycler is available for the selected organization and filters.', 'error');
      return;
    }
    setSelectedChampion(target);
    const phone = target.mobile || target._id || '';
    setWalletNumber(phone);
    setAccountTitle(target.registeredName || target.userName || '');
    setPayoutMethod('easypaisa');
    setAllowOverdraft(false);

    // Auto-select affordable preset based on user balance
    const userPts = Number(target.availablePoints ?? target.points_balance ?? target.totalPoints ?? 0);
    const maxPkr = Math.floor(userPts * 0.2);

    if (maxPkr >= 1000) {
      setVoucherAmount('1000');
      setIsCustomAmount(false);
      setVoucherTitle('Special Milestone Payout');
    } else if (maxPkr >= 500) {
      setVoucherAmount('500');
      setIsCustomAmount(false);
      setVoucherTitle('Quick Eco Reward');
    } else if (maxPkr >= 50) {
      setVoucherAmount('');
      setIsCustomAmount(true);
      setCustomAmountInput(String(maxPkr));
      setVoucherTitle('Custom Balance Payout');
    } else {
      setVoucherAmount('500');
      setIsCustomAmount(false);
      setVoucherTitle('Quick Eco Reward');
    }

    setVoucherNote('');
    setIsVoucherModalOpen(true);
  };

  // Submit issue voucher or mobile wallet payout
  const handleDispatchVoucher = async () => {
    if (!selectedChampion) return;
    const finalAmount = isCustomAmount ? parseInt(customAmountInput || '0') : parseInt(voucherAmount || '1000');
    if (!finalAmount || finalAmount < 50) {
      showToast('Please specify a valid amount of at least PKR 50', 'error');
      return;
    }

    const ptsRequired = finalAmount * 5;
    const userPts = Number(selectedChampion.availablePoints ?? selectedChampion.points_balance ?? selectedChampion.totalPoints ?? 0);
    const maxPkr = Math.floor(userPts * 0.2);

    // Guard against insufficient balance
    if (!allowOverdraft && ptsRequired > userPts) {
      showToast(`Insufficient balance! User has ${userPts.toLocaleString()} pts (max payout PKR ${maxPkr.toLocaleString()}), but PKR ${finalAmount.toLocaleString()} requires ${ptsRequired.toLocaleString()} pts.`, 'error');
      return;
    }

    const cleanPhone = (walletNumber || selectedChampion.mobile || selectedChampion._id || '').trim();
    if (!cleanPhone) {
      showToast('Please specify a destination mobile or wallet number', 'error');
      return;
    }

    try {
      setIsSubmittingVoucher(true);
      const selectedMethodObj = PAYOUT_METHODS.find(m => m.id === payoutMethod);
      const res = await fetch('/api/analytics/issue-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: selectedChampion._id,
          recipientPhone: cleanPhone,
          recipientName: accountTitle || selectedChampion.registeredName || selectedChampion.userName || 'Champion Recycler',
          payoutMethod,
          amountPkr: finalAmount,
          allowOverdraft,
          voucherTitle: `PKR ${finalAmount.toLocaleString()} ${selectedMethodObj?.name || 'Payout'}`,
          note: voucherNote || `${selectedMethodObj?.name || 'Wallet'} payout for Green Champion`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsVoucherModalOpen(false);
        setVoucherNote('');
        showToast(data.message || `PKR ${finalAmount.toLocaleString()} successfully dispatched to ${cleanPhone}!`);
        
        // Update local champion points and refresh leaderboard
        if (!allowOverdraft) {
          const newBal = Math.max(0, userPts - ptsRequired);
          selectedChampion.totalPoints = newBal;
          selectedChampion.availablePoints = newBal;
          selectedChampion.points_balance = newBal;
        }
        fetchAnalytics(scope, selectedClient);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Failed to dispatch payout. Please try again.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while issuing payout', 'error');
    } finally {
      setIsSubmittingVoucher(false);
    }
  };

  // Submit broadcast notification
  const handleDispatchBroadcast = async () => {
    try {
      setIsSubmittingBroadcast(true);
      const res = await fetch('/api/analytics/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience: broadcastAudience,
          message: broadcastMessage
        })
      });

      if (res.ok) {
        setIsBroadcastModalOpen(false);
        showToast(`Motivation notification broadcasted to ${broadcastAudience}!`);
      } else {
        showToast('Failed to dispatch broadcast', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while broadcasting message', 'error');
    } finally {
      setIsSubmittingBroadcast(false);
    }
  };

  // Top 3 Podium Champions calculation based on current filtered list
  const activePool = filteredLeaderboard;
  const emptyChampion = (rank) => ({
    _id: '',
    userName: 'No recycler data',
    registeredName: '',
    isRegistered: false,
    clientName: '',
    rank,
    totalPoints: 0,
    totalBottles: 0,
    totalCans: 0,
    totalItems: 0,
    totalSessions: 0,
    equivalentPkr: 0,
    subtitle: 'No matching activity for this filter'
  });

  const top1 = activePool[0] || emptyChampion(1);
  const top2 = activePool[1] || emptyChampion(2);
  const top3 = activePool[2] || emptyChampion(3);

  // Chart data for Top 8 Champions
  const chartSource = activePool.slice(0, 8);

  const chartData = chartSource.map((u, i) => {
    const rawPts = u.totalPoints || 0;
    const isKilo = scaleMetric === 'kilo';
    const displayValue = isKilo ? Number((rawPts / 1000).toFixed(1)) : rawPts;
    
    // Use registered user name or clean short name
    let shortName = u.registeredName || u.userName || u._id;
    if (shortName.includes(' ') && shortName.length > 12) {
      const parts = shortName.split(' ');
      shortName = `${parts[0]} ${parts[1][0]}.`;
    } else if (shortName.length > 14) {
      shortName = shortName.slice(0, 12) + '..';
    }

    return {
      name: `#${i + 1} ${shortName}`,
      fullName: u.registeredName || u.userName || u._id,
      isRegistered: u.isRegistered,
      clientName: u.clientName,
      displayPoints: displayValue,
      rawPoints: rawPts,
      bottles: u.totalBottles || 0,
      cans: u.totalCans || 0,
      voucherPkr: u.equivalentPkr || Math.round(rawPts * 0.2),
      index: i
    };
  });

  const getBarFill = (index) => {
    if (index === 0) return '#f59e0b'; // Gold Champion
    if (index === 1) return '#94a3b8'; // Silver Medalist
    if (index === 2) return '#d97706'; // Bronze Medalist
    return '#059669'; // Emerald for ranks 4-8
  };

  // User initials avatar
  const userInitials = useMemo(() => {
    const name = currentUser?.name || currentUser?.username || 'Admin';
    return getInitials(name);
  }, [currentUser]);

  if (loading && leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 t-text-muted gap-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white animate-pulse">
          <Trophy className="w-7 h-7" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold t-text-primary">Loading Green Champions Leaderboard</h3>
          <p className="text-xs t-text-muted mt-1">Auditing real-time recycling points and verified citizen profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      
      {/* ======================================================== */}
      {/* 1. HEADER SECTION (Matches Analytics_Leaderboard_Hub.html) */}
      {/* ======================================================== */}
      <header className="glass-panel p-4 sm:p-5 rounded-3xl border t-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/25 text-white font-black text-xl shrink-0">
            <Trophy className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                Community Gamification
              </span>
              <span className="hidden sm:inline-block text-xs font-medium text-slate-300 dark:text-slate-700">|</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Top Recyclers Live Ranks
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight t-text-primary leading-tight">
              Green Champions &amp; Recycling Leaderboard
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 sm:px-3 sm:py-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 t-bg-sec hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border t-border shadow-xs active:scale-95"
            title="Refresh Rankings"
          >
            <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
            <span className="hidden md:inline">Refresh Rankings</span>
          </button>
          
          <button 
            onClick={() => handleOpenVoucherModal(null)}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-emerald-600/30 transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Issue Payout / Voucher</span>
            <span className="sm:hidden">Payout</span>
          </button>

          {/* User Profile Avatar Pill */}
          <div className="flex items-center gap-2 pl-2 border-l t-border">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border t-border flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs shadow-xs" title={currentUser?.name || 'Administrator'}>
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. ADVANCED SEARCH & CLIENT/CITIZEN FILTER BAR          */}
      {/* ======================================================== */}
      <div className="glass-panel p-4 rounded-2xl border t-border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs">
        
        {/* Left Side: Specific Citizen & Corporate Client Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by registered citizen name, contact number, or corporate client (e.g. Tariq, Engro, Alfalah)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border t-border t-bg-sec t-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Side: Specific Corporate Client / Citizen Dropdown + Scope Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          
          {/* Specific Corporate Client Filter Dropdown */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedClient}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full sm:w-56 px-3 py-2 text-xs rounded-xl border t-border t-bg-sec t-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">🏢 All Clients &amp; Citizens</option>
              <option value="citizens">👤 General Citizens (Public RVMs)</option>
              {organizations.length > 0 ? (
                organizations.map(org => (
                  <option key={org.org_id} value={org.org_id}>
                    🏢 {org.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="ORG_ENGRO">🏢 Engro Corporation</option>
                  <option value="ORG_ALFALAH">🏢 Bank Alfalah Limited</option>
                  <option value="ORG_METRO">🏢 Metro Cash &amp; Carry</option>
                  <option value="ORG_UCP">🏢 University of Central Punjab</option>
                </>
              )}
            </select>
          </div>

          {/* Leaderboard Scope Filter Pills */}
          <div className="inline-flex rounded-xl border t-border p-1 text-xs font-semibold t-bg-sec shrink-0">
            <button 
              onClick={() => handleScopeChange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all text-xs ${
                scope === 'all' 
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Time
            </button>
            <button 
              onClick={() => handleScopeChange('month')}
              className={`px-3 py-1.5 rounded-lg transition-all text-xs ${
                scope === 'month' 
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              This Month
            </button>
            <button 
              onClick={() => handleScopeChange('corporate')}
              className={`px-3 py-1.5 rounded-lg transition-all text-xs ${
                scope === 'corporate' 
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Corporate Units
            </button>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. TOP 3 PODIUM CHAMPIONS CARDS                          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Rank #2: Silver Medalist (Left) */}
        <div className="glass-panel rounded-2xl p-5 border t-border shadow-xs relative overflow-hidden flex flex-col justify-between order-2 md:order-1 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-lg border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs">
                🥈 2
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Silver Recycler</span>
                <h3 className="font-bold t-text-primary text-base leading-tight mt-0.5 flex items-center gap-1.5 truncate">
                  {top2.registeredName || top2.userName || maskPhone(top2._id)}
                  {top2.isRegistered && (
                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400" title="Verified Registered User">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/20" />
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {top2.clientName ? `${top2.clientName} • Silver Tier` : (top2.subtitle || 'Smart RVM User')}
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
              {top2.totalSessions || 0} Sessions
            </span>
          </div>

          <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="t-text-muted font-medium">Recycled Volume:</span>
              <span className="font-bold t-text-primary">{top2.totalItems?.toLocaleString() || top2.totalBottles?.toLocaleString()} Items (PET &amp; Cans)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="t-text-muted font-medium">Earned Points:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{top2.totalPoints?.toLocaleString()} Pts</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="t-text-muted">Reward Voucher Value:</span>
            <span className="font-bold t-text-primary bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              PKR {(top2.equivalentPkr || Math.round(top2.totalPoints * 0.2)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Rank #1: Gold Champion (Center Hero) */}
        <div className="bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-slate-900/60 dark:to-slate-900/90 rounded-2xl p-6 border-2 border-amber-400/80 dark:border-amber-400/60 shadow-lg shadow-amber-500/10 relative overflow-hidden flex flex-col justify-between order-1 md:order-2">
          {/* Subtle top crown glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-2xl shadow-md shadow-amber-500/30 shrink-0">
                🥇 1
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border border-amber-300/60 dark:border-amber-700/60 px-2 py-0.5 rounded-full">
                  All-Time Champion
                </span>
                <h3 className="font-black t-text-primary text-lg mt-1 leading-tight flex items-center gap-1.5 truncate">
                  {top1.registeredName || top1.userName || maskPhone(top1._id)}
                  {top1.isRegistered && (
                    <span className="inline-flex items-center text-amber-600 dark:text-amber-400" title="Verified Registered User">
                      <CheckCircle2 className="w-4 h-4 fill-amber-500/20" />
                    </span>
                  )}
                </h3>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5 font-medium truncate">
                  {top1.clientName ? `${top1.clientName} • National Eco Leader` : (top1.subtitle || `${top1.totalSessions} Sessions • Diverted ${top1.totalItems || top1.totalBottles} Items`)}
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-700/60 shrink-0">
              Gold Tier
            </span>
          </div>

          <div className="my-4 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-amber-900/70 dark:text-amber-200/70 font-medium">Recycled Volume:</span>
              <span className="font-black t-text-primary">{top1.totalBottles?.toLocaleString()} Bottles Diverted</span>
            </div>
            <div className="flex justify-between text-xs items-baseline">
              <span className="text-amber-900/70 dark:text-amber-200/70 font-medium">Cumulative Balance:</span>
              <span className="font-black text-amber-700 dark:text-amber-400 text-base">{top1.totalPoints?.toLocaleString()} Pts</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-200/50 dark:border-amber-800/50">
            <span className="text-amber-900/80 dark:text-amber-300/80 font-medium">Equivalent Voucher Value:</span>
            <span className="font-black text-amber-950 dark:text-amber-100 bg-amber-200/80 dark:bg-amber-600/30 border border-amber-300 dark:border-amber-600/50 px-2.5 py-1 rounded-lg">
              PKR {(top1.equivalentPkr || Math.round(top1.totalPoints * 0.2)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Rank #3: Bronze Medalist (Right) */}
        <div className="glass-panel rounded-2xl p-5 border t-border shadow-xs relative overflow-hidden flex flex-col justify-between order-3 md:order-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-700/10 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 flex items-center justify-center font-black text-lg border border-amber-700/20 shrink-0 shadow-xs">
                🥉 3
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Bronze Recycler</span>
                <h3 className="font-bold t-text-primary text-base leading-tight mt-0.5 flex items-center gap-1.5 truncate">
                  {top3.registeredName || top3.userName || maskPhone(top3._id)}
                  {top3.isRegistered && (
                    <span className="inline-flex items-center text-amber-700 dark:text-amber-400" title="Verified Registered User">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-amber-700/20" />
                    </span>
                  )}
                </h3>
                <p className="text-xs t-text-muted mt-0.5 truncate">
                  {top3.clientName ? `${top3.clientName} • Bronze Tier` : (top3.subtitle || 'Campus App Citizen')}
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
              {top3.totalSessions || 0} Sessions
            </span>
          </div>

          <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="t-text-muted font-medium">Recycled Volume:</span>
              <span className="font-bold t-text-primary">{top3.totalItems?.toLocaleString() || top3.totalBottles?.toLocaleString()} Bottles &amp; UBC Cartons</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="t-text-muted font-medium">Earned Points:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">{top3.totalPoints?.toLocaleString()} Pts</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="t-text-muted">Reward Voucher Value:</span>
            <span className="font-bold t-text-primary bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              PKR {(top3.equivalentPkr || Math.round(top3.totalPoints * 0.2)).toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 4. ANALYTICS CHART & ENGAGEMENT BANNER (12 COLS)          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top 8 Champions Points Distribution (8 Cols) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-5 border t-border shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold t-text-primary flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Top 8 Recyclers Point Intake Distribution
              </h3>
              <p className="text-xs t-text-muted">Audited loyalty points generated per verified active recycler</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Metric Scale:</span>
              <button 
                onClick={() => setScaleMetric(scaleMetric === 'kilo' ? 'points' : 'kilo')}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border t-border"
              >
                {scaleMetric === 'kilo' ? 'Points in Thousands (k)' : 'Raw Points (pts)'}
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #e2e8f0)" opacity={0.6} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted, #94a3b8)" 
                  fontSize={11} 
                  interval={0} 
                  angle={-20} 
                  textAnchor="end"
                  tickLine={false}
                />
                <YAxis 
                  stroke="var(--text-muted, #94a3b8)" 
                  fontSize={11}
                  tickFormatter={(val) => scaleMetric === 'kilo' ? `${val}k` : val}
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="glass-panel p-3 rounded-xl border t-border shadow-xl text-xs space-y-1">
                          <p className="font-bold t-text-primary flex items-center gap-1.5">
                            {data.fullName}
                            {data.isRegistered && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
                            )}
                          </p>
                          {data.clientName && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              🏢 {data.clientName}
                            </p>
                          )}
                          <p className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                            {data.rawPoints.toLocaleString()} Points
                          </p>
                          <p className="t-text-muted">
                            {data.bottles} Bottles • {data.cans} Cans
                          </p>
                          <p className="text-amber-700 dark:text-amber-400 font-semibold pt-1 border-t t-border">
                            Voucher Est: PKR {data.voucherPkr.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="displayPoints" name="Loyalty Points" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarFill(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gamification Tips & Motivation Rules (4 Cols) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border t-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-sm font-bold t-text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Engagement Motivation
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Active
              </span>
            </div>
            <p className="text-xs t-text-muted mb-4">Campaign milestones to retain active recyclers</p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-xs">
                <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                  <Gift className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 1,000 Points = PKR 200
                </div>
                <p className="text-emerald-800/80 dark:text-emerald-300/80 text-[11px] leading-relaxed">
                  Users reach minimum cash-out threshold at 1,000 points. Keep public kiosk push notifications active!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/40 text-xs">
                <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> PecoDrop Team Competitions
                </div>
                <p className="text-purple-800/80 dark:text-purple-300/80 text-[11px] leading-relaxed">
                  Corporate campus employees earn bonus reward badges for confidential document drops over 1 kg.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-xs">
                <div className="font-bold t-text-primary mb-1 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" /> Top Recycler of the Month
                </div>
                <p className="t-text-muted text-[11px]">
                  The #1 monthly contributor receives an additional PKR 2,500 shopping voucher sponsored by FMCG partners.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t t-border mt-4">
            <button 
              onClick={() => setIsBroadcastModalOpen(true)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Broadcast Notification to Top 10
            </button>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 5. COMPLETE RANKED LEADERBOARD TABLE                     */}
      {/* ======================================================== */}
      <div className="glass-panel rounded-2xl border t-border shadow-xs overflow-hidden">
        <div className="p-5 border-b t-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold t-text-primary flex items-center gap-2">
              Full Community Leaderboard Roster
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {filteredLeaderboard.length} Recyclers
              </span>
            </h2>
            <p className="text-xs t-text-muted">Ranked by verified cumulative points, registered user accounts, and diverted items</p>
          </div>
          
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Active Filter: <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {selectedClient === 'all' 
                ? 'All Clients' 
                : selectedClient === 'citizens' 
                ? 'Citizens Only' 
                : organizations.find(o => o.org_id === selectedClient)?.name || selectedClient}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b t-border text-slate-600 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4 w-16">Rank</th>
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">Contact Identifier</th>
                <th className="py-3.5 px-4 text-center">Sessions</th>
                <th className="py-3.5 px-4 text-right">Bottles</th>
                <th className="py-3.5 px-4 text-right">Cans / Cartons</th>
                <th className="py-3.5 px-4 text-right">Points Earned</th>
                <th className="py-3.5 px-4 text-right">Voucher Value</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border text-slate-700 dark:text-slate-300">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center t-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-sm">No eco-recyclers found</p>
                      <p className="text-xs">No records matched your search query or client filter.</p>
                      {(searchQuery || selectedClient !== 'all') && (
                        <button 
                          onClick={() => { setSearchQuery(''); setSelectedClient('all'); }}
                          className="mt-2 text-xs text-emerald-600 font-bold hover:underline"
                        >
                          Reset Filters &amp; Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((user, idx) => {
                  const rank = user.rank || idx + 1;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;
                  const voucherVal = user.equivalentPkr || Math.round((user.totalPoints || 0) * 0.2);

                  // Display Name: Show real registered name if registered, otherwise user name / masked id
                  const displayName = user.registeredName || user.userName || maskPhone(user._id);

                  return (
                    <tr 
                      key={user._id || idx}
                      className={`transition-colors ${
                        isTop1 
                          ? 'bg-amber-500/10 hover:bg-amber-500/15' 
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-3.5 px-4">
                        {isTop1 ? (
                          <span className="w-7 h-7 rounded-lg bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs">#1</span>
                        ) : isTop2 ? (
                          <span className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs flex items-center justify-center shadow-xs">#2</span>
                        ) : isTop3 ? (
                          <span className="w-7 h-7 rounded-lg bg-amber-700/20 text-amber-900 dark:text-amber-300 font-black text-xs flex items-center justify-center shadow-xs">#3</span>
                        ) : (
                          <span className="font-bold text-slate-400 dark:text-slate-500 pl-1.5">#{rank}</span>
                        )}
                      </td>

                      {/* User Details Column - Displays Registered Name if registered */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold t-text-primary flex items-center gap-1.5">
                          <span>{displayName}</span>
                          
                          {/* Registered user badge */}
                          {user.isRegistered && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30" title="Verified Registered User">
                              <CheckCircle2 className="w-3 h-3 fill-emerald-500/20 shrink-0" />
                              Verified
                            </span>
                          )}

                          {/* Top 3 Champion Badges */}
                          {isTop1 && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded">Champion</span>
                          )}
                          {isTop2 && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.2 rounded">Silver</span>
                          )}
                          {isTop3 && (
                            <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 font-bold px-1.5 py-0.2 rounded">Bronze</span>
                          )}
                        </div>

                        {/* Corporate Client / Citizen Subtitle */}
                        <div className="text-[11px] t-text-muted flex items-center gap-1.5 mt-0.5">
                          {user.userType === 'ENTERPRISE' || user.clientName ? (
                            <>
                              <span className="font-medium text-slate-600 dark:text-slate-400">
                                🏢 {user.clientName || 'Corporate Client'}
                              </span>
                              <span>•</span>
                              <span>PecoDrop User</span>
                            </>
                          ) : (
                            <>
                              <span>Public Smart RVM Citizen</span>
                              {user.isRegistered && <span>• Mobile App</span>}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Contact Identifier */}
                      <td className="py-3.5 px-4 font-mono font-medium t-text-secondary">
                        {user.mobile || user._id}
                      </td>

                      {/* Sessions */}
                      <td className="py-3.5 px-4 text-center font-bold t-text-primary">
                        {user.totalSessions || 1}
                      </td>

                      {/* Bottles */}
                      <td className="py-3.5 px-4 text-right font-black text-emerald-700 dark:text-emerald-400">
                        {(user.totalBottles || 0).toLocaleString()}
                      </td>

                      {/* Cans / Cartons */}
                      <td className="py-3.5 px-4 text-right t-text-muted font-medium">
                        {user.totalCans || 0} cans • {user.totalTetra || 0} UBC
                      </td>

                      {/* Points Earned */}
                      <td className={`py-3.5 px-4 text-right font-black text-sm ${
                        isTop1 ? 'text-amber-700 dark:text-amber-400' : 't-text-primary'
                      }`}>
                        {(user.totalPoints || 0).toLocaleString()} pts
                      </td>

                      {/* Voucher Value */}
                      <td className="py-3.5 px-4 text-right font-bold t-text-primary">
                        PKR {voucherVal.toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenVoucherModal(user)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all active:scale-95 inline-flex items-center gap-1"
                          title={`Issue Incentive Voucher to ${displayName}`}
                        >
                          <Award className="w-3 h-3" />
                          Reward
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

      {/* ======================================================== */}
      {/* 6. FOOTER (Matches Analytics_Leaderboard_Hub.html)        */}
      {/* ======================================================== */}
      <footer className="glass-panel rounded-2xl border t-border py-4 px-6 text-xs t-text-muted flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium">
          <span>© 2026 ISP Environmental Solutions Pvt. Ltd.</span>
          <span>•</span>
          <span>Green Champions Leaderboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Rankings Synced with All Machines</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time Payout Engine
          </span>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 7. MODAL: ISSUE PAYOUT & E-VOUCHER (EASYPAISA / JAZZCASH / VOUCHERS) */}
      {/* ======================================================== */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="glass-panel bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border t-border max-h-[92vh] flex flex-col transition-all">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b t-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold t-text-primary text-base">Issue Cash Payout &amp; Reward</h3>
                  <p className="text-[11px] t-text-muted">Instant EasyPaisa, JazzCash, Airtime Load or Merchant Vouchers</p>
                </div>
              </div>
              <button 
                onClick={() => setIsVoucherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto py-3 space-y-4 pr-1 text-left flex-1">
              
              {/* Target Recycler Hero Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border t-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                    #{selectedChampion?.rank || 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold t-text-primary text-xs flex items-center gap-1.5 truncate">
                      <span>{selectedChampion?.registeredName || selectedChampion?.userName || selectedChampion?._id}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>
                    <div className="text-[11px] t-text-muted truncate">
                      {selectedChampion?.clientName || 'Smart RVM Public Citizen'} • {selectedChampion?.totalSessions || 1} Sessions
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {(selectedChampion?.totalPoints || 0).toLocaleString()} pts
                  </div>
                  <div className="text-[10px] font-bold t-text-muted">
                    Balance: PKR {(Math.round((selectedChampion?.totalPoints || 0) * 0.2)).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Step 1: Select Payout Gateway / Wallet */}
              <div>
                <label className="block text-xs font-bold t-text-primary mb-1.5">
                  1. Select Payout Channel / Wallet
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PAYOUT_METHODS.map((method) => {
                    const MethodIcon = method.icon;
                    const isSelected = payoutMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setPayoutMethod(method.id);
                          if (method.id === 'voucher') {
                            setVoucherTitle('Vouch365 Retail Discount Coupon');
                          } else {
                            setVoucherTitle(`${method.name} Payout`);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? method.id === 'easypaisa'
                              ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                              : method.id === 'jazzcash'
                                ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/30'
                                : method.id === 'mobile_load'
                                  ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                                  : method.id === 'raast'
                                    ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30'
                                    : 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30'
                            : 't-bg-sec t-border hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            method.id === 'easypaisa' 
                              ? 'bg-emerald-500 text-white' 
                              : method.id === 'jazzcash'
                                ? 'bg-rose-600 text-white'
                                : method.id === 'mobile_load'
                                  ? 'bg-amber-500 text-white'
                                  : method.id === 'raast'
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-purple-600 text-white'
                          }`}>
                            <MethodIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs t-text-primary leading-tight truncate">
                              {method.name}
                            </div>
                            <div className="text-[10px] t-text-muted leading-tight truncate">
                              {method.tagline}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 uppercase ${
                          isSelected 
                            ? 'bg-white dark:bg-slate-900 font-extrabold shadow-2xs' 
                            : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-500'
                        }`}>
                          {method.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Destination Wallet / Account Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold t-text-primary mb-1">
                    Destination Mobile / Wallet No.
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      value={walletNumber} 
                      onChange={(e) => setWalletNumber(e.target.value)}
                      placeholder="e.g. 0300-1234567"
                      className="w-full pl-9 pr-3 py-2 t-bg-sec border t-border t-text-primary text-xs rounded-xl font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold t-text-primary mb-1">
                    Account Title / Beneficiary
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      value={accountTitle} 
                      onChange={(e) => setAccountTitle(e.target.value)}
                      placeholder="e.g. Tariq Mehmood"
                      className="w-full pl-9 pr-3 py-2 t-bg-sec border t-border t-text-primary text-xs rounded-xl font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Select Payout Amount */}
              {(() => {
                const userPts = Number(selectedChampion?.availablePoints ?? selectedChampion?.points_balance ?? selectedChampion?.totalPoints ?? 0);
                const maxAffordablePkr = Math.floor(userPts * 0.2);
                const finalAmt = isCustomAmount ? (parseInt(customAmountInput) || 0) : (parseInt(voucherAmount) || 0);
                const ptsRequired = finalAmt * 5;
                const isExceeding = ptsRequired > userPts;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold t-text-primary">
                        2. Select Payout Amount (PKR)
                      </label>
                      <span className="text-[11px] t-text-muted">
                        Available Balance: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{userPts.toLocaleString()} pts (PKR {maxAffordablePkr.toLocaleString()})</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRESET_AMOUNTS.map((p) => {
                        const isSelected = !isCustomAmount && voucherAmount === p.value;
                        const reqPts = parseInt(p.value) * 5;
                        const isAffordable = userPts >= reqPts;

                        return (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => {
                              if (!isAffordable && !allowOverdraft) {
                                showToast(`User has ${userPts.toLocaleString()} pts (worth max PKR ${maxAffordablePkr.toLocaleString()}). Requires ${p.points}. Enable Overdraft Override below to issue as a courtesy grant.`, 'error');
                                return;
                              }
                              setIsCustomAmount(false);
                              setVoucherAmount(p.value);
                              setVoucherTitle(p.tier);
                            }}
                            className={`p-2.5 rounded-xl border text-center transition-all relative overflow-hidden ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30'
                                : !isAffordable && !allowOverdraft
                                  ? 'opacity-50 border-dashed t-bg-sec t-border hover:opacity-80'
                                  : 't-bg-sec t-border hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className={`font-extrabold text-xs ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 't-text-primary'}`}>
                              {p.label}
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mono mt-0.5">
                              {p.points}
                            </div>
                            <div className="text-[9px] t-text-muted mt-0.5 truncate">
                              {p.tier}
                            </div>
                            {!isAffordable && !allowOverdraft && (
                              <span className="text-[8px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-1 rounded block mt-1">
                                Needs {p.points}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Amount Toggle Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCustomAmount(!isCustomAmount)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          isCustomAmount 
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' 
                            : 't-bg-sec t-border t-text-secondary hover:t-text-primary'
                        }`}
                      >
                        <span>Custom Amount</span>
                      </button>
                      
                      {isCustomAmount && (
                        <div className="flex-1 flex items-center gap-2 animate-fade-in">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">PKR</span>
                            <input
                              type="number"
                              min="50"
                              step="50"
                              value={customAmountInput}
                              onChange={(e) => setCustomAmountInput(e.target.value)}
                              placeholder={`max PKR ${maxAffordablePkr}`}
                              className="w-full pl-12 pr-3 py-1.5 t-bg-sec border t-border t-text-primary text-xs rounded-lg font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            = {((parseInt(customAmountInput) || 0) * 5).toLocaleString()} pts
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Prominent Warning If Exceeding Balance */}
                    {isExceeding && !allowOverdraft && (
                      <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
                        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <div>
                          <span className="font-extrabold text-sm block">Insufficient User Wallet Balance!</span>
                          <span className="text-[11px] block mt-0.5">
                            User only has <strong>{userPts.toLocaleString()} pts</strong> (max payout <strong>PKR {maxAffordablePkr.toLocaleString()}</strong>). Cannot dispatch PKR {finalAmt.toLocaleString()} ({ptsRequired.toLocaleString()} pts) without enabling Admin Overdraft Override below.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Super Admin Courtesy Overdraft / Grant Checkbox */}
                    <div className="p-2.5 rounded-xl border t-border bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={allowOverdraft} 
                          onChange={(e) => setAllowOverdraft(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                        />
                        <div>
                          <span className="font-bold t-text-primary">Admin Courtesy Overdraft / Milestone Grant</span>
                          <p className="text-[10px] t-text-muted">Issue payout without deducting points from user's wallet</p>
                        </div>
                      </label>
                      {allowOverdraft && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 uppercase tracking-wide">
                          Override Active
                        </span>
                      )}
                    </div>

                    {/* Step 4: Live Payout Gateway Verification Summary */}
                    {(() => {
                      const activeMethod = PAYOUT_METHODS.find(m => m.id === payoutMethod) || PAYOUT_METHODS[0];
                      return (
                        <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                          isExceeding && !allowOverdraft 
                            ? 'bg-rose-500/5 border-rose-500/30' 
                            : 'bg-emerald-500/10 border-emerald-500/30'
                        }`}>
                          <div>
                            <div className={`font-extrabold flex items-center gap-1.5 ${
                              isExceeding && !allowOverdraft 
                                ? 'text-rose-700 dark:text-rose-300' 
                                : 'text-emerald-950 dark:text-emerald-200'
                            }`}>
                              <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Ready to Transfer: PKR {finalAmt.toLocaleString()} via {activeMethod.name}</span>
                            </div>
                            <div className="text-[11px] t-text-muted mt-0.5">
                              Destination: <span className="font-mono font-bold">{walletNumber || '03XX-XXXXXXX'}</span> • Recipient: <span className="font-semibold">{accountTitle || 'Champion'}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border mono ${
                              allowOverdraft
                                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30'
                                : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            }`}>
                              {allowOverdraft ? 'Grant 0 pts' : `-${ptsRequired.toLocaleString()} Pts`}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                );
              })()}

              {/* Custom Message / Reference Note */}
              <div>
                <label className="block text-xs font-semibold t-text-primary mb-1">
                  Custom Transaction Reference / SMS Note (Optional)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. ISP RVM Recycling Champion Incentive Payout"
                  value={voucherNote}
                  onChange={(e) => setVoucherNote(e.target.value)}
                  className="w-full t-bg-sec border t-border t-text-primary text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

            </div>

            {/* Modal Footer */}
            {(() => {
              const userPts = Number(selectedChampion?.availablePoints ?? selectedChampion?.points_balance ?? selectedChampion?.totalPoints ?? 0);
              const finalAmt = isCustomAmount ? (parseInt(customAmountInput) || 0) : (parseInt(voucherAmount) || 0);
              const ptsRequired = finalAmt * 5;
              const isBlocked = (!allowOverdraft && ptsRequired > userPts) || finalAmt < 50;

              return (
                <div className="flex items-center justify-between pt-3 border-t t-border shrink-0">
                  <button 
                    onClick={() => setIsVoucherModalOpen(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  
                  <button 
                    onClick={handleDispatchVoucher}
                    disabled={isSubmittingVoucher || isBlocked}
                    className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-extrabold shadow-md ${
                      isBlocked
                        ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed border t-border'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-600/30'
                    }`}
                  >
                    {isSubmittingVoucher ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing Gateway Transfer...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-3.5 h-3.5" />
                        <span>
                          {isBlocked && !allowOverdraft && ptsRequired > userPts
                            ? `Insufficient Balance (Needs ${ptsRequired.toLocaleString()} pts)`
                            : `Dispatch PKR ${finalAmt.toLocaleString()} via ${PAYOUT_METHODS.find(m => m.id === payoutMethod)?.name || 'Wallet'}`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              );
            })()}

          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* 8. MODAL: BROADCAST MOTIVATION NOTIFICATION               */}
      {/* ======================================================== */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border t-border transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold t-text-primary text-base">Broadcast Notification</h3>
                  <p className="text-[11px] t-text-muted">Push &amp; SMS Campaign Announcement</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="block text-xs font-semibold t-text-primary mb-1">Target Audience</label>
                <select 
                  value={broadcastAudience}
                  onChange={(e) => setBroadcastAudience(e.target.value)}
                  className="w-full t-bg-sec border t-border t-text-primary text-xs rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Top 10 Recyclers">Top 10 Green Champions</option>
                  <option value="All Active Kiosk Users">All Active Kiosk Citizens</option>
                  <option value="PecoDrop Corporate Campus Employees">PecoDrop Corporate Campus Employees</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold t-text-primary mb-1">Broadcast Message</label>
                <textarea 
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full t-bg-sec border t-border t-text-primary text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcastMessage('🎉 Double Points Weekend! Drop your PET bottles and beverage cans at any ISP Smart RVM for 2x reward points.')}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Use Double Points Template
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs font-semibold pt-3 border-t t-border">
              <button 
                onClick={() => setIsBroadcastModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDispatchBroadcast}
                disabled={isSubmittingBroadcast}
                className="px-4 py-2 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 active:scale-95 text-white rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                {isSubmittingBroadcast ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Dispatch Broadcast
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. FLOATING TOAST NOTIFICATION                            */}
      {/* ======================================================== */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-medium border border-slate-700/60 animate-bounce-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}

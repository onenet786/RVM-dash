import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Users, UserCheck, Trophy, Recycle, RefreshCw, Search, 
  CheckCircle2, Clock, Calendar, Mail, Phone, Shield, Sparkles, Filter, 
  Activity, X, ChevronRight, Hash, Award, Gift, Ticket, Copy, Check
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
    totalRedeemed: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'online', 'offline'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [userRedemptions, setUserRedemptions] = useState([]);
  const [activeModalTab, setActiveModalTab] = useState('recycling'); // 'recycling' | 'redemptions'
  const [copiedVoucher, setCopiedVoucher] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchMobileUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/mobile-users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch mobile users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMobileUsers();
    const interval = setInterval(fetchMobileUsers, 15000); // Polling every 15s for live online status
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
      setTimeout(() => setCopiedVoucher(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      (u.username && u.username.toLowerCase().includes(query)) ||
      (u.fullName && u.fullName.toLowerCase().includes(query)) ||
      (u.mobile && u.mobile.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.nic && u.nic.toLowerCase().includes(query));

    if (statusFilter === 'online') return matchesQuery && u.isOnline;
    if (statusFilter === 'offline') return matchesQuery && !u.isOnline;
    return matchesQuery;
  });

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
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Citizen Mobile Ecosystem</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">Mobile App Citizens & Active Logins</h2>
          <p className="text-xs t-text-secondary mt-1">
            Real-time monitoring of registered mobile app users, online activity status, reward balances, and voucher redemptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>{stats.onlineNow} Online Now</span>
          </div>

          <button
            onClick={fetchMobileUsers}
            disabled={loading}
            className="p-2.5 t-text-secondary hover:t-text-primary t-bg-sec border t-border rounded-xl transition-all flex items-center gap-2 text-xs font-semibold"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Registered Users */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider t-text-muted">Total Citizens</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold t-text-primary mono">{stats.totalUsers}</div>
            <div className="text-[11px] t-text-muted mt-0.5">Registered mobile accounts</div>
          </div>
        </div>

        {/* Currently Online / Logged In */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Active Logins</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 mono flex items-center gap-2">
              {stats.onlineNow}
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                {stats.totalUsers > 0 ? Math.round((stats.onlineNow / stats.totalUsers) * 100) : 0}% active
              </span>
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-0.5">Currently using mobile app</div>
          </div>
        </div>

        {/* Total Points Balance In Circulation */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider t-text-muted">In Circulation</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold text-amber-400 mono">{(stats.totalPoints || 0).toLocaleString()}</div>
            <div className="text-[11px] t-text-muted mt-0.5">Active citizen points held</div>
          </div>
        </div>

        {/* Total Redeemed Points Card */}
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Points Redeemed</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Gift className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold text-purple-400 mono">{(stats.totalRedeemed || 0).toLocaleString()}</div>
            <div className="text-[11px] text-purple-400/80 mt-0.5">Voucher & reward claims</div>
          </div>
        </div>

        {/* Materials Recycled by Citizens */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider t-text-muted">Recycled Items</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Recycle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold text-cyan-400 mono">
              {((stats.totalBottles || 0) + (stats.totalCups || 0) + (stats.totalTetra || 0) + (stats.totalPaper || 0) + (stats.totalGlass || 0)).toLocaleString()}
            </div>
            <div className="text-[11px] t-text-muted mt-0.5 flex flex-wrap items-center gap-1">
              <span>{stats.totalBottles || 0} 🍾</span>
              <span>•</span>
              <span>{stats.totalCups || 0} 🥫 (UBC)</span>
              {(stats.totalTetra > 0) && <span>• {stats.totalTetra} 🧃</span>}
              {(stats.totalPaper > 0) && <span>• {stats.totalPaper} 📄</span>}
              {(stats.totalGlass > 0) && <span>• {stats.totalGlass} 🍶</span>}
            </div>
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 t-text-muted" />
          <input
            type="text"
            placeholder="Search by mobile number, username, full name, or NIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs t-bg-sec border t-border rounded-xl t-text-primary focus:outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 t-text-muted hover:t-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 t-bg-sec rounded-xl border t-border self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all' 
                ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                : 't-text-secondary hover:t-text-primary'
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter('online')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'online' 
                ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                : 't-text-secondary hover:t-text-primary'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Online ({stats.onlineNow})
          </button>
          <button
            onClick={() => setStatusFilter('offline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'offline' 
                ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                : 't-text-secondary hover:t-text-primary'
            }`}
          >
            Offline ({Math.max(0, users.length - stats.onlineNow)})
          </button>
        </div>

      </div>

      {/* Citizens Data Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold t-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Citizens Directory & Live Status
          </h3>
          <span className="text-xs t-text-muted">
            Showing {filteredUsers.length} of {users.length} users
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b t-border t-text-muted uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Citizen Profile</th>
                <th className="py-3 px-4">Mobile / Contact</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Points Balance</th>
                <th className="py-3 px-4 text-center">Recycled Items</th>
                <th className="py-3 px-4 text-center">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center t-text-muted">
                    <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                    <p className="font-semibold">No mobile app users found matching query</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userRedeemed = user.totalRedeemedPoints || user.redeemedPoints || 0;
                  return (
                    <tr key={user.id} className="hover:t-bg-hover transition-colors">
                      
                      {/* Citizen Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm ${
                            user.profileImage === 'female' || user.gender === 'female' 
                              ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {user.profileImage === 'leaf' ? '🌿' :
                             user.profileImage === 'earth' ? '🌍' :
                             user.profileImage === 'recycle' ? '♻️' :
                             user.profileImage === 'star' ? '⭐' :
                             (user.fullName || user.username ? (user.fullName || user.username).charAt(0).toUpperCase() : 'U')}
                          </div>
                          <div>
                            <div className="font-bold t-text-primary text-sm flex items-center gap-1.5">
                              {user.fullName || user.username}
                              {user.isBirthday && (
                                <span title="Happy Birthday! 🎂" className="cursor-default">🎂</span>
                              )}
                              {user.isOnline && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title="Online Now"></span>
                              )}
                            </div>
                            <div className="text-[11px] t-text-muted mono">
                              @{user.username} {user.dob ? `• DOB: ${user.dob}` : ''} {user.nic && user.nic !== '-' ? `• NIC: ${user.nic}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mobile / Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold mono text-emerald-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-400/70" />
                            {user.mobile}
                          </div>
                          {user.email && !user.email.endsWith('@rvm.local') && (
                            <div className="text-[11px] t-text-muted flex items-center gap-1 truncate max-w-[180px]">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Live Online Status */}
                      <td className="py-3.5 px-4 text-center">
                        {user.isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Online Now
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold t-bg-sec t-text-muted border t-border">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(user.lastActive)}
                          </span>
                        )}
                      </td>

                      {/* Points Balance & Redemptions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-extrabold text-sm mono text-amber-400 flex items-center justify-end gap-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          {(user.points || 0).toLocaleString()} pts
                        </div>
                        <div className="text-[10px] mt-0.5 font-semibold flex items-center justify-end">
                          {userRedeemed > 0 ? (
                            <span className="text-purple-400 mono inline-flex items-center gap-1" title="Reward points redeemed">
                              <Ticket className="w-2.5 h-2.5" />
                              {userRedeemed.toLocaleString()} redeemed
                            </span>
                          ) : (
                            <span className="t-text-muted mono">0 redeemed</span>
                          )}
                        </div>
                      </td>

                      {/* Recycled Items */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="space-y-0.5">
                          <div className="font-bold mono text-cyan-400">
                            {(user.bottles || 0) + (user.cups || 0) + (user.tetra || 0) + (user.paper || 0) + (user.glass || 0)} total
                          </div>
                          <div className="text-[10px] t-text-muted flex items-center justify-center gap-1.5 flex-wrap">
                            <span title="Plastic Bottles">{user.bottles || 0} 🍾</span>
                            <span>•</span>
                            <span title="UBC / Aluminium Cans">{user.cups || 0} 🥫 (UBC)</span>
                            {((user.tetra || 0) > 0 || (user.tetraGrams || 0) > 0) && (
                              <>
                                <span>•</span>
                                <span className="text-orange-400 font-semibold" title="Tetra Pak">{user.tetra || Math.round((user.tetraGrams || 0)/25)} 🧃</span>
                              </>
                            )}
                            {((user.paper || 0) > 0 || (user.paperGrams || 0) > 0) && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-400 font-semibold" title="Paper / Cardboard">{user.paper || Math.round((user.paperGrams || 0)/50)} 📄</span>
                              </>
                            )}
                            {(user.glass || 0) > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-teal-400 font-semibold" title="Glass">{user.glass} 🍶</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Last Active Timestamp */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="text-xs font-medium t-text-secondary">
                          {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                        </div>
                        <div className="text-[10px] t-text-muted mono">
                          {user.lastActive ? new Date(user.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openUserHistory(user)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1 ml-auto"
                        >
                          <span>History</span>
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

      {/* User History & Redemption Breakdown Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-4xl rounded-3xl p-6 border t-border space-y-6 max-h-[85vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b t-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-base">
                  {selectedUser.username ? selectedUser.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold t-text-primary flex items-center gap-2">
                    {selectedUser.fullName || selectedUser.username}
                    {selectedUser.isOnline && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        Online Now
                      </span>
                    )}
                  </h3>
                  <p className="text-xs t-text-muted mono">
                    Mobile: {selectedUser.mobile} • Member ID: {selectedUser.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 t-text-muted hover:t-text-primary rounded-xl t-bg-sec border t-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics: Wallet Balance, Redeemed Points, Lifetime Earned & Materials */}
            {(() => {
              const histBottles = userHistory.reduce((acc, s) => acc + parseInt(s.plastic_count || s.bottles || s.plasticCount || 0), 0) || selectedUser.bottles || 0;
              const histCans = userHistory.reduce((acc, s) => acc + parseInt(s.aluminium_count || s.cups || s.cans || s.aluminiumCount || 0), 0) || selectedUser.cups || 0;
              const histTetra = userHistory.reduce((acc, s) => {
                const cnt = parseInt(s.tetrapak_count || s.tetra_count || s.tetraCount || 0);
                const g = parseInt(s.tetrapak_weight_grams || s.tetrapakWeightGrams || 0);
                return acc + (cnt > 0 ? cnt : (g > 0 ? Math.max(1, Math.round(g / 25)) : (s.item_variant && s.item_variant.toLowerCase().includes('tetra') ? 1 : 0)));
              }, 0) || selectedUser.tetra || 0;
              const histPaper = userHistory.reduce((acc, s) => {
                const cnt = parseInt(s.paper_cardboard_count || s.paper_count || s.paperCount || 0);
                const g = parseInt(s.paper_weight_grams || s.paperWeightGrams || 0);
                return acc + (cnt > 0 ? cnt : (g > 0 ? Math.max(1, Math.round(g / 50)) : (s.item_variant && s.item_variant.toLowerCase().includes('paper') ? 1 : 0)));
              }, 0) || selectedUser.paper || 0;
              const histGlass = userHistory.reduce((acc, s) => acc + parseInt(s.glass_count || s.glassCount || s.glass || 0), 0) || selectedUser.glass || 0;

              const totalRedeemedForUser = selectedUser.totalRedeemedPoints ?? (
                userRedemptions.length > 0 
                  ? userRedemptions.reduce((acc, r) => acc + (parseInt(r.points_redeemed) || 0), 0)
                  : (selectedUser.redeemedPoints || 0)
              );
              const currentBalance = selectedUser.points || 0;
              const lifetimeEarned = currentBalance + totalRedeemedForUser;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {/* Current Balance */}
                  <div className="p-3 rounded-2xl t-bg-sec border border-amber-500/30 bg-amber-500/5 text-center">
                    <div className="text-[11px] text-amber-400 font-semibold flex items-center justify-center gap-1">
                      <Trophy className="w-3 h-3" />
                      Points Balance
                    </div>
                    <div className="text-lg font-extrabold text-amber-400 mono mt-1">
                      {currentBalance.toLocaleString()} pts
                    </div>
                  </div>

                  {/* Redeemed Points */}
                  <div className="p-3 rounded-2xl t-bg-sec border border-purple-500/30 bg-purple-500/5 text-center">
                    <div className="text-[11px] text-purple-400 font-semibold flex items-center justify-center gap-1">
                      <Gift className="w-3 h-3" />
                      Redeemed
                    </div>
                    <div className="text-lg font-extrabold text-purple-400 mono mt-1">
                      {totalRedeemedForUser.toLocaleString()} pts
                    </div>
                  </div>

                  {/* Lifetime Earned */}
                  <div className="p-3 rounded-2xl t-bg-sec border border-emerald-500/30 bg-emerald-500/5 text-center">
                    <div className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Lifetime Earned
                    </div>
                    <div className="text-lg font-extrabold text-emerald-400 mono mt-1">
                      {lifetimeEarned.toLocaleString()} pts
                    </div>
                  </div>

                  {/* Bottles */}
                  <div className="p-3 rounded-2xl t-bg-sec border t-border text-center">
                    <div className="text-[11px] t-text-muted font-semibold">Bottles 🍾</div>
                    <div className="text-lg font-extrabold text-emerald-400 mono mt-1">
                      {histBottles.toLocaleString()}
                    </div>
                  </div>

                  {/* UBC / Cans */}
                  <div className="p-3 rounded-2xl t-bg-sec border t-border text-center">
                    <div className="text-[11px] t-text-muted font-semibold">UBC / Cans 🥫</div>
                    <div className="text-lg font-extrabold text-cyan-400 mono mt-1">
                      {histCans.toLocaleString()}
                    </div>
                  </div>

                  {/* Other Materials */}
                  <div className="p-3 rounded-2xl t-bg-sec border t-border text-center">
                    <div className="text-[11px] t-text-muted font-semibold">Other Recycled</div>
                    <div className="text-xs font-bold mono mt-1 text-slate-300 space-x-1">
                      <span className="text-orange-400" title="Tetra Pak">{histTetra}🧃</span>
                      <span className="text-indigo-400" title="Paper">{histPaper}📄</span>
                      <span className="text-teal-400" title="Glass">{histGlass}🍶</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Tab Switcher: Recycling Sessions vs Redemption & Voucher History */}
            <div className="flex items-center gap-2 border-b t-border pb-2">
              <button
                onClick={() => setActiveModalTab('recycling')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeModalTab === 'recycling'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 't-text-secondary hover:t-text-primary t-bg-sec border t-border'
                }`}
              >
                <Recycle className="w-4 h-4" />
                <span>Recycling Sessions</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold mono">
                  {userHistory.length}
                </span>
              </button>

              <button
                onClick={() => setActiveModalTab('redemptions')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeModalTab === 'redemptions'
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-sm'
                    : 't-text-secondary hover:t-text-primary t-bg-sec border t-border'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>Redemption & Voucher History</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-bold mono">
                  {userRedemptions.length}
                </span>
              </button>
            </div>

            {/* Tab 1: Recycling History Table */}
            {activeModalTab === 'recycling' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Recycle className="w-3.5 h-3.5" />
                    Recycling Session Records
                  </h4>
                  <span className="text-[11px] t-text-muted">
                    {userHistory.length} total sessions recorded
                  </span>
                </div>

                {loadingHistory ? (
                  <div className="py-12 flex flex-col items-center justify-center text-xs t-text-muted gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                    <span>Loading user sessions...</span>
                  </div>
                ) : userHistory.length === 0 ? (
                  <div className="py-12 text-center text-xs t-bg-sec rounded-2xl border t-border p-6 space-y-2">
                    <Recycle className="w-8 h-8 mx-auto text-emerald-400/40" />
                    <p className="font-bold t-text-primary text-sm">No Recycling Sessions Recorded</p>
                    <p className="t-text-muted">This citizen has not completed any reverse vending machine deposits yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border t-border rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b t-border t-bg-sec t-text-muted uppercase tracking-wider text-[10px] font-bold">
                          <th className="py-2.5 px-3">Session ID</th>
                          <th className="py-2.5 px-3">Machine</th>
                          <th className="py-2.5 px-3 text-center">Bottles 🍾</th>
                          <th className="py-2.5 px-3 text-center">UBC / Cans 🥫</th>
                          <th className="py-2.5 px-3 text-center">Tetra Pak 🧃</th>
                          <th className="py-2.5 px-3 text-center">Paper 📄</th>
                          <th className="py-2.5 px-3 text-center">Glass 🍶</th>
                          <th className="py-2.5 px-3 text-right">Points ⭐</th>
                          <th className="py-2.5 px-3 text-right">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y t-border">
                        {userHistory.map((s, idx) => (
                          <tr key={s.session_id || idx} className="hover:t-bg-hover">
                            <td className="py-2.5 px-3 mono text-[11px] t-text-primary">
                              <div>{(s.session_id || `SES-${idx}`).substring(0, 10)}...</div>
                              {s.item_variant && (
                                <div className="text-[9px] t-text-muted font-normal truncate max-w-[120px]">{s.item_variant}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 mono text-[11px] text-cyan-400 font-semibold">
                              {s.machine_id || 'RVM-01'}
                            </td>
                            <td className="py-2.5 px-3 text-center mono font-bold text-emerald-400">
                              {s.plastic_count || s.bottles || s.plasticCount || 0}
                            </td>
                            <td className="py-2.5 px-3 text-center mono font-bold text-cyan-400">
                              {s.aluminium_count || s.cups || s.cans || s.aluminiumCount || 0}
                            </td>
                            <td className="py-2.5 px-3 text-center mono font-bold text-orange-400">
                              {s.tetrapak_count || s.tetra_count || s.tetraCount || (s.tetrapak_weight_grams > 0 ? `${s.tetrapak_weight_grams}g` : (s.item_variant && s.item_variant.toLowerCase().includes('tetra') ? '1' : 0))}
                            </td>
                            <td className="py-2.5 px-3 text-center mono font-bold text-indigo-400">
                              {s.paper_cardboard_count || s.paper_count || s.paperCount || (s.paper_weight_grams > 0 ? `${s.paper_weight_grams}g` : (s.item_variant && s.item_variant.toLowerCase().includes('paper') ? '1' : 0))}
                            </td>
                            <td className="py-2.5 px-3 text-center mono font-bold text-teal-400">
                              {s.glass_count || s.glassCount || s.glass || 0}
                            </td>
                            <td className="py-2.5 px-3 text-right mono font-extrabold text-amber-400">
                              +{s.points_earned || s.points || 0}
                            </td>
                            <td className="py-2.5 px-3 text-right text-[11px] t-text-muted">
                              {s.created_at || s.recycledAt ? new Date(s.created_at || s.recycledAt).toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Redemption & Voucher History Table */}
            {activeModalTab === 'redemptions' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" />
                    Voucher Claims & Points Redemption History
                  </h4>
                  <span className="text-[11px] t-text-muted">
                    {userRedemptions.length} redemptions recorded
                  </span>
                </div>

                {loadingHistory ? (
                  <div className="py-12 flex flex-col items-center justify-center text-xs t-text-muted gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                    <span>Loading redemption records...</span>
                  </div>
                ) : userRedemptions.length === 0 ? (
                  <div className="py-12 text-center text-xs t-bg-sec rounded-2xl border t-border p-6 space-y-2">
                    <Gift className="w-8 h-8 mx-auto text-purple-400/40" />
                    <p className="font-bold t-text-primary text-sm">No Reward Redemptions Yet</p>
                    <p className="t-text-muted max-w-md mx-auto">
                      This citizen has not spent or redeemed points for vouchers yet. 
                      All earned rewards (<span className="text-amber-400 font-bold mono">{(selectedUser.points || 0).toLocaleString()} pts</span>) remain 100% active in their balance.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border t-border rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b t-border t-bg-sec t-text-muted uppercase tracking-wider text-[10px] font-bold">
                          <th className="py-2.5 px-3">Redemption ID</th>
                          <th className="py-2.5 px-3">Reward / Voucher</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-right">Points Spent</th>
                          <th className="py-2.5 px-3 text-center">Voucher Code</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Redeemed At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y t-border">
                        {userRedemptions.map((r, idx) => (
                          <tr key={r.redemption_id || r.id || idx} className="hover:t-bg-hover">
                            <td className="py-2.5 px-3 mono text-[11px] t-text-primary">
                              {(r.redemption_id || `RED-${idx + 1}`).substring(0, 14)}
                            </td>
                            <td className="py-2.5 px-3 font-semibold t-text-primary">
                              <div className="flex items-center gap-1.5">
                                <Gift className="w-3.5 h-3.5 text-purple-400" />
                                <span>{r.item_name || 'Reward Voucher'}</span>
                              </div>
                              {r.note && <div className="text-[10px] t-text-muted font-normal mt-0.5">{r.note}</div>}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {r.category || 'Voucher'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right mono font-extrabold text-rose-400">
                              -{parseInt(r.points_redeemed || 0).toLocaleString()} pts
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {r.voucher_code ? (
                                <button
                                  onClick={() => copyToClipboard(r.voucher_code)}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-purple-500/30 text-purple-300 mono text-[11px] font-bold transition-all"
                                  title="Click to copy voucher code"
                                >
                                  <span>{r.voucher_code}</span>
                                  {copiedVoucher === r.voucher_code ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-purple-400/70" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-muted mono text-[10px]">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (r.status || 'claimed').toLowerCase() === 'claimed' || (r.status || '').toLowerCase() === 'completed'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              }`}>
                                {(r.status || 'CLAIMED').toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-[11px] t-text-muted">
                              {r.created_at ? new Date(r.created_at).toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-2 border-t t-border">
              <div className="text-[11px] t-text-muted flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified citizen database record</span>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

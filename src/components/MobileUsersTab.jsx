import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Users, UserCheck, Trophy, Recycle, RefreshCw, Search, 
  CheckCircle2, Clock, Calendar, Mail, Phone, Shield, Sparkles, Filter, 
  Activity, X, ChevronRight, Hash, Award
} from 'lucide-react';

export default function MobileUsersTab() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineNow: 0,
    totalPoints: 0,
    totalBottles: 0,
    totalCups: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'online', 'offline'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
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
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/getrecycle/${encodeURIComponent(user.id || user.mobile || user.username)}`);
      if (res.ok) {
        const data = await res.json();
        setUserHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
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
            Real-time monitoring of registered mobile app users, online activity status, and reward balances.
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
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

        {/* Total Points Balance */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider t-text-muted">Points In Circulation</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold text-amber-400 mono">{stats.totalPoints.toLocaleString()}</div>
            <div className="text-[11px] t-text-muted mt-0.5">Cumulative citizen reward pts</div>
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
              {(stats.totalBottles + stats.totalCups).toLocaleString()}
            </div>
            <div className="text-[11px] t-text-muted mt-0.5">
              {stats.totalBottles} bottles • {stats.totalCups} cans
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
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:t-bg-hover transition-colors">
                    
                    {/* Citizen Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm ${
                          user.gender === 'female' 
                            ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold t-text-primary text-sm flex items-center gap-1.5">
                            {user.fullName || user.username}
                            {user.isOnline && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title="Online Now"></span>
                            )}
                          </div>
                          <div className="text-[11px] t-text-muted mono">
                            @{user.username} {user.nic && user.nic !== '-' ? `• NIC: ${user.nic}` : ''}
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

                    {/* Points Balance */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-extrabold text-sm mono text-amber-400 flex items-center justify-end gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        {user.points.toLocaleString()} pts
                      </div>
                    </td>

                    {/* Recycled Items */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="space-y-0.5">
                        <div className="font-bold mono text-cyan-400">
                          {user.bottles + user.cups} total
                        </div>
                        <div className="text-[10px] t-text-muted">
                          {user.bottles} 🍾 • {user.cups} 🥫
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User History Breakdown Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border t-border space-y-6 max-h-[85vh] overflow-y-auto">
            
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

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl t-bg-sec border t-border text-center">
                <div className="text-xs t-text-muted font-semibold">Points Balance</div>
                <div className="text-xl font-extrabold text-amber-400 mono mt-1">
                  {selectedUser.points} pts
                </div>
              </div>
              <div className="p-3.5 rounded-2xl t-bg-sec border t-border text-center">
                <div className="text-xs t-text-muted font-semibold">Total Bottles</div>
                <div className="text-xl font-extrabold text-emerald-400 mono mt-1">
                  {selectedUser.bottles}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl t-bg-sec border t-border text-center">
                <div className="text-xs t-text-muted font-semibold">Total Cans</div>
                <div className="text-xl font-extrabold text-cyan-400 mono mt-1">
                  {selectedUser.cups}
                </div>
              </div>
            </div>

            {/* Recycling History Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Recycle className="w-3.5 h-3.5" />
                Recent Recycling Sessions
              </h4>

              {loadingHistory ? (
                <div className="py-12 flex flex-col items-center justify-center text-xs t-text-muted gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <span>Loading user sessions...</span>
                </div>
              ) : userHistory.length === 0 ? (
                <div className="py-8 text-center text-xs t-text-muted bg-slate-900/30 rounded-2xl border t-border">
                  No recycling transactions recorded for this citizen yet.
                </div>
              ) : (
                <div className="overflow-x-auto border t-border rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b t-border t-bg-sec t-text-muted uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-2.5 px-3">Session ID</th>
                        <th className="py-2.5 px-3">Machine</th>
                        <th className="py-2.5 px-3 text-center">Bottles</th>
                        <th className="py-2.5 px-3 text-center">Cans</th>
                        <th className="py-2.5 px-3 text-right">Points</th>
                        <th className="py-2.5 px-3 text-right">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y t-border">
                      {userHistory.map((s, idx) => (
                        <tr key={s.session_id || idx} className="hover:t-bg-hover">
                          <td className="py-2.5 px-3 mono text-[11px] t-text-primary">
                            {(s.session_id || `SES-${idx}`).substring(0, 10)}...
                          </td>
                          <td className="py-2.5 px-3 mono text-[11px] text-cyan-400">
                            {s.machine_id || 'RVM-01'}
                          </td>
                          <td className="py-2.5 px-3 text-center mono font-bold text-emerald-400">
                            {s.plastic_count || s.bottles || 0}
                          </td>
                          <td className="py-2.5 px-3 text-center mono font-bold text-amber-400">
                            {s.aluminium_count || s.cups || 0}
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

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
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

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Cpu, ShieldCheck, CheckCircle2, AlertTriangle, 
  RefreshCw, Trash2, Edit3, Check, X, Lock, Building2, Search, 
  Sparkles, Layers, Sliders, ArrowUpRight, Smartphone, Eye, EyeOff
} from 'lucide-react';

export default function SubUsersTab({ currentUser }) {
  const [subUsers, setSubUsers] = useState([]);
  const [availableMachines, setAvailableMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState(null);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    assignedMachines: []
  });

  const isCorporateClient = currentUser?.roleId === 'client_admin' || currentUser?.isCorporateClient;
  const isSuperAdmin = currentUser?.roleId === 'super_admin' || currentUser?.username === 'onenet';
  const orgName = currentUser?.organization?.name || 'Corporate Organization';

  // Load Sub-users and available fleet machines
  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, mRes] = await Promise.all([
        fetch('/api/enterprise/sub-users'),
        fetch('/api/analytics/machines')
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        setSubUsers(uData.subUsers || []);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        // If corporate client, filter only to machines assigned to them
        let clientMachines = mData;
        if (isCorporateClient && Array.isArray(currentUser?.assignedMachines) && !currentUser.assignedMachines.includes('*')) {
          const allowed = currentUser.assignedMachines.map(m => String(m).toUpperCase());
          clientMachines = mData.filter(m => allowed.includes(String(m.machineId).toUpperCase()));
        }
        setAvailableMachines(clientMachines);
      }
    } catch (err) {
      console.error('[SubUsersTab] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setForm({
      username: '',
      fullName: '',
      email: '',
      password: '',
      // Default to first machine if available
      assignedMachines: availableMachines.length > 0 ? [availableMachines[0].machineId] : []
    });
    setShowPassword(false);
    setMessage(null);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      fullName: user.fullName || user.username,
      email: user.email || '',
      password: '',
      assignedMachines: Array.isArray(user.assignedMachines) ? [...user.assignedMachines] : []
    });
    setShowPassword(false);
    setMessage(null);
  };

  const handleToggleMachine = (mId) => {
    const cleanId = String(mId).toUpperCase();
    const current = [...form.assignedMachines];
    const idx = current.indexOf(cleanId);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(cleanId);
    }
    setForm({ ...form, assignedMachines: current });
  };

  const handleSelectAllMachines = () => {
    setForm({
      ...form,
      assignedMachines: availableMachines.map(m => m.machineId)
    });
  };

  const handleClearMachines = () => {
    setForm({
      ...form,
      assignedMachines: []
    });
  };

  const handleSaveSubUser = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.fullName.trim()) {
      setMessage({ type: 'error', text: 'Username and Full Name are required.' });
      return;
    }
    if (!editingUser && !form.password.trim()) {
      setMessage({ type: 'error', text: 'Password is required for new sub-user.' });
      return;
    }
    if (form.assignedMachines.length === 0) {
      setMessage({ type: 'error', text: 'Please delegate at least one machine to this sub-user.' });
      return;
    }

    try {
      setMessage(null);
      const url = editingUser 
        ? `/api/enterprise/sub-users/${editingUser.username}` 
        : '/api/enterprise/sub-users';
      const method = editingUser ? 'PUT' : 'POST';

      const payload = {
        username: form.username.trim().toLowerCase(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        assignedMachines: form.assignedMachines
      };
      if (form.password && form.password.trim()) {
        payload.password = form.password.trim();
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setMessage({ type: 'success', text: json.message });
        setShowCreateModal(false);
        setEditingUser(null);
        fetchData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save sub-user.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteSubUser = async (user) => {
    if (!window.confirm(`Are you sure you want to remove sub-user "${user.fullName || user.username}"? They will lose access to all delegated machines.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/enterprise/sub-users/${user.username}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: 'success', text: json.message });
        fetchData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to delete sub-user.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/enterprise/sub-users/${user.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: 'success', text: `Sub-user "${user.username}" status updated to ${newStatus}.` });
        fetchData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to update status.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filteredUsers = subUsers.filter(u => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (u.fullName || '').toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    const machinesMatch = (u.assignedMachines || []).some(m => m.toLowerCase().includes(q));
    return nameMatch || emailMatch || machinesMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              {orgName} • Machine Delegation Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Organization Sub-Users & Fleet Scoping
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Create dedicated branch managers, shift operators, and site supervisors. Each sub-user is strictly limited to their assigned RVM & PecoDrop kiosks, ensuring localized telemetry and secure data scoping.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Create New Sub-User
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition-all flex items-center justify-center"
              title="Refresh List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Fleet KPI Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Total Sub-Users</div>
            <div className="text-2xl font-black text-white mt-1">{subUsers.length}</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Active Operators</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {subUsers.filter(u => u.status === 'active').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Authorized Kiosks</div>
            <div className="text-2xl font-black text-teal-300 mt-1">
              {availableMachines.length}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-slate-400 font-medium">Access Control</div>
            <div className="text-xs font-bold text-amber-300 mt-2 inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Hardware Isolated
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notifications */}
      {message && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sub-users, emails, or assigned machines..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-slate-100 shadow-sm"
          />
        </div>
        <div className="text-xs font-bold text-slate-400 shrink-0">
          Showing {filteredUsers.length} of {subUsers.length} team members
        </div>
      </div>

      {/* Sub-Users List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-emerald-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading authorized sub-users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">No Sub-Users Found</h3>
              <p className="text-xs text-slate-500">
                {searchQuery ? 'No members match your search criteria.' : 'Create sub-users to delegate branch operations and machine monitoring.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md hover:bg-emerald-600 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add First Sub-User
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Assigned RVMs / PecoDrops</th>
                  <th className="px-6 py-4">Role & Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredUsers.map((user) => {
                  const assigned = user.assignedMachines || [];
                  return (
                    <tr key={user.username} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Name & Username */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black flex items-center justify-center shrink-0 shadow-sm">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                              {user.fullName || user.username}
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                @{user.username}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{user.email || 'No email registered'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Machine Delegation Badges */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {assigned.length === 0 ? (
                            <span className="text-xs text-amber-500 italic">No machines assigned</span>
                          ) : (
                            assigned.map((mId) => {
                              const isPeco = mId.toUpperCase().includes('PECO');
                              return (
                                <span
                                  key={mId}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                                    isPeco
                                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  }`}
                                >
                                  <Cpu className="w-3 h-3" />
                                  {mId}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            user.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {user.status === 'active' ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-slate-200 dark:border-slate-700"
                            title="Edit Delegated Machines & Credentials"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-2 rounded-xl transition-all border ${
                              user.status === 'active'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                            title={user.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubUser(user)}
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                            title="Delete Sub-User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Sub-User Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  {editingUser ? 'Edit Machine Delegation' : 'New Sub-User Registration'}
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {editingUser ? `Configure @${editingUser.username}` : 'Create Sub-User & Assign Machines'}
                </h2>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setEditingUser(null); }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubUser} className="space-y-6">
              {/* Basic Info Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Full Name / Designation
                  </label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="e.g. Ahmed Khan - Lahore Site Operator"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Username (Login ID)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '') })}
                    placeholder="e.g. ahmed_lahore"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500/50 focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. ahmed.khan@company.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    {editingUser ? 'Reset Password (Leave blank to keep)' : 'Login Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={editingUser ? 'Enter new password...' : 'Secure password'}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Machine Assignment Multi-select Section */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                      Delegate Authorized Kiosks
                    </label>
                    <p className="text-xs text-slate-500">
                      Select which RVM and PecoDrop units this sub-user is authorized to manage and monitor.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllMachines}
                      className="text-[11px] font-bold text-emerald-500 hover:underline px-2 py-1 rounded-md"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={handleClearMachines}
                      className="text-[11px] font-bold text-slate-400 hover:underline px-2 py-1 rounded-md"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {availableMachines.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    No fleet machines are currently assigned to your organization. Please contact the administrator.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1">
                    {availableMachines.map((machine) => {
                      const isSelected = form.assignedMachines.includes(machine.machineId.toUpperCase());
                      const isPeco = machine.machineType === 'PECODROP' || machine.machineId.includes('PECO');

                      return (
                        <div
                          key={machine.machineId}
                          onClick={() => handleToggleMachine(machine.machineId)}
                          className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-400 hover:border-slate-400'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-400 dark:border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                {machine.machineId}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                isPeco ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                              }`}>
                                {isPeco ? '⭕ PecoDrop' : '🥫 RVM'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {machine.name || 'Smart Recycling Station'}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              📍 {machine.location || 'Site Location'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingUser(null); }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all"
                >
                  {editingUser ? 'Save Machine Delegation' : 'Register Sub-User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

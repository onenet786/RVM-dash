import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, UserPlus, Users, KeyRound, Cpu, Eye, Lock, 
  CheckCircle2, AlertTriangle, RefreshCw, Trash2, Edit3, Check, X, ShieldAlert, Key, Plus
} from 'lucide-react';

export default function SecurityTab() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [availableMachines, setAvailableMachines] = useState(['RVM-001', 'RVM-002', 'RVM-PK-01', 'RVM-PK-02', 'RVM-KHI-01']);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // User object being edited
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' | 'rbac'
  const [message, setMessage] = useState(null);

  // New User Form State
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    email: '',
    roleId: 'fleet_operator',
    assignedMachines: ['*'],
    password: ''
  });

  // Edit User Form State
  const [editForm, setEditForm] = useState({
    username: '',
    fullName: '',
    email: '',
    roleId: 'fleet_operator',
    assignedMachines: ['*'],
    status: 'active',
    newPassword: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, rRes, mRes] = await Promise.all([
        fetch('/api/security/users'),
        fetch('/api/security/roles'),
        fetch('/api/analytics/machines')
      ]);

      if (uRes.ok) setUsers(await uRes.json());
      if (rRes.ok) setRoles(await rRes.json());
      if (mRes.ok) {
        const mData = await mRes.json();
        const dbM = mData.map(m => m.machineId).filter(Boolean);
        const combined = Array.from(new Set(['RVM-001', 'RVM-002', 'RVM-PK-01', 'RVM-PK-02', 'RVM-KHI-01', ...dbM]));
        setAvailableMachines(combined);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Machine Multi-select Helper Functions for New & Edit forms
  const handleAddMachine = (machineId, isEdit = false) => {
    if (!machineId) return;
    if (isEdit) {
      let current = Array.isArray(editForm.assignedMachines) ? [...editForm.assignedMachines] : [editForm.assignedMachines];
      if (machineId === '*') {
        current = ['*'];
      } else {
        current = current.filter(m => m !== '*');
        if (!current.includes(machineId)) current.push(machineId);
      }
      setEditForm({ ...editForm, assignedMachines: current });
    } else {
      let current = Array.isArray(newUser.assignedMachines) ? [...newUser.assignedMachines] : [newUser.assignedMachines];
      if (machineId === '*') {
        current = ['*'];
      } else {
        current = current.filter(m => m !== '*');
        if (!current.includes(machineId)) current.push(machineId);
      }
      setNewUser({ ...newUser, assignedMachines: current });
    }
  };

  const handleRemoveMachine = (machineId, isEdit = false) => {
    if (isEdit) {
      let current = Array.isArray(editForm.assignedMachines) ? [...editForm.assignedMachines] : [editForm.assignedMachines];
      current = current.filter(m => m !== machineId);
      if (current.length === 0) current = ['*'];
      setEditForm({ ...editForm, assignedMachines: current });
    } else {
      let current = Array.isArray(newUser.assignedMachines) ? [...newUser.assignedMachines] : [newUser.assignedMachines];
      current = current.filter(m => m !== machineId);
      if (current.length === 0) current = ['*'];
      setNewUser({ ...newUser, assignedMachines: current });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setMessage(null);
      const res = await fetch('/api/security/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: 'success', text: json.message });
        setShowCreateModal(false);
        setNewUser({ username: '', fullName: '', email: '', roleId: 'fleet_operator', assignedMachines: ['*'], password: '' });
        fetchData();
      } else {
        throw new Error(json.error || 'Failed to create user account');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const startEditUser = (user) => {
    setEditingUser(user);
    const machinesArr = Array.isArray(user.assignedMachines) 
      ? user.assignedMachines 
      : (typeof user.assignedMachines === 'string' ? user.assignedMachines.split(',').map(s => s.trim()) : ['*']);

    setEditForm({
      username: user.username,
      fullName: user.fullName || user.username,
      email: user.email || '',
      roleId: user.roleId || 'fleet_operator',
      assignedMachines: machinesArr,
      status: user.status || 'active',
      newPassword: ''
    });
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setMessage(null);
      const payload = {
        fullName: editForm.fullName,
        email: editForm.email,
        roleId: editForm.roleId,
        assignedMachines: editForm.assignedMachines,
        status: editForm.status
      };

      if (editForm.newPassword && editForm.newPassword.trim()) {
        payload.password = editForm.newPassword.trim();
      }

      const res = await fetch(`/api/security/users/${editingUser.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ 
          type: 'success', 
          text: `User "${editingUser.username}" account information ${editForm.newPassword ? '& password ' : ''}updated successfully!` 
        });
        setEditingUser(null);
        fetchData();
      } else {
        throw new Error(json.error || 'Failed to update user account');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      const res = await fetch(`/api/security/users/${user.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: `User "${user.username}" is now ${newStatus}.` });
        fetchData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.username === 'onenet') {
      setMessage({ type: 'error', text: 'Cannot delete master developer account "onenet".' });
      return;
    }

    try {
      const res = await fetch(`/api/security/users/${user.username}`, {
        method: 'DELETE'
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: `User "${user.username}" removed.` });
        fetchData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const getRoleBadge = (roleId) => {
    const roleDoc = roles.find(r => r.roleId === roleId);
    const color = roleDoc?.color || 'emerald';
    const name = roleDoc?.name || roleId;

    const colorClasses = {
      emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${colorClasses[color] || colorClasses.emerald}`}>
        <ShieldCheck className="w-3.5 h-3.5" />
        {name}
      </span>
    );
  };

  const getRoleModulesPills = (roleId) => {
    const roleDoc = roles.find(r => r.roleId === roleId);
    if (!roleDoc || !roleDoc.modules) return <span className="t-text-muted text-xs">All Modules</span>;

    const moduleLabels = {
      overview: 'Overview',
      analytics: 'Analytics',
      machines: 'Fleet Health',
      feedbacks: 'Feedbacks',
      users: 'Users',
      db_switcher: 'DB Switcher',
      db_backup: 'DB Backup',
      security: 'Security'
    };

    return (
      <div className="flex flex-wrap gap-1">
        {roleDoc.modules.map(m => (
          <span key={m} className="px-2 py-0.5 text-[10px] font-semibold t-bg-sec border t-border rounded t-text-secondary uppercase">
            {moduleLabels[m] || m}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Enterprise Security & RBAC</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">User Accounts & Role Permissions</h2>
          <p className="text-xs t-text-secondary mt-1">Manage user info, passwords, role assignments, and RVM machine dropdown selector scope.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center t-bg-sec p-1 rounded-xl border t-border">
            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'users' ? 'bg-emerald-600 text-white shadow-md' : 't-text-muted hover:t-text-primary'
              }`}
            >
              User Accounts
            </button>
            <button
              onClick={() => setActiveSubTab('rbac')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'rbac' ? 'bg-emerald-600 text-white shadow-md' : 't-text-muted hover:t-text-primary'
              }`}
            >
              Role Access Matrix
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40"
          >
            <UserPlus className="w-4 h-4" />
            Create New User
          </button>
        </div>
      </div>

      {/* Alert Message Banner */}
      {message && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-2 font-bold">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="t-text-muted hover:t-text-primary font-bold">Dismiss</button>
        </div>
      )}

      {/* SubTab 1: User Accounts Directory */}
      {activeSubTab === 'users' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold t-text-primary flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Active System Accounts Directory ({users.length})
            </h3>
            <button onClick={fetchData} className="p-2 t-text-secondary hover:t-text-primary t-bg-sec border t-border rounded-xl">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b t-border t-text-muted uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">User Account</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Assigned RVM Machines Scope</th>
                  <th className="py-3 px-4">Accessible Modules</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y t-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center t-text-muted">Loading security directory...</td>
                  </tr>
                ) : users.map(u => (
                  <tr key={u.username} className="hover:t-bg-hover">
                    <td className="py-3 px-4">
                      <div className="font-bold t-text-primary text-xs">{u.fullName || u.username}</div>
                      <div className="text-[11px] t-text-muted mono">{u.email || `@${u.username}`}</div>
                    </td>

                    <td className="py-3 px-4">
                      {getRoleBadge(u.roleId)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(u.assignedMachines) && u.assignedMachines.includes('*') ? (
                          <span className="mono text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                            🌟 All RVM Fleet (*)
                          </span>
                        ) : (
                          (Array.isArray(u.assignedMachines) ? u.assignedMachines : [u.assignedMachines]).map(m => (
                            <span key={m} className="mono text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                              🤖 {m}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getRoleModulesPills(u.roleId)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                          u.status === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {u.status || 'active'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => startEditUser(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow"
                        title="Edit Info & Change Password"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Info
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u)}
                        disabled={u.username === 'onenet'}
                        className="p-1.5 t-bg-sec hover:bg-rose-600 hover:text-white t-text-secondary rounded-lg border t-border transition-all disabled:opacity-30"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 2: Role-Based Access Control (RBAC) Matrix */}
      {activeSubTab === 'rbac' && (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div>
            <h3 className="text-base font-bold t-text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Role Access Control & Module Permissions Matrix
            </h3>
            <p className="text-xs t-text-secondary mt-1">Granular feature visibility and administrative action rights per system role.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map(r => (
              <div key={r.roleId} className="p-5 rounded-2xl border t-border t-bg-sec space-y-3">
                <div className="flex items-center justify-between border-b t-border pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm t-text-primary">{r.name}</h4>
                    <p className="text-xs t-text-muted">{r.description}</p>
                  </div>
                  {getRoleBadge(r.roleId)}
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold t-text-muted">Module Visibility & Action Rights</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 t-bg-surface rounded-lg border t-border flex items-center justify-between">
                      <span className="t-text-secondary">View Dashboards</span>
                      {r.permissions?.view ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                    </div>

                    <div className="p-2 t-bg-surface rounded-lg border t-border flex items-center justify-between">
                      <span className="t-text-secondary">Edit Records</span>
                      {r.permissions?.edit ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                    </div>

                    <div className="p-2 t-bg-surface rounded-lg border t-border flex items-center justify-between">
                      <span className="t-text-secondary">Export Data</span>
                      {r.permissions?.export ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                    </div>

                    <div className="p-2 t-bg-surface rounded-lg border t-border flex items-center justify-between">
                      <span className="t-text-secondary">Switch DB Server</span>
                      {r.permissions?.switch_db ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold t-text-muted block mb-1">Allowed System Modules</span>
                  {getRoleModulesPills(r.roleId)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create New User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-lg w-full t-bg-surface border t-border rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b t-border pb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold t-text-primary">Create User & Assign Role</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="t-text-muted hover:t-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold t-text-muted uppercase block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold t-text-muted uppercase block mb-1">Username</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="e.g. operator_lahore"
                    className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-mono focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold t-text-muted uppercase block mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="tariq@rvm-dash.io"
                    className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold t-text-muted uppercase block mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Initial User Password"
                  className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold t-text-muted uppercase block mb-1">Assigned Role</label>
                <select
                  value={newUser.roleId}
                  onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                  className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-bold focus:border-emerald-500 focus:outline-none"
                >
                  {roles.map(r => (
                    <option key={r.roleId} value={r.roleId}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* RVM Machine Dropdown & Multi-Select Badge Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold t-text-muted uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    Assigned RVM Machines Scope
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddMachine('*', false)}
                    className="text-[10px] text-cyan-400 hover:underline font-bold"
                  >
                    Select All Fleet (*)
                  </button>
                </label>

                <select
                  onChange={(e) => {
                    handleAddMachine(e.target.value, false);
                    e.target.value = '';
                  }}
                  className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-bold focus:border-emerald-500 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>-- Dropdown Select RVM Machine to Add --</option>
                  <option value="*">🌟 All Fleet Machines (*)</option>
                  {availableMachines.map(mId => (
                    <option key={mId} value={mId}>🤖 {mId}</option>
                  ))}
                </select>

                {/* Selected Badges */}
                <div className="flex flex-wrap gap-1.5 p-2.5 t-bg-sec border t-border rounded-xl min-h-[42px] items-center">
                  {(newUser.assignedMachines || ['*']).map(mId => (
                    <span
                      key={mId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    >
                      <Cpu className="w-3 h-3" />
                      {mId === '*' ? 'All Fleet (*)' : mId}
                      <button
                        type="button"
                        onClick={() => handleRemoveMachine(mId, false)}
                        className="hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t t-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 t-bg-sec hover:t-bg-hover t-text-secondary font-bold rounded-xl border t-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Account Modal with RVM Machine Dropdown */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-lg w-full t-bg-surface border border-cyan-500/40 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b t-border pb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold t-text-primary">Edit User Info & Change Password</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="t-text-muted hover:t-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold t-text-muted uppercase block mb-1">Username (Fixed)</label>
                <input
                  type="text"
                  value={editForm.username}
                  disabled
                  className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-muted font-mono cursor-not-allowed opacity-75"
                />
              </div>

              <div>
                <label className="text-xs font-bold t-text-muted uppercase block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-bold focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold t-text-muted uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Password Change Box */}
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl space-y-1.5">
                <label className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Change User Password (Optional)
                </label>
                <input
                  type="password"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  placeholder="Enter new password (leave blank to keep current)"
                  className="w-full t-bg-surface border t-border rounded-xl px-3.5 py-2 t-text-primary font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold t-text-muted uppercase block mb-1">Assigned Role</label>
                  <select
                    value={editForm.roleId}
                    onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                    className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    {roles.map(r => (
                      <option key={r.roleId} value={r.roleId}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold t-text-muted uppercase block mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* RVM Machine Dropdown & Multi-Select Badge Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold t-text-muted uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    Assigned RVM Machines Scope
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddMachine('*', true)}
                    className="text-[10px] text-cyan-400 hover:underline font-bold"
                  >
                    Select All Fleet (*)
                  </button>
                </label>

                <select
                  onChange={(e) => {
                    handleAddMachine(e.target.value, true);
                    e.target.value = '';
                  }}
                  className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-bold focus:border-cyan-500 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>-- Dropdown Select RVM Machine to Add --</option>
                  <option value="*">🌟 All Fleet Machines (*)</option>
                  {availableMachines.map(mId => (
                    <option key={mId} value={mId}>🤖 {mId}</option>
                  ))}
                </select>

                {/* Selected Badges */}
                <div className="flex flex-wrap gap-1.5 p-2.5 t-bg-sec border t-border rounded-xl min-h-[42px] items-center">
                  {(editForm.assignedMachines || ['*']).map(mId => (
                    <span
                      key={mId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    >
                      <Cpu className="w-3 h-3" />
                      {mId === '*' ? 'All Fleet (*)' : mId}
                      <button
                        type="button"
                        onClick={() => handleRemoveMachine(mId, true)}
                        className="hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t t-border">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 t-bg-sec hover:t-bg-hover t-text-secondary font-bold rounded-xl border t-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-950/40"
                >
                  Save Account Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

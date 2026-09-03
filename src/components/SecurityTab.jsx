import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, UserPlus, Users, KeyRound, Cpu, Eye, Lock, 
  CheckCircle2, AlertTriangle, RefreshCw, Trash2, Edit3, Check, X, ShieldAlert, Key, Plus,
  FileText, Smartphone, Leaf, Trophy, Tv, ArrowRightLeft, HardDrive, Recycle, Settings, 
  MessageSquare, CheckSquare, Square, Sliders, Layers, LayoutDashboard, Table, Shield
} from 'lucide-react';

export const AVAILABLE_SYSTEM_MENUS = [
  {
    category: 'Core Dashboards & Signage',
    badge: 'Main Nav',
    items: [
      { id: 'overview', label: 'System Overview', icon: LayoutDashboard, desc: 'Live fleet KPI metrics, deposit intake breakdown & recent activity' },
      { id: 'reporting_hub', label: 'Reporting & Analytics Hub', icon: FileText, desc: 'PicoDrop paper scale calibration, fleet uptime, ESG & financial audits' },
      { id: 'mobile_users', label: 'Mobile App Citizens', icon: Smartphone, desc: 'Citizen profiles, registered user balances & mobile registration logs' },
      { id: 'esg_impact', label: 'ESG Carbon Impact', icon: Leaf, desc: 'CO₂ emission offsets, diverted landfill volume & tree equivalents' },
      { id: 'analytics', label: 'Analytics & Leaderboard', icon: Trophy, desc: 'Recycler rankings, points incentive rules & voucher redemptions' },
      { id: 'machines', label: 'RVM Fleet Health', icon: Cpu, desc: 'Hardware telemetry, live sensor pings & firmware versions' },
      { id: 'advertisements', label: 'Ad Video Signage', icon: Tv, desc: 'Digital signage playlists & promotional kiosk video manager' },
    ]
  },
  {
    category: 'System Administration & Security',
    badge: 'Admin Only',
    items: [
      { id: 'security', label: 'User & Security RBAC', icon: Lock, desc: 'Manage user credentials, passwords & Role Permissions Matrix' },
      { id: 'db_switcher', label: 'DB Connection Manager', icon: ArrowRightLeft, desc: 'PostgreSQL & MongoDB cluster host routing & status' },
      { id: 'db_backup', label: 'DB Backup & Restore', icon: HardDrive, desc: 'Database snapshots, SQL dumps & system restore points' },
    ]
  },
  {
    category: 'Database Inspection & Relational Tables',
    badge: 'Data Tables',
    items: [
      { id: 'col_recycling_sessions', label: 'Recycling Sessions Table', icon: Recycle, desc: 'Granular deposit session records (PET, cans, cardboard, paper)' },
      { id: 'col_machines', label: 'Fleet Machines Table', icon: Cpu, desc: 'Registered hardware machines in database' },
      { id: 'col_machine_configs', label: 'RVM Configurations Table', icon: Settings, desc: 'Points per unit, tare weights & optical hardware settings' },
      { id: 'col_users', label: 'Registered Users Table', icon: Users, desc: 'Citizen account records & contact details' },
      { id: 'col_feedbacks', label: 'User Feedbacks Log', icon: MessageSquare, desc: 'Citizen support tickets & machine feedback logs' },
      { id: 'col_binfullnotifications', label: 'Bin Full Alerts Table', icon: AlertTriangle, desc: 'Operational capacity & paper weight limit alarms' },
      { id: 'col_redemptions', label: 'Redemptions Table', icon: Trophy, desc: 'Reward voucher claims & loyalty point redemptions' },
      { id: 'col_adminaccounts', label: 'Admin Accounts Table', icon: Shield, desc: 'System operators & administrator accounts list' },
    ]
  }
];

export default function SecurityTab() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [availableMachines, setAvailableMachines] = useState(['RVM-001', 'RVM-002', 'RVM-PK-01', 'RVM-PK-02', 'RVM-KHI-01']);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // User object being edited
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' | 'rbac'
  const [message, setMessage] = useState(null);

  // Role Edit & Custom Role Form State
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    roleId: '',
    name: '',
    color: 'emerald',
    description: '',
    modules: [],
    permissions: {
      view: true,
      edit: false,
      export: false,
      delete: false,
      manage_users: false,
      switch_db: false
    },
    isNew: false
  });
  const [savingRole, setSavingRole] = useState(false);

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
        setMessage({ type: 'error', text: json.error || 'Failed to create user.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const startEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      fullName: user.fullName || user.username,
      email: user.email || '',
      roleId: user.roleId || 'fleet_operator',
      assignedMachines: Array.isArray(user.assignedMachines) ? user.assignedMachines : (user.assignedMachines ? [user.assignedMachines] : ['*']),
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
      if (editForm.newPassword) {
        payload.password = editForm.newPassword;
      }

      const res = await fetch(`/api/security/users/${editingUser.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: 'success', text: `User "${editingUser.username}" updated successfully.` });
        setEditingUser(null);
        fetchData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to update user.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleUserStatus = async (user) => {
    if (user.username === 'onenet') {
      setMessage({ type: 'error', text: 'Cannot suspend master developer account "onenet".' });
      return;
    }

    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
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

    if (!window.confirm(`Are you sure you want to delete user "${user.username}"?`)) return;

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

  // ==========================================
  // ROLE & MENU PERMISSIONS MATRIX EDITING LOGIC
  // ==========================================
  const startEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      roleId: role.roleId,
      name: role.name,
      color: role.color || 'emerald',
      description: role.description || '',
      modules: Array.isArray(role.modules) ? [...role.modules] : ['overview'],
      permissions: {
        view: role.permissions?.view ?? true,
        edit: role.permissions?.edit ?? false,
        export: role.permissions?.export ?? false,
        delete: role.permissions?.delete ?? false,
        manage_users: role.permissions?.manage_users ?? false,
        switch_db: role.permissions?.switch_db ?? false,
      },
      isNew: false
    });
  };

  const startCreateRole = () => {
    setEditingRole({ isNew: true });
    setRoleForm({
      roleId: '',
      name: '',
      color: 'cyan',
      description: '',
      modules: ['overview', 'reporting_hub'],
      permissions: {
        view: true,
        edit: false,
        export: false,
        delete: false,
        manage_users: false,
        switch_db: false,
      },
      isNew: true
    });
  };

  const handleToggleRoleModule = (moduleId) => {
    setRoleForm(prev => {
      const current = Array.isArray(prev.modules) ? [...prev.modules] : [];
      if (current.includes(moduleId)) {
        return { ...prev, modules: current.filter(m => m !== moduleId) };
      } else {
        return { ...prev, modules: [...current, moduleId] };
      }
    });
  };

  const handleSelectAllModules = () => {
    const allIds = AVAILABLE_SYSTEM_MENUS.flatMap(cat => cat.items.map(i => i.id));
    setRoleForm(prev => ({ ...prev, modules: allIds }));
  };

  const handleClearAllModules = () => {
    setRoleForm(prev => ({ ...prev, modules: [] }));
  };

  const handleApplyPreset = (presetKey) => {
    if (presetKey === 'operator') {
      setRoleForm(prev => ({
        ...prev,
        modules: ['overview', 'reporting_hub', 'machines', 'col_machines', 'col_machine_configs', 'col_binfullnotifications'],
        permissions: { ...prev.permissions, view: true, edit: true, export: true, delete: false, switch_db: false }
      }));
    } else if (presetKey === 'analyst') {
      setRoleForm(prev => ({
        ...prev,
        modules: ['overview', 'reporting_hub', 'esg_impact', 'analytics', 'col_recycling_sessions', 'col_redemptions'],
        permissions: { ...prev.permissions, view: true, edit: false, export: true, delete: false, switch_db: false }
      }));
    } else if (presetKey === 'support') {
      setRoleForm(prev => ({
        ...prev,
        modules: ['overview', 'mobile_users', 'col_users', 'col_feedbacks', 'col_redemptions'],
        permissions: { ...prev.permissions, view: true, edit: true, export: false, delete: false, switch_db: false }
      }));
    }
  };

  const handleToggleRolePermission = (key) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      setMessage({ type: 'error', text: 'Role Name is required.' });
      return;
    }

    const finalRoleId = roleForm.isNew
      ? (roleForm.roleId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || roleForm.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'))
      : (editingRole?.roleId || roleForm.roleId);

    if (!finalRoleId) {
      setMessage({ type: 'error', text: 'Valid Role ID is required.' });
      return;
    }

    try {
      setSavingRole(true);
      setMessage(null);

      const payload = {
        _id: editingRole?._id,
        originalRoleId: editingRole?.isNew ? null : editingRole?.roleId,
        roleId: finalRoleId,
        name: roleForm.name.trim(),
        color: roleForm.color || 'cyan',
        description: roleForm.description ? roleForm.description.trim() : '',
        modules: roleForm.modules,
        permissions: roleForm.permissions
      };

      const res = await fetch('/api/security/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: 'success', text: `Role "${roleForm.name}" & assigned menu permissions saved successfully.` });
        setEditingRole(null);
        fetchData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save role permissions.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (['super_admin', 'fleet_operator'].includes(role.roleId)) {
      setMessage({ type: 'error', text: `Cannot delete built-in system role "${role.name}".` });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete role "${role.name}"? Users with this role may lose access.`)) return;

    try {
      const res = await fetch(`/api/security/roles/${role.roleId}`, {
        method: 'DELETE'
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: 'success', text: `Role "${role.name}" deleted successfully.` });
        fetchData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to delete role.' });
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
      rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
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
    if (!roleDoc || !roleDoc.modules || roleDoc.modules.length === 0) {
      return <span className="t-text-muted text-xs italic">No menus assigned</span>;
    }

    if (roleDoc.modules.includes('*') || roleDoc.modules.includes('all')) {
      return <span className="px-2.5 py-0.5 text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded uppercase">🌟 Full Access (All Menus)</span>;
    }

    // Lookup menu label
    const allItems = AVAILABLE_SYSTEM_MENUS.flatMap(cat => cat.items);

    return (
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
        {roleDoc.modules.map(m => {
          const item = allItems.find(i => i.id === m || i.id === `col_${m}` || i.id.replace('col_', '') === m);
          const label = item?.label || m.replace('col_', '');
          return (
            <span key={m} className="px-2 py-0.5 text-[10px] font-semibold t-bg-sec border t-border rounded t-text-secondary uppercase">
              {label}
            </span>
          );
        })}
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
          <p className="text-xs t-text-secondary mt-1">Manage user info, passwords, role assignments, and customizable Module Permissions Matrix.</p>
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

          {activeSubTab === 'users' ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40"
            >
              <UserPlus className="w-4 h-4" />
              Create New User
            </button>
          ) : (
            <button
              onClick={startCreateRole}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-cyan-950/40"
            >
              <Plus className="w-4 h-4" />
              Create Custom Role
            </button>
          )}
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

      {/* SubTab 2: Role-Based Access Control (RBAC) & Module Permissions Matrix (EDITABLE) */}
      {activeSubTab === 'rbac' && (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b t-border pb-4">
            <div>
              <h3 className="text-lg font-bold t-text-primary flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Role Access Control & Module Permissions Matrix
              </h3>
              <p className="text-xs t-text-secondary mt-1">
                Edit existing roles or assign specific menus and feature permissions to control sidebar navigation access.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={startCreateRole}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Role</span>
              </button>
              <button 
                onClick={fetchData} 
                className="p-2 t-text-secondary hover:t-text-primary t-bg-sec border t-border rounded-xl"
                title="Refresh Roles"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {roles.map(r => {
              const assignedCount = Array.isArray(r.modules) ? r.modules.length : 0;
              const totalAvailable = AVAILABLE_SYSTEM_MENUS.flatMap(cat => cat.items).length;

              return (
                <div key={r.roleId} className="p-5 rounded-2xl border t-border t-bg-sec flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b t-border pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base t-text-primary">{r.name}</h4>
                          <span className="mono text-[10px] text-gray-400">({r.roleId})</span>
                        </div>
                        <p className="text-xs t-text-muted mt-1 leading-relaxed">{r.description}</p>
                      </div>
                      <div className="shrink-0">
                        {getRoleBadge(r.roleId)}
                      </div>
                    </div>

                    {/* Action Rights Summary */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold t-text-muted">Administrative Action Rights</span>
                      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                        <div className="p-1.5 t-bg-surface rounded-lg border t-border flex items-center justify-between">
                          <span className="t-text-secondary truncate">View</span>
                          {r.permissions?.view ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                        </div>
                        <div className="p-1.5 t-bg-surface rounded-lg border t-border flex items-center justify-between">
                          <span className="t-text-secondary truncate">Edit</span>
                          {r.permissions?.edit ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                        </div>
                        <div className="p-1.5 t-bg-surface rounded-lg border t-border flex items-center justify-between">
                          <span className="t-text-secondary truncate">Export</span>
                          {r.permissions?.export ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                        </div>
                        <div className="p-1.5 t-bg-surface rounded-lg border t-border flex items-center justify-between">
                          <span className="t-text-secondary truncate">Delete</span>
                          {r.permissions?.delete ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                        </div>
                        <div className="p-1.5 t-bg-surface rounded-lg border t-border flex items-center justify-between">
                          <span className="t-text-secondary truncate">Users</span>
                          {r.permissions?.manage_users ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                        </div>
                        <div className="p-1.5 t-bg-surface rounded-lg border t-border flex items-center justify-between">
                          <span className="t-text-secondary truncate">Switch DB</span>
                          {r.permissions?.switch_db ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                        </div>
                      </div>
                    </div>

                    {/* Assigned Menus List */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold t-text-muted">Assigned System Menus</span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">
                          {assignedCount} of {totalAvailable} Menus
                        </span>
                      </div>
                      {getRoleModulesPills(r.roleId)}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-3 border-t t-border flex items-center justify-between gap-2">
                    <button
                      onClick={() => startEditRole(r)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Role & Menu Permissions</span>
                    </button>

                    {!['super_admin', 'fleet_operator'].includes(r.roleId) && (
                      <button
                        onClick={() => handleDeleteRole(r)}
                        className="p-2 t-bg-surface hover:bg-rose-600 hover:text-white t-text-muted rounded-xl border t-border transition-all"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================================
          EDIT ROLE & MENU PERMISSIONS MODAL (POPUP)
          ========================================== */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="max-w-3xl w-full my-8 t-bg-surface border t-border rounded-3xl p-6 space-y-6 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b t-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black t-text-primary">
                    {roleForm.isNew ? 'Create New System Role' : `Edit Permissions: ${roleForm.name}`}
                  </h3>
                  <p className="text-xs t-text-muted">Assign specific menu lists and grant operational action rights for this role.</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingRole(null)} 
                className="p-1.5 t-text-muted hover:t-text-primary rounded-lg hover:t-bg-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-6 text-xs">
              
              {/* Role Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold t-text-muted uppercase block mb-1">Role Name</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="e.g. Field Maintenance Engineer"
                    className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-bold focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold t-text-muted uppercase block mb-1">Role Identifier (Key)</label>
                  <input
                    type="text"
                    value={roleForm.roleId}
                    onChange={(e) => setRoleForm({ ...roleForm, roleId: e.target.value })}
                    placeholder="e.g. field_engineer"
                    disabled={!roleForm.isNew}
                    title={!roleForm.isNew ? "Role Identifier is locked for existing roles" : ""}
                    className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-mono focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold t-text-muted uppercase block mb-1">Badge Color Theme</label>
                  <select
                    value={roleForm.color}
                    onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                    className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-bold focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="emerald">Emerald Green</option>
                    <option value="cyan">Cyan Blue</option>
                    <option value="amber">Amber Gold</option>
                    <option value="purple">Purple Indigo</option>
                    <option value="rose">Rose Red</option>
                    <option value="blue">Electric Blue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold t-text-muted uppercase block mb-1">Role Purpose & Description</label>
                <input
                  type="text"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="e.g. Access limited to RVM Hardware Fleet Health, Machine Alerts, and Optical Diagnostics"
                  className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Administrative Action Rights Checkbox Grid */}
              <div className="space-y-2 p-4 rounded-2xl bg-black/20 border t-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Administrative Action Rights
                  </span>
                  <span className="text-[10px] t-text-muted">Global capabilities granted to this role</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {[
                    { key: 'view', label: 'View Dashboards & Data', desc: 'Can inspect screens & metrics' },
                    { key: 'edit', label: 'Edit Configurations & Data', desc: 'Can update configs and records' },
                    { key: 'export', label: 'Export Data Reports', desc: 'Can download CSV, PDF & audits' },
                    { key: 'delete', label: 'Delete Records & Logs', desc: 'Can delete sessions & accounts' },
                    { key: 'manage_users', label: 'Manage User Accounts', desc: 'Can create users & change passwords' },
                    { key: 'switch_db', label: 'Switch DB Server', desc: 'Can change PostgreSQL/Mongo clusters' },
                  ].map(action => {
                    const isChecked = !!roleForm.permissions?.[action.key];
                    return (
                      <button
                        key={action.key}
                        type="button"
                        onClick={() => handleToggleRolePermission(action.key)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          isChecked 
                            ? 'bg-cyan-500/15 border-cyan-400 text-white shadow' 
                            : 't-bg-surface border-white/5 t-text-muted hover:border-white/20'
                        }`}
                      >
                        <div className={`mt-0.5 ${isChecked ? 'text-cyan-400' : 't-text-muted'}`}>
                          {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className={`font-bold text-xs ${isChecked ? 'text-white' : 't-text-secondary'}`}>
                            {action.label}
                          </div>
                          <div className="text-[10px] t-text-muted leading-tight mt-0.5">
                            {action.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Menu List / Menu Assignment (THE USER'S MAIN REQUEST) */}
              <div className="space-y-3 p-4 rounded-2xl bg-black/20 border border-emerald-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b t-border pb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        Assign Specific Menu List & Navigation Scope
                      </span>
                    </div>
                    <p className="text-[11px] t-text-muted mt-0.5">
                      Check the exact menus visible to this role in the navigation sidebar.
                    </p>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAllModules}
                      className="px-2.5 py-1 rounded-lg t-bg-sec hover:t-bg-hover border t-border text-[10px] font-bold text-emerald-400"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllModules}
                      className="px-2.5 py-1 rounded-lg t-bg-sec hover:t-bg-hover border t-border text-[10px] font-bold text-rose-400"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('operator')}
                      className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold"
                    >
                      Operator Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('analyst')}
                      className="px-2 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold"
                    >
                      Analyst Preset
                    </button>
                  </div>
                </div>

                {/* Selected Menus Counter */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-gray-300">
                    Selected Navigation Menus: <span className="text-emerald-400 font-mono font-black">{roleForm.modules?.length || 0}</span>
                  </span>
                  <span className="text-[10px] t-text-muted">
                    Total System Menus Available: {AVAILABLE_SYSTEM_MENUS.flatMap(c => c.items).length}
                  </span>
                </div>

                {/* Categorized Menu Tiles */}
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {AVAILABLE_SYSTEM_MENUS.map((cat, catIdx) => (
                    <div key={catIdx} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                          {cat.category}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-mono">
                          {cat.badge}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.items.map(item => {
                          const Icon = item.icon;
                          const isAssigned = (roleForm.modules || []).includes(item.id);

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleToggleRoleModule(item.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                                isAssigned
                                  ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-500/50'
                                  : 't-bg-surface border-white/5 t-text-muted hover:border-white/20'
                              }`}
                            >
                              <div className={`mt-0.5 shrink-0 ${isAssigned ? 'text-emerald-400' : 't-text-muted'}`}>
                                {isAssigned ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </div>

                              <div className="flex items-start gap-2 overflow-hidden">
                                <div className={`p-1 rounded-lg shrink-0 ${isAssigned ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-400'}`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="truncate">
                                  <div className={`text-xs font-bold truncate ${isAssigned ? 'text-white' : 't-text-secondary'}`}>
                                    {item.label}
                                  </div>
                                  <div className="text-[10px] t-text-muted truncate mt-0.5">
                                    {item.desc}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t t-border">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="px-4 py-2.5 t-bg-sec hover:t-bg-hover t-text-secondary font-bold rounded-xl border t-border transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRole}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
                >
                  {savingRole ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Role & Menu Permissions</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          CREATE USER MODAL
          ========================================== */}
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
                    placeholder="e.g. tariq_operator"
                    className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-mono focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold t-text-muted uppercase block mb-1">Initial Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Enter password..."
                    className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold t-text-muted uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="tariq@ecodrop.com"
                  className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary focus:border-emerald-500 focus:outline-none"
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
                    onClick={() => handleAddMachine('*')}
                    className="text-[10px] text-cyan-400 hover:underline font-bold"
                  >
                    Select All Fleet (*)
                  </button>
                </label>

                <select
                  onChange={(e) => {
                    handleAddMachine(e.target.value);
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
                  {(newUser.assignedMachines || ['*']).map(mId => (
                    <span
                      key={mId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    >
                      <Cpu className="w-3 h-3" />
                      {mId === '*' ? 'All Fleet (*)' : mId}
                      <button
                        type="button"
                        onClick={() => handleRemoveMachine(mId)}
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
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          EDIT USER MODAL
          ========================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-lg w-full t-bg-surface border t-border rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b t-border pb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold t-text-primary">Edit User: @{editingUser.username}</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="t-text-muted hover:t-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold t-text-muted uppercase block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold t-text-muted uppercase block mb-1">New Password (Optional)</label>
                  <input
                    type="password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    placeholder="Leave blank to keep"
                    className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary focus:border-cyan-500 focus:outline-none"
                  />
                </div>
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

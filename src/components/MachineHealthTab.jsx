import React, { useState, useEffect } from 'react';
import { Cpu, AlertTriangle, CheckCircle2, Clock, Activity, RefreshCw, Server, Plus, MapPin, Edit3, X, Settings, Globe, Wifi } from 'lucide-react';
import DataTable from './DataTable';

const formatGpsCoordinates = (lat, lng) => {
  if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) return 'N/A';
  const latNum = Number(lat);
  const lngNum = Number(lng);
  const latDir = latNum >= 0 ? 'N' : 'S';
  const lngDir = lngNum >= 0 ? 'E' : 'W';
  return `${Math.abs(latNum).toFixed(4)}° ${latDir}, ${Math.abs(lngNum).toFixed(4)}° ${lngDir}`;
};

export default function MachineHealthTab({ currentUser }) {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFleetMapModal, setShowFleetMapModal] = useState(false);

  // Register/Edit Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMachineId, setNewMachineId] = useState('RVM-001');
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineLocation, setNewMachineLocation] = useState('');

  // Points & Unit Configuration Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [targetMachine, setTargetMachine] = useState('ALL');

  // Plastic Variants
  const [pointsPlastic, setPointsPlastic] = useState(10);
  const [pointsPlasticSmall, setPointsPlasticSmall] = useState(5);
  const [pointsPlasticMedium, setPointsPlasticMedium] = useState(10);
  const [pointsPlasticLarge, setPointsPlasticLarge] = useState(15);
  const [plasticUnit, setPlasticUnit] = useState('per_piece');

  // Can / Aluminium Variants
  const [pointsAluminium, setPointsAluminium] = useState(20);
  const [pointsCanSmall, setPointsCanSmall] = useState(10);
  const [pointsCanMedium, setPointsCanMedium] = useState(15);
  const [pointsCanLarge, setPointsCanLarge] = useState(20);
  const [aluminiumUnit, setAluminiumUnit] = useState('per_piece');

  // Glass Variants
  const [pointsGlass, setPointsGlass] = useState(15);
  const [pointsGlassSmall, setPointsGlassSmall] = useState(10);
  const [pointsGlassMedium, setPointsGlassMedium] = useState(15);
  const [pointsGlassLarge, setPointsGlassLarge] = useState(20);
  const [glassUnit, setGlassUnit] = useState('per_piece');

  // Paper Variant
  const [pointsPaper, setPointsPaper] = useState(15);
  const [paperUnit, setPaperUnit] = useState('per_kg');

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Extract active logged-in user with storage fallbacks
  const getActiveUser = () => {
    let u = currentUser;
    if (!u || (!u.username && !u.roleId)) {
      try {
        u = JSON.parse(sessionStorage.getItem('rvm_auth_user') || localStorage.getItem('rvm_auth_user') || '{}');
      } catch (e) {
        u = {};
      }
    }
    return u || {};
  };

  const activeUser = getActiveUser();

  const isSuperAdmin = (
    activeUser?.username === 'onenet' ||
    activeUser?.username === 'bilalaaqueel' ||
    activeUser?.roleId === 'super_admin' ||
    activeUser?.roleId === 'superadmin' ||
    activeUser?.roleId === 'admin' ||
    (activeUser?.roleName && activeUser.roleName.toLowerCase().includes('super admin')) ||
    (Array.isArray(activeUser?.assignedMachines) && activeUser.assignedMachines.includes('*'))
  );

  // Extract authorized assigned machines list for the logged-in user
  const getAssignedList = () => {
    const u = getActiveUser();
    if (isSuperAdmin) return null; // Full fleet
    const raw = u.assignedMachines;
    if (!raw) return null;
    const arr = Array.isArray(raw) ? raw : [raw];
    if (arr.length === 0 || arr.includes('*')) return null; // Full fleet
    return arr.map(m => m.trim());
  };

  const assignedList = getAssignedList();

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const assigned = getAssignedList();
      const queryParam = assigned && assigned.length > 0 
        ? `?assignedMachines=${encodeURIComponent(assigned.join(','))}` 
        : '';
      const res = await fetch(`/api/analytics/machines${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        // Client-side guarantee: filter to ensure only assigned machines are stored in state
        const filtered = assigned && assigned.length > 0
          ? (data || []).filter(m => m.machineId && assigned.some(a => a.toUpperCase() === m.machineId.toUpperCase()))
          : (data || []);
        setMachines(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMachine = async (e) => {
    e.preventDefault();
    if (!newMachineId.trim()) return;

    const isExisting = machines.some(m => m.machineId?.toUpperCase() === newMachineId.trim().toUpperCase());
    if (!isExisting && !isSuperAdmin) {
      setSuccessMessage('⚠️ Permission Denied: Only Super Admin accounts can register new RVM units.');
      return;
    }

    try {
      setSaving(true);
      const user = getActiveUser();
      const token = sessionStorage.getItem('rvm_auth_token') || localStorage.getItem('rvm_auth_token') || '';

      const res = await fetch('/api/machines', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-username': user.username || '',
          'x-user-role': user.roleId || ''
        },
        body: JSON.stringify({
          machineId: newMachineId.trim(),
          name: (newMachineName || `RVM Machine ${newMachineId}`).trim(),
          location: (newMachineLocation || 'Main Campus').trim(),
          username: user.username,
          roleId: user.roleId,
          isSuperAdmin,
          token,
          pointsPerPlasticBottle: parseInt(pointsPlastic) || 10,
          plasticUnit,
          pointsPerAluminiumCan: parseInt(pointsAluminium) || 20,
          aluminiumUnit,
          pointsPerPaperKg: parseInt(pointsPaper) || 15,
          paperUnit,
          pointsPerGlass: parseInt(pointsGlass) || 15,
          glassUnit
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        const savedId = newMachineId.trim();
        const savedName = newMachineName.trim() || savedId;
        setSuccessMessage(`Machine "${savedId}" (${savedName}) saved successfully!`);
        setNewMachineName('');
        setNewMachineLocation('');
        fetchMachines();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setSuccessMessage(`⚠️ ${errJson.error || 'Failed to save machine'}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncPointsConfig = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/machine/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetMachine,
          pointsPerPlasticBottle: parseInt(pointsPlastic) || 10,
          pointsPlasticSmall: parseInt(pointsPlasticSmall) || 5,
          pointsPlasticMedium: parseInt(pointsPlasticMedium) || 10,
          pointsPlasticLarge: parseInt(pointsPlasticLarge) || 15,
          plasticUnit,
          pointsPerAluminiumCan: parseInt(pointsAluminium) || 20,
          pointsCanSmall: parseInt(pointsCanSmall) || 10,
          pointsCanMedium: parseInt(pointsCanMedium) || 15,
          pointsCanLarge: parseInt(pointsCanLarge) || 20,
          aluminiumUnit,
          pointsPerPaperKg: parseInt(pointsPaper) || 15,
          paperUnit,
          pointsPerGlass: parseInt(pointsGlass) || 15,
          pointsGlassSmall: parseInt(pointsGlassSmall) || 10,
          pointsGlassMedium: parseInt(pointsGlassMedium) || 15,
          pointsGlassLarge: parseInt(pointsGlassLarge) || 20,
          glassUnit
        })
      });
      if (res.ok) {
        setShowConfigModal(false);
        const data = await res.json();
        setSuccessMessage(data.message || 'Points rules successfully synced to RVMs!');
        fetchMachines();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (m) => {
    setNewMachineId(m.machineId);
    setNewMachineName(m.name || '');
    setNewMachineLocation(m.location || '');
    setPointsPlastic(m.pointsPerPlasticBottle ?? 10);
    setPointsPlasticSmall(m.pointsPlasticSmall ?? 5);
    setPointsPlasticMedium(m.pointsPlasticMedium ?? 10);
    setPointsPlasticLarge(m.pointsPlasticLarge ?? 15);
    setPlasticUnit(m.plasticUnit || 'per_piece');

    setPointsAluminium(m.pointsPerAluminiumCan ?? 20);
    setPointsCanSmall(m.pointsCanSmall ?? 10);
    setPointsCanMedium(m.pointsCanMedium ?? 15);
    setPointsCanLarge(m.pointsCanLarge ?? 20);
    setAluminiumUnit(m.aluminiumUnit || 'per_piece');

    setPointsPaper(m.pointsPerPaperKg ?? 15);
    setPaperUnit(m.paperUnit || 'per_kg');

    setPointsGlass(m.pointsPerGlass ?? 15);
    setPointsGlassSmall(m.pointsGlassSmall ?? 10);
    setPointsGlassMedium(m.pointsGlassMedium ?? 15);
    setPointsGlassLarge(m.pointsGlassLarge ?? 20);
    setGlassUnit(m.glassUnit || 'per_piece');
    setShowAddModal(true);
  };

  const openConfigModalForMachine = (m) => {
    setTargetMachine(m ? m.machineId : 'ALL');
    if (m) {
      setPointsPlastic(m.pointsPerPlasticBottle ?? 10);
      setPointsPlasticSmall(m.pointsPlasticSmall ?? 5);
      setPointsPlasticMedium(m.pointsPlasticMedium ?? 10);
      setPointsPlasticLarge(m.pointsPlasticLarge ?? 15);
      setPlasticUnit(m.plasticUnit || 'per_piece');

      setPointsAluminium(m.pointsPerAluminiumCan ?? 20);
      setPointsCanSmall(m.pointsCanSmall ?? 10);
      setPointsCanMedium(m.pointsCanMedium ?? 15);
      setPointsCanLarge(m.pointsCanLarge ?? 20);
      setAluminiumUnit(m.aluminiumUnit || 'per_piece');

      setPointsPaper(m.pointsPerPaperKg ?? 15);
      setPaperUnit(m.paperUnit || 'per_kg');

      setPointsGlass(m.pointsPerGlass ?? 15);
      setPointsGlassSmall(m.pointsGlassSmall ?? 10);
      setPointsGlassMedium(m.pointsGlassMedium ?? 15);
      setPointsGlassLarge(m.pointsGlassLarge ?? 20);
      setGlassUnit(m.glassUnit || 'per_piece');
    }
    setShowConfigModal(true);
  };

  useEffect(() => {
    fetchMachines();
    const interval = setInterval(fetchMachines, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl flex items-center justify-between text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Hardware Fleet Monitoring</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">Reverse Vending Machine Status</h2>
          <p className="text-xs t-text-secondary mt-1">Real-time operational health, live heartbeat pings, and machine location tags.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFleetMapModal(true)}
            className="p-2.5 text-cyan-400 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-xl transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
          >
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>🗺️ Fleet Locations Map</span>
          </button>
          <button
            onClick={fetchMachines}
            className="p-2.5 t-text-secondary hover:t-text-primary t-bg-sec border t-border rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Live Telemetry</span>
          </button>
        </div>
      </div>

      {/* Assigned RVM Fleet Scope Notification */}
      {assignedList && assignedList.length > 0 && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center justify-between text-xs font-bold animate-fade-in shadow-md">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Assigned RVM Fleet Scope Active: Displaying telemetry and status for ({assignedList.join(', ')}) only</span>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-200 uppercase font-mono font-bold shrink-0 border border-cyan-500/30">
            {assignedList.length} Machine{assignedList.length > 1 ? 's' : ''} Scoped
          </span>
        </div>
      )}

      {/* Fleet Summary Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 xl:gap-5 2xl:gap-6">
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-cyan-500/20">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Configured RVMs</span>
            <span className="text-xl font-extrabold t-text-primary mono">{machines.length}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-emerald-500/20">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Online Fleet</span>
            <span className="text-xl font-extrabold text-emerald-400 mono">
              {machines.filter(m => m.status === 'ONLINE' || m.isOnline).length}
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-rose-500/20">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Offline Fleet</span>
            <span className="text-xl font-extrabold text-rose-400 mono">
              {machines.filter(m => m.status !== 'ONLINE' && !m.isOnline).length}
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-amber-500/20">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Active Alerts</span>
            <span className="text-xl font-extrabold text-amber-400 mono">
              {machines.reduce((acc, m) => acc + (m.alertCount || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Machine Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center t-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : machines.length === 0 ? (
          <div className="col-span-full glass-panel p-8 text-center t-text-muted rounded-2xl">
            No registered machines currently reporting data.
          </div>
        ) : (
          machines.map(m => {
            const hasAlerts = m.alertCount > 0;
            const isOnline = m.status === 'ONLINE' || m.isOnline;
            return (
              <div
                key={m.machineId}
                className={`glass-panel p-5 rounded-2xl space-y-4 border transition-all ${isOnline ? 'border-emerald-500/30' : 'border-rose-500/30 bg-rose-950/5'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold t-text-primary text-sm mono">{m.machineId}</h4>
                        <button onClick={() => openEditModal(m)} className="t-text-muted hover:text-[#0b5d3b]">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-cyan-300">{m.name || `RVM Unit ${m.machineId}`}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#0b5d3b]" />
                          {m.location || 'Islamabad Main Campus'}
                        </span>
                        {m.latitude != null && m.longitude != null && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                            title="View exact machine location on Google Maps"
                          >
                            <Globe className="w-3 h-3" />
                            {formatGpsCoordinates(m.latitude, m.longitude)} ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-1 text-xs font-extrabold uppercase rounded-full flex items-center gap-1.5 ${isOnline
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                        : 'bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>

                    {hasAlerts && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 rounded-full">
                        Bin Alert
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 dark:t-bg-sec p-3 rounded-2xl border border-slate-200 dark:t-border">
                  <div className="bg-white dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-slate-500 dark:t-text-muted block text-xs font-bold uppercase">Total Sessions</span>
                    <span className="font-extrabold text-slate-900 dark:t-text-primary mono text-base">{m.sessionCount || 0}</span>
                  </div>

                  <div className="bg-emerald-50/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-emerald-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[#0b5d3b] dark:text-emerald-400 block text-xs font-bold uppercase">Plastic Bottles</span>
                    <span className="font-extrabold text-[#0b5d3b] dark:text-emerald-300 mono text-base">🥤 {m.plasticCount || (m.glassCount === 0 && m.canCount === 0 && m.paperCount === 0 ? m.totalBottles : 0)}</span>
                  </div>

                  <div className="bg-purple-50/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-purple-200 dark:border-slate-800 shadow-sm">
                    <span className="text-purple-800 dark:text-purple-400 block text-xs font-bold uppercase">Glass Bottles</span>
                    <span className="font-extrabold text-purple-900 dark:text-purple-300 mono text-base">🍾 {m.glassCount || 0}</span>
                  </div>

                  <div className="bg-amber-50/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-amber-200 dark:border-slate-800 shadow-sm">
                    <span className="text-amber-800 dark:text-amber-400 block text-xs font-bold uppercase">Can / Metal</span>
                    <span className="font-extrabold text-amber-900 dark:text-amber-300 mono text-base">🥫 {m.canCount || 0}</span>
                  </div>

                  <div className="bg-sky-50/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-sky-200 dark:border-slate-800 shadow-sm">
                    <span className="text-sky-800 dark:text-cyan-400 block text-xs font-bold uppercase">Paper</span>
                    <span className="font-extrabold text-sky-900 dark:text-cyan-300 mono text-base">📦 {m.paperCount || 0}</span>
                  </div>

                  <div className="bg-amber-50/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-amber-200 dark:border-slate-800 shadow-sm">
                    <span className="text-amber-800 dark:text-amber-400 block text-xs font-bold uppercase">Points Issued</span>
                    <span className="font-extrabold text-amber-900 dark:text-amber-400 mono text-base">⭐ {m.totalPoints || 0}</span>
                  </div>
                </div>

                {/* Connected IP Addresses: Public IP & Local IP */}
                <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 shadow-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-cyan-500/10 text-sky-800 dark:text-cyan-400 border border-sky-200 dark:border-cyan-500/20 flex-shrink-0">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Public IP</span>
                      <span className="font-mono font-bold text-sky-900 dark:text-cyan-300 truncate block text-xs" title={m.publicIp || 'Not Detected'}>
                        {m.publicIp && m.publicIp !== 'N/A' ? m.publicIp : '127.0.0.1'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-hidden border-l border-slate-200 dark:border-slate-800/80 pl-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-[#0b5d3b] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex-shrink-0">
                      <Wifi className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Local IP (LAN)</span>
                      <span className="font-mono font-bold text-[#0b5d3b] dark:text-emerald-300 truncate block text-xs" title={m.localIp || 'Not Detected'}>
                        {m.localIp && m.localIp !== 'N/A' ? m.localIp : '127.0.0.1'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 border-t t-border pt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#0b5d3b]" />
                    Last Ping: {m.lastPingAt || m.lastActive ? new Date(m.lastPingAt || m.lastActive).toLocaleTimeString() : 'Never'}
                  </span>
                  <span className={`font-bold text-xs ${isOnline ? 'text-[#0b5d3b]' : 'text-slate-400'}`}>
                    {isOnline ? 'Live Ping Active' : 'Offline'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bin Notifications Full Table */}
      <div className="pt-4">
        <DataTable collectionName="binfullnotifications" displayName="Bin Full Alert Notifications Log" />
      </div>

      {/* Interactive Fleet Locations Map Modal */}
      {showFleetMapModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl max-w-4xl w-full border border-cyan-500/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-extrabold t-text-primary">
                  Live RVM Fleet Geographic Locations &amp; Coordinates
                </h3>
              </div>
              <button
                onClick={() => setShowFleetMapModal(false)}
                className="t-text-muted hover:t-text-primary p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {machines.map(m => {
                const isOnline = m.status === 'ONLINE' || m.isOnline;
                const hasCoordinates = m.latitude != null && m.longitude != null;
                return (
                  <div
                    key={m.machineId}
                    className={`p-4 rounded-2xl border transition-all ${
                      isOnline ? 'bg-slate-900/50 border-emerald-500/30' : 'bg-slate-900/30 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-sm text-cyan-300">{m.machineId}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                        isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {isOnline ? '🟢 Live' : '⚪ Offline'}
                      </span>
                    </div>

                    <div className="font-extrabold text-sm t-text-primary">{m.name || `RVM ${m.machineId}`}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>{m.location || 'Location Pending'}</span>
                    </div>

                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">GPS Coordinates</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {hasCoordinates ? formatGpsCoordinates(m.latitude, m.longitude) : 'Auto-resolving from IP...'}
                        </span>
                      </div>
                      {hasCoordinates && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/40 transition-colors flex items-center gap-1"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Google Maps ↗</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t t-border">
              <button
                type="button"
                onClick={() => setShowFleetMapModal(false)}
                className="px-5 py-2 text-xs font-bold t-text-secondary hover:t-text-primary rounded-xl border t-border"
              >
                Close Map View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

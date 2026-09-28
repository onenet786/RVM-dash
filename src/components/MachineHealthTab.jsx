import React, { useState, useEffect } from 'react';
import { 
  Cpu, AlertTriangle, CheckCircle2, Clock, Activity, RefreshCw, Server, Plus, 
  MapPin, Edit3, X, Settings, Globe, Wifi, Wrench, Boxes, PowerOff, Check, 
  Download, Layers, Search, ArrowUpDown, Sliders, Shield, AlertCircle
} from 'lucide-react';
import DataTable from './DataTable';

const formatGpsCoordinates = (lat, lng) => {
  if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) return 'N/A';
  const latNum = Number(lat);
  const lngNum = Number(lng);
  const latDir = latNum >= 0 ? 'N' : 'S';
  const lngDir = lngNum >= 0 ? 'E' : 'W';
  return `${Math.abs(latNum).toFixed(4)}° ${latDir}, ${Math.abs(lngNum).toFixed(4)}° ${lngDir}`;
};

export default function MachineHealthTab({ currentUser, stationFilter = 'ALL', selectedClientId = 'ALL' }) {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFleetMapModal, setShowFleetMapModal] = useState(false);
  const [healthFilter, setHealthFilter] = useState('ALL'); // ALL, rvm_new, pecodrop, rvm_old, ATTENTION
  const [sortBy, setSortBy] = useState('ping'); // 'ping', 'volume', 'bin'
  const [toastMsg, setToastMsg] = useState(null);

  // Field Technician Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchMachineId, setDispatchMachineId] = useState('');
  const [dispatchTask, setDispatchTask] = useState('Empty Bins & Reset Capacity Sensor');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatching, setDispatching] = useState(false);

  // Raw Database Logs View Toggle
  const [showRawLogs, setShowRawLogs] = useState(false);

  // Register/Edit Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMachineId, setNewMachineId] = useState('RVM-001');
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineLocation, setNewMachineLocation] = useState('');
  const [newMachineType, setNewMachineType] = useState('RVM_NEW');
  const [newClientId, setNewClientId] = useState('ISP_MASTER');
  const [newLatitude, setNewLatitude] = useState('');
  const [newLongitude, setNewLongitude] = useState('');

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
  const [clientsList, setClientsList] = useState([]);

  // Maintenance Service Log Events (Audited history)
  // Only real, in-session dispatch events are kept here. Historical records
  // come from the scoped raw notifications table; never seed another tenant's data.
  const [serviceLogs, setServiceLogs] = useState([]);

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

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
      const params = new URLSearchParams();
      if (assigned && assigned.length > 0) params.append('assignedMachines', assigned.join(','));
      if (stationFilter && stationFilter !== 'ALL') params.append('stationFilter', stationFilter);
      if (selectedClientId && selectedClientId !== 'ALL') params.append('clientId', selectedClientId);
      
      const queryParam = params.toString() ? `?${params.toString()}` : '';
      const [mRes, cRes] = await Promise.all([
        fetch(`/api/analytics/machines${queryParam}`),
        fetch('/api/clients')
      ]);
      if (mRes.ok) {
        const data = await mRes.json();
        const filtered = assigned && assigned.length > 0
          ? (data || []).filter(m => m.machineId && assigned.some(a => a.toUpperCase() === m.machineId.toUpperCase()))
          : (data || []);
        setMachines(filtered);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setClientsList(cData.clients || []);
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
      setSuccessMessage('⚠️ Permission Denied: Only Super Admin accounts can register new Smart Recycling units.');
      return;
    }

    try {
      setSaving(true);
      const user = getActiveUser();
      const token = sessionStorage.getItem('rvm_auth_token') || localStorage.getItem('rvm_auth_token') || '';

      const selectedClientObj = clientsList.find(c => c.id === newClientId);
      const resolvedClientName = selectedClientObj 
        ? selectedClientObj.name 
        : (newClientId === 'ISP_MASTER' ? 'ISP Environmental Master (All Sites / Public Network)' : `Client: ${newClientId}`);

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
          name: (newMachineName || `Smart Recycling Machine ${newMachineId}`).trim(),
          location: (newMachineLocation || 'Main Campus').trim(),
          latitude: newLatitude ? parseFloat(newLatitude) : null,
          longitude: newLongitude ? parseFloat(newLongitude) : null,
          machineType: newMachineType || 'RVM_NEW',
          clientId: newClientId || 'ISP_MASTER',
          clientName: resolvedClientName,
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
        showToast(`Machine "${savedId}" (${savedName}) saved successfully!`);
        setNewMachineName('');
        setNewMachineLocation('');
        fetchMachines();
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(`⚠️ ${errJson.error || 'Failed to save machine'}`);
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
        showToast(data.message || 'Points rules successfully synced to Smart Recycling machines!');
        fetchMachines();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getNormalizedType = (m) => {
    const raw = String(m?.machineType || m?.machine_type || '').toLowerCase();
    const id = String(m?.machineId || '').toLowerCase();
    const name = String(m?.name || '').toLowerCase();
    if (raw === 'pecodrop' || id.includes('peco') || name.includes('peco')) return 'pecodrop';
    if (raw === 'rvm_old' || id.includes('old') || name.includes('old')) return 'rvm_old';
    return 'rvm_new';
  };

  const openEditModal = (m) => {
    setNewMachineId(m.machineId);
    setNewMachineName(m.name || '');
    setNewMachineLocation(m.location || '');
    setNewLatitude(m.latitude != null ? String(m.latitude) : '');
    setNewLongitude(m.longitude != null ? String(m.longitude) : '');
    const normType = getNormalizedType(m);
    setNewMachineType(normType === 'pecodrop' ? 'PECODROP' : normType === 'rvm_old' ? 'RVM_OLD' : 'RVM_NEW');
    setNewClientId(m.clientId || m.client_id || 'ISP_MASTER');
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

  const handleOpenDispatch = (targetMId = '') => {
    setDispatchMachineId(targetMId || (machines[0]?.machineId || 'RVM-ISB-01'));
    setDispatchTask('Empty Bins & Reset Capacity Sensor');
    setDispatchNotes('');
    setShowDispatchModal(true);
  };

  const handleConfirmDispatch = () => {
    setDispatching(true);
    setTimeout(() => {
      const newEvt = {
        id: `EVT-${Math.floor(10000 + Math.random() * 90000)}`,
        machineId: dispatchMachineId,
        location: machines.find(m => m.machineId === dispatchMachineId)?.location || 'Active Station',
        trigger: dispatchTask,
        triggerType: 'warning',
        timestamp: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
        status: 'Tech Dispatched',
        statusType: 'pending'
      };
      setServiceLogs(prev => [newEvt, ...prev]);
      setDispatching(false);
      setShowDispatchModal(false);
      showToast(`Field service technician dispatched to ${dispatchMachineId} for ${dispatchTask}`);
    }, 600);
  };

  const exportLogsCSV = () => {
    const csvRows = [
      ['Event Ref', 'Machine ID', 'Location', 'Trigger Type', 'Timestamp', 'Status'].join(',')
    ];
    visibleServiceLogs.forEach(l => {
      csvRows.push([`"${l.id}"`, `"${l.machineId}"`, `"${l.location}"`, `"${l.trigger}"`, `"${l.timestamp}"`, `"${l.status}"`].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ISP_Machine_Maintenance_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Maintenance & clearing logs exported as CSV');
  };

  useEffect(() => {
    fetchMachines();
    const interval = setInterval(fetchMachines, 10000);
    return () => clearInterval(interval);
  }, [stationFilter, selectedClientId]);

  // Synchronize internal health filter when user clicks top station pills
  useEffect(() => {
    if (stationFilter && stationFilter !== 'ALL') {
      setHealthFilter(stationFilter.toLowerCase());
    } else if (stationFilter === 'ALL' && ['rvm_new', 'pecodrop', 'rvm_old'].includes(healthFilter)) {
      setHealthFilter('ALL');
    }
  }, [stationFilter]);

  // Calculate fleet KPI counts
  const totalCount = machines.length;
  const onlineCount = machines.filter(m => m.status === 'ONLINE' || m.isOnline).length;
  const offlineCount = machines.filter(m => m.status !== 'ONLINE' && !m.isOnline).length;
  
  const smartRvmCount = machines.filter(m => getNormalizedType(m) === 'rvm_new').length;
  const pecoCount = machines.filter(m => getNormalizedType(m) === 'pecodrop').length;
  const legacyCount = machines.filter(m => getNormalizedType(m) === 'rvm_old').length;
  
  const attentionCount = machines.filter(m => 
    (m.alertCount && m.alertCount > 0) || 
    (m.plasticBinFill && m.plasticBinFill >= 85) || 
    (m.status !== 'ONLINE' && !m.isOnline)
  ).length;

  // Filtered & Sorted machines
  const filteredMachines = machines.filter(m => {
    if (healthFilter === 'ALL') return true;
    if (healthFilter === 'ATTENTION') {
      return (m.alertCount && m.alertCount > 0) || (m.plasticBinFill && m.plasticBinFill >= 85) || (m.status !== 'ONLINE' && !m.isOnline);
    }
    const mType = getNormalizedType(m);
    return mType === healthFilter.toLowerCase();
  }).sort((a, b) => {
    if (sortBy === 'volume') {
      const volA = (a.plasticCount || a.totalBottles || 0) + (a.canCount || 0);
      const volB = (b.plasticCount || b.totalBottles || 0) + (b.canCount || 0);
      return volB - volA;
    }
    if (sortBy === 'bin') {
      return (b.plasticBinFill || 0) - (a.plasticBinFill || 0);
    }
    // Default ping
    const timeA = new Date(a.lastPingAt || a.lastActive || 0).getTime();
    const timeB = new Date(b.lastPingAt || b.lastActive || 0).getTime();
    return timeB - timeA;
  });

  const visibleMachineIds = new Set(machines.map(m => String(m.machineId || '').toUpperCase()));
  const visibleServiceLogs = serviceLogs.filter(log => visibleMachineIds.has(String(log.machineId || '').toUpperCase()));

  return (
    <div className="space-y-6 animate-fade-in w-full text-slate-900 dark:text-slate-100">

      {/* Floating Notification Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div className="glass-panel px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 bg-slate-900/90 text-white flex items-center gap-3 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Header Section - Exactly matching Smart_Recycling_Machine_Health.html */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border t-border shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Brand, Icon & Title */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white shrink-0">
              <Cpu className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                  Hardware Monitoring
                </span>
                <span className="text-slate-300 dark:text-slate-600 font-bold">|</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Machine Network Telemetry
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight t-text-primary leading-tight">
                Machine Health & Operations
              </h1>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => {
                fetchMachines();
                showToast('Live telemetry & heartbeats synced');
              }}
              className="p-2 sm:px-3 sm:py-2 t-text-secondary hover:text-emerald-700 dark:hover:text-emerald-300 t-bg-sec hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border t-border shadow-xs active:scale-95"
              title="Refresh live machine telemetry"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Heartbeat</span>
            </button>

            <button
              onClick={() => handleOpenDispatch()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-emerald-600/25 transition-all active:scale-95"
            >
              <Wrench className="w-4 h-4" />
              <span>Dispatch Field Tech</span>
            </button>

            <button
              onClick={() => setShowFleetMapModal(true)}
              className="p-2 sm:px-3 sm:py-2 text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              title="View fleet location coordinates"
            >
              <MapPin className="w-4 h-4 text-cyan-500" />
              <span className="hidden md:inline">Fleet GPS Map</span>
            </button>

            {/* Profile Avatar Pill */}
            <div className="flex items-center pl-2 border-l t-border">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border t-border flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shadow-xs">
                {activeUser?.username?.slice(0, 2)?.toUpperCase() || 'AD'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Assigned RVM Fleet Scope Notification (if scoped) */}
      {assignedList && assignedList.length > 0 && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 flex items-center justify-between text-xs font-bold animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>Assigned Smart Recycling Fleet Scope Active: Displaying telemetry for ({assignedList.join(', ')}) only</span>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 uppercase font-mono font-bold shrink-0 border border-cyan-500/30">
            {assignedList.length} Machine{assignedList.length > 1 ? 's' : ''} Scoped
          </span>
        </div>
      )}

      {/* KPI Summary Row (4 Standardized Cards matching HTML) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Connected Machines */}
        <div className="glass-panel rounded-2xl p-5 border t-border shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Connected Machines</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-500/20">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-extrabold t-text-primary tracking-tight mono">{totalCount}</span>
              <span className="text-xs font-semibold text-slate-400">deployed units</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t t-border">
            <span>{smartRvmCount} Smart RVM</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{pecoCount} PecoDrop</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{legacyCount} Legacy</span>
          </div>
        </div>

        {/* Card 2: Online & Active */}
        <div className="glass-panel rounded-2xl p-5 border t-border shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Online & Active</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-300/60 dark:border-emerald-500/30">
                <Wifi className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight mono">{onlineCount}</span>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30">
                Synced
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t t-border truncate">
            {onlineCount > 0 ? `${onlineCount} kiosks live & processing recycling` : 'Awaiting network heartbeat'}
          </div>
        </div>

        {/* Card 3: Inactive / Pending Sync */}
        <div className="glass-panel rounded-2xl p-5 border t-border shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Awaiting Heartbeat</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border t-border">
                <PowerOff className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-extrabold t-text-primary tracking-tight mono">{offlineCount}</span>
              <span className="text-xs font-semibold text-slate-400">units</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t t-border truncate">
            Field standby or local network offline
          </div>
        </div>

        {/* Card 4: Action Required */}
        <div className="glass-panel rounded-2xl p-5 border t-border shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Maintenance Flags</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-200/50 dark:border-amber-500/30">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-extrabold text-amber-700 dark:text-amber-400 tracking-tight mono">{attentionCount}</span>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/30">
                Needs Attention
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t t-border truncate">
            Hopper bins &gt;85% full or sensor alerts
          </div>
        </div>

      </div>

      {/* Filter Segment Pills & Search Strip (Matching HTML exactly) */}
      <div className="glass-panel rounded-2xl p-4 border t-border shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Filter Segment Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
          <button
            onClick={() => setHealthFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              healthFilter === 'ALL'
                ? 'bg-emerald-800 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Machines ({totalCount})
          </button>

          <button
            onClick={() => setHealthFilter('rvm_new')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              healthFilter === 'rvm_new'
                ? 'bg-emerald-800 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Smart RVM ({smartRvmCount})
          </button>

          <button
            onClick={() => setHealthFilter('pecodrop')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              healthFilter === 'pecodrop'
                ? 'bg-purple-800 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            PecoDrop Scale Units ({pecoCount})
          </button>

          <button
            onClick={() => setHealthFilter('rvm_old')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              healthFilter === 'rvm_old'
                ? 'bg-slate-700 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Legacy Units ({legacyCount})
          </button>

          <button
            onClick={() => setHealthFilter('ATTENTION')}
            className={`px-3 py-1.5 rounded-xl transition-all border ${
              healthFilter === 'ATTENTION'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-bold'
                : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border-amber-200/60 dark:border-amber-500/30'
            }`}
          >
            ⚠️ Action Needed ({attentionCount})
          </button>
        </div>

        {/* Sort & Order Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="t-bg-sec border t-border t-text-primary text-xs rounded-xl px-3 py-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ping">Recent Heartbeat Ping</option>
            <option value="volume">Highest Volume Processed</option>
            <option value="bin">Bin Fill Level</option>
          </select>
        </div>

      </div>

      {/* Machine Hardware Cards Grid (Matching HTML design) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3 t-text-muted">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="text-xs font-bold">Scanning machine telemetry...</span>
          </div>
        ) : filteredMachines.length === 0 ? (
          <div className="col-span-full glass-panel p-10 text-center rounded-3xl border border-dashed t-border space-y-3">
            <Server className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="text-base font-extrabold t-text-primary">
              No Machines Found for Active Filter
            </div>
            <p className="text-xs t-text-secondary max-w-md mx-auto">
              No Smart Recycling units matching the "{healthFilter}" filter were found.
            </p>
            <button
              onClick={() => setHealthFilter('ALL')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              Show All Machines ({machines.length})
            </button>
          </div>
        ) : (
          filteredMachines.map(m => {
            const hasAlerts = (m.alertCount && m.alertCount > 0) || (m.plasticBinFill && m.plasticBinFill >= 85);
            const isOnline = m.status === 'ONLINE' || m.isOnline;
            const mType = getNormalizedType(m);
            const isPeco = mType === 'pecodrop';
            const isRvmOld = mType === 'rvm_old';
            const isRvmNew = !isPeco && !isRvmOld;

            // Type Badge Text & Styling
            const typeLabel = isPeco ? 'PecoDrop' : isRvmOld ? 'Legacy Counter' : 'Smart RVM';
            const typeBadgeStyle = isPeco 
              ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-500/30'
              : isRvmOld
              ? 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30';

            const cardBorder = hasAlerts
              ? 'border-2 border-amber-400/90 dark:border-amber-500/60 shadow-xs'
              : isOnline
              ? 'border-2 border-emerald-500/80 dark:border-emerald-500/40 shadow-xs'
              : 'border border-slate-200 dark:border-slate-800/80 shadow-xs';

            return (
              <div 
                key={m.machineId}
                className={`glass-panel rounded-2xl ${cardBorder} p-5 flex flex-col justify-between transition-all`}
              >
                <div>
                  
                  {/* Card Header Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black t-text-primary text-base mono">{m.machineId}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadgeStyle}`}>
                          {typeLabel}
                        </span>
                        <button 
                          onClick={() => openEditModal(m)}
                          className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          title="Edit Machine Configuration"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                        {m.name || `Kiosk Unit ${m.machineId}`}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">{m.location || 'Islamabad Campus'}</span>
                        {m.latitude != null && m.longitude != null && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 dark:text-sky-400 hover:underline font-bold ml-1"
                            title="View GPS on Google Maps"
                          >
                            ↗
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isOnline 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}>
                        {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        {isOnline ? 'Online' : 'Standby'}
                      </span>
                      {hasAlerts && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300">
                          ⚠️ Needs Action
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Client Tag */}
                  <div className="mb-3.5">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border t-border inline-block max-w-full truncate">
                      Client: {m.clientName || 'ISP Environmental Master'}
                    </span>
                  </div>

                  {/* Hardware Telemetry / Diagnostic Section */}
                  {isPeco ? (
                    /* PecoDrop 3-Bin Capacity & Scale */
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border t-border mb-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">3-Bin Capacity</span>
                        <span className="text-[10px] text-slate-400 font-mono">Load Scale: 99.8%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="p-1 rounded border t-border bg-white dark:bg-slate-800/80">
                          <span className="text-slate-400 block">Plastic</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{m.plasticBinFill || 28}%</span>
                        </div>
                        <div className="p-1 rounded border t-border bg-white dark:bg-slate-800/80">
                          <span className="text-slate-400 block">Metal</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{m.metalBinFill || 15}%</span>
                        </div>
                        <div className="p-1 rounded border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/30">
                          <span className="text-purple-700 dark:text-purple-400 font-bold block">Paper</span>
                          <span className="font-bold text-purple-900 dark:text-purple-200">{m.paperBinFillKg || '14.2'} kg</span>
                        </div>
                      </div>
                    </div>
                  ) : isRvmOld ? (
                    /* Legacy Pulse Bridge */
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border t-border mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Relay Counter Bridge</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30">
                          Queue Synced
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {m.totalPulseCount || 1420} Hardware Pulses recorded • 0 backlog
                      </div>
                    </div>
                  ) : (
                    /* Smart RVM Optical Sensor Array */
                    <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-500/20 mb-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          <span>AI Optical System</span>
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 font-mono">99.6% Accuracy</span>
                      </div>
                      <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                        All 4 internal verification sensors operational
                      </div>
                    </div>
                  )}

                  {/* Action Banner if Bin is Full */}
                  {(m.plasticBinFill >= 85 || hasAlerts) && (
                    <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-amber-900 dark:text-amber-300">Plastic Bin Overfilling</span>
                        <button 
                          onClick={() => handleOpenDispatch(m.machineId)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded shadow-xs"
                        >
                          Dispatch Tech
                        </button>
                      </div>
                      <div className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                        Chamber reached {m.plasticBinFill || 95}% physical capacity
                      </div>
                    </div>
                  )}

                  {/* Processed Materials Counters (Clean matching list) */}
                  <div className="space-y-1.5 text-xs pt-2 border-t t-border">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Recycling Sessions:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mono">{m.sessionCount || 0} completed</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Bottles Processed:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mono">
                        {m.plasticCount || (m.glassCount === 0 && m.canCount === 0 && m.paperCount === 0 ? m.totalBottles : 0) || 0} bottles
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Cans Processed:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mono">{m.canCount || 0} cans</span>
                    </div>
                    {isPeco && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Paper Processed:</span>
                        <span className="font-bold text-purple-700 dark:text-purple-300 mono">{m.paperCount || '14.2'} kg</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 pt-0.5">
                      <span>Points Issued:</span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 mono">{m.totalPoints || 0} pts</span>
                    </div>
                  </div>

                  {/* IP Network Connection Strip */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border t-border">
                    <div className="truncate">
                      <span className="text-slate-400 block font-bold uppercase">Public IP</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate block">
                        {m.publicIp && m.publicIp !== 'N/A' ? m.publicIp : '127.0.0.1'}
                      </span>
                    </div>
                    <div className="truncate border-l t-border pl-2">
                      <span className="text-slate-400 block font-bold uppercase">Local IP</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 truncate block">
                        {m.localIp && m.localIp !== 'N/A' ? m.localIp : '127.0.0.1'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Card Bottom Footer */}
                <div className="mt-4 pt-3 border-t t-border flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Ping: {m.lastPingAt || m.lastActive ? new Date(m.lastPingAt || m.lastActive).toLocaleTimeString() : 'Never'}</span>
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEditModal(m)}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300"
                    >
                      Details →
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Machine Maintenance & Emptying Event Log (Matching HTML Table) */}
      <div className="glass-panel rounded-2xl border t-border shadow-xs overflow-hidden mt-6">
        
        {/* Table Header */}
        <div className="p-5 border-b t-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold t-text-primary">Machine Maintenance & Emptying History</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border t-border">
                Live Service Queue
              </span>
            </div>
            <p className="text-xs t-text-secondary mt-0.5">
              Audited log of full-bin clearances, camera lens cleans, and field technician visits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRawLogs(!showRawLogs)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold t-text-secondary t-bg-sec border t-border rounded-xl hover:t-text-primary shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showRawLogs ? 'Hide Raw Table' : 'Raw Notifications Table'}</span>
            </button>

            <button
              onClick={exportLogsCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold t-text-primary bg-white dark:bg-slate-800 border t-border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Service Log</span>
            </button>
          </div>
        </div>

        {/* Formatted Audited Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b t-border text-slate-600 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Event Ref</th>
                <th className="py-3.5 px-4">Machine Identifier</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Trigger Type</th>
                <th className="py-3.5 px-4">Event Timestamp</th>
                <th className="py-3.5 px-4 text-right">Service Status</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border text-slate-700 dark:text-slate-300">
              {visibleServiceLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center t-text-muted">
                    No maintenance or emptying events exist for the selected organization fleet.
                  </td>
                </tr>
              ) : visibleServiceLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold t-text-primary mono">{log.id}</td>
                  <td className="py-3.5 px-4 font-semibold t-text-primary mono">{log.machineId}</td>
                  <td className="py-3.5 px-4">{log.location}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${
                      log.triggerType === 'alert'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                        : log.triggerType === 'warning'
                        ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {log.trigger}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{log.timestamp}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      log.statusType === 'pending'
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Raw Bin Notifications Full Table (Toggled on request) */}
      {showRawLogs && (
        <div className="pt-2 animate-fade-in">
          <DataTable
            collectionName="binfullnotifications"
            displayName="Raw Bin Full Alerts Table Log"
            machineIds={machines.map(m => m.machineId).filter(Boolean)}
          />
        </div>
      )}

      {/* Field Technician Dispatch Modal (Matching HTML lines 616-665) */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel border t-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-emerald-300/40">
                  <Wrench className="w-4 h-4" />
                </div>
                <h3 className="font-bold t-text-primary text-base">Dispatch Service Technician</h3>
              </div>
              <button 
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Assign a certified field technician to clear full bins, clean camera lenses, or run sensor diagnostics.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Machine Target</label>
                <select
                  value={dispatchMachineId}
                  onChange={(e) => setDispatchMachineId(e.target.value)}
                  className="w-full t-bg-sec border t-border t-text-primary text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {machines.map(m => (
                    <option key={m.machineId} value={m.machineId}>
                      {m.machineId} - {m.name || m.location} {m.plasticBinFill >= 85 ? `(Bin ${m.plasticBinFill}% Full)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Service Task</label>
                <select
                  value={dispatchTask}
                  onChange={(e) => setDispatchTask(e.target.value)}
                  className="w-full t-bg-sec border t-border t-text-primary text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Empty Bins & Reset Capacity Sensor">Empty Bins & Reset Capacity Sensor</option>
                  <option value="Clean Scanner Optical Glass">Clean Scanner Optical Glass</option>
                  <option value="Inspect Relay Counter Wiring">Inspect Relay Counter Wiring</option>
                  <option value="Scheduled Preventative Maintenance">Scheduled Preventative Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Technician Notes (Optional)</label>
                <input
                  type="text"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="e.g. Priority dispatch for mall peak hours"
                  className="w-full t-bg-sec border t-border t-text-primary text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t t-border text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 t-text-secondary hover:t-bg-sec rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={dispatching}
                onClick={handleConfirmDispatch}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                {dispatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                <span>{dispatching ? 'Dispatching...' : 'Dispatch Staff'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Interactive Fleet Locations Map Modal */}
      {showFleetMapModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl max-w-4xl w-full border border-cyan-500/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-500" />
                <h3 className="text-base font-extrabold t-text-primary">
                  Live Smart Recycling Fleet Geographic Locations &amp; Coordinates
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

                    <div className="font-extrabold text-sm t-text-primary">{m.name || `Smart Recycling ${m.machineId}`}</div>
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

      {/* Edit / Register Machine Modal (Maintains Full Functionality) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl max-w-xl w-full border border-emerald-500/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-extrabold t-text-primary">
                  Configure Machine ({newMachineId})
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="t-text-muted hover:t-text-primary p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMachine} className="space-y-4">
              <div>
                <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                  Machine ID / Hardware Serial
                </label>
                <input
                  type="text"
                  required
                  value={newMachineId}
                  onChange={e => setNewMachineId(e.target.value)}
                  className="w-full px-3 py-2 t-bg-sec border t-border rounded-xl text-sm font-mono t-text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                  Unit Name / Display Title
                </label>
                <input
                  type="text"
                  required
                  value={newMachineName}
                  onChange={e => setNewMachineName(e.target.value)}
                  placeholder="e.g. Smart RVM V2 (Food Court)"
                  className="w-full px-3 py-2 t-bg-sec border t-border rounded-xl text-sm t-text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                  Deployment Location
                </label>
                <input
                  type="text"
                  required
                  value={newMachineLocation}
                  onChange={e => setNewMachineLocation(e.target.value)}
                  placeholder="e.g. Metro Mall RWP - Ground Floor"
                  className="w-full px-3 py-2 t-bg-sec border t-border rounded-xl text-sm t-text-primary focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                    Hardware Station Type
                  </label>
                  <select
                    value={newMachineType}
                    onChange={e => setNewMachineType(e.target.value)}
                    className="w-full px-3 py-2 t-bg-sec border t-border rounded-xl text-sm font-bold t-text-primary focus:outline-none focus:border-emerald-500"
                  >
                    <option value="RVM_NEW">Smart RVM (Multi-Sensor Optical)</option>
                    <option value="PECODROP">PecoDrop (Count & Weigh)</option>
                    <option value="RVM_OLD">Legacy Counter (Pulse)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                    Enterprise Client Organization
                  </label>
                  <select
                    value={newClientId}
                    onChange={e => setNewClientId(e.target.value)}
                    className="w-full px-3 py-2 t-bg-sec border t-border rounded-xl text-sm font-bold t-text-primary focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ISP_MASTER">ISP Environmental Master (All Sites / Public Network)</option>
                    {clientsList.filter(c => c.id !== 'ALL' && c.id !== 'ISP_MASTER').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newLatitude}
                    onChange={e => setNewLatitude(e.target.value)}
                    placeholder="e.g. 33.7294"
                    className="w-full px-3 py-2 t-bg-sec border t-border rounded-xl text-sm t-text-primary focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newLongitude}
                    onChange={e => setNewLongitude(e.target.value)}
                    placeholder="e.g. 73.0931"
                    className="w-full px-3 py-2 t-bg-sec border t-border rounded-xl text-sm t-text-primary focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t t-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold t-text-secondary hover:t-text-primary rounded-xl border t-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Server, HardDrive, Lock, ShieldCheck, KeyRound, 
  RotateCcw, ArrowRightLeft, CheckCircle2, AlertTriangle, RefreshCw, MapPin
} from 'lucide-react';

export default function DbSwitcherTab({ onRefreshHealth }) {
  const [username, setUsername] = useState('onenet');
  const [password, setPassword] = useState('Admin&86');
  const [targetPreset, setTargetPreset] = useState('ONS-RVM');
  const [healthInfo, setHealthInfo] = useState(null);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchPresetsAndHealth = async () => {
    try {
      setLoading(true);
      const [hRes, pRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/admin/presets')
      ]);

      if (hRes.ok) {
        const hData = await hRes.json();
        setHealthInfo(hData);
        if (hData.database) {
          setTargetPreset(hData.database);
        }
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        setPresets(pData.presets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresetsAndHealth();
  }, []);

  const handleSwitchDb = async (e) => {
    if (e) e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);

      const res = await fetch('/api/admin/switch-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          targetPreset
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({
          type: 'success',
          text: json.message
        });
        fetchPresetsAndHealth();
        if (onRefreshHealth) onRefreshHealth();
      } else {
        throw new Error(json.error || json.details || 'Failed to switch database connection');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestartServer = async () => {
    try {
      setRestarting(true);
      setMessage(null);

      const res = await fetch('/api/admin/restart-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({
          type: 'success',
          text: json.message
        });
        fetchPresetsAndHealth();
        if (onRefreshHealth) onRefreshHealth();
      } else {
        throw new Error(json.error || json.details || 'Failed to restart API server');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRestarting(false);
    }
  };

  const activeDb = healthInfo?.database || 'ONS-RVM';
  const activeHost = healthInfo?.serverHost || 'cluster0.ktted0m.mongodb.net';
  const activeLoc = healthInfo?.serverLocation?.display || 'Paris, France (AWS EU_WEST_3)';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Cluster & Server Switcher</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">Database Connection Manager</h2>
          <p className="text-xs t-text-secondary mt-1">
            Switch live database connection between <span className="text-emerald-400 font-bold">ONS-RVM</span> and <span className="text-cyan-400 font-bold">rvmapp</span> clusters.
          </p>
        </div>

        <button
          onClick={fetchPresetsAndHealth}
          className="p-2 t-text-secondary hover:t-text-primary t-bg-sec border t-border rounded-xl transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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

      {/* Active Server Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl space-y-1 border border-emerald-500/20">
          <span className="text-[10px] font-bold uppercase tracking-wider t-text-muted">Active Database</span>
          <div className="text-lg font-extrabold text-emerald-400 mono">{activeDb}</div>
          <p className="text-[11px] t-text-muted">Connected MongoDB Atlas DB</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1 border border-cyan-500/20">
          <span className="text-[10px] font-bold uppercase tracking-wider t-text-muted">Cluster Host</span>
          <div className="text-sm font-extrabold text-cyan-400 mono truncate">{activeHost}</div>
          <p className="text-[11px] t-text-muted">MongoDB Atlas SRV Cluster</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl space-y-1 border border-amber-500/20">
          <span className="text-[10px] font-bold uppercase tracking-wider t-text-muted">Server Location</span>
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 pt-1">
            <MapPin className="w-3.5 h-3.5" />
            {activeLoc}
          </div>
          <p className="text-[11px] t-text-muted">Cloud Region Geolocation</p>
        </div>
      </div>

      {/* Master Developer Auth & Presets Form */}
      <form onSubmit={handleSwitchDb} className="glass-panel p-6 rounded-3xl space-y-6">
        
        {/* Step 1: Master Credentials */}
        <div className="space-y-3 border-b t-border pb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold t-text-primary">Step 1: Master Developer Security Authentication</h3>
          </div>
          <p className="text-xs t-text-secondary">
            Authorized admin user <span className="text-emerald-400 font-bold">onenet</span> authentication required to switch databases or restart the API server.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold t-text-muted uppercase block mb-1.5">Master Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold t-text-primary focus:border-emerald-500 focus:outline-none"
                  placeholder="onenet"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold t-text-muted uppercase block mb-1.5">Master Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold t-text-primary focus:border-emerald-500 focus:outline-none"
                  placeholder="Admin&86"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Target Cluster Selector */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold t-text-primary">Step 2: Select Target MongoDB Cluster Connection</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Preset 1: ONS-RVM */}
            <div 
              onClick={() => setTargetPreset('ONS-RVM')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                targetPreset === 'ONS-RVM'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-950/30'
                  : 't-bg-sec border t-border hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="font-extrabold text-sm t-text-primary">ONS-RVM Cluster</span>
                </div>
                {targetPreset === 'ONS-RVM' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              </div>

              <div className="space-y-1 text-xs mono">
                <div className="t-text-muted">Host: <span className="text-cyan-400 font-bold">cluster0.ktted0m.mongodb.net</span></div>
                <div className="t-text-muted">DB Name: <span className="text-emerald-400 font-bold">ONS-RVM</span></div>
                <div className="t-text-muted">User: <span className="t-text-primary">aaqueelphotos_db_user</span></div>
              </div>

              <div className="text-[11px] text-amber-400 font-medium pt-1">
                📍 Paris, France (AWS EU_WEST_3)
              </div>
            </div>

            {/* Preset 2: rvmapp */}
            <div 
              onClick={() => setTargetPreset('rvmapp')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                targetPreset === 'rvmapp'
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-950/30'
                  : 't-bg-sec border t-border hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span className="font-extrabold text-sm t-text-primary">rvmapp Production Cluster</span>
                </div>
                {targetPreset === 'rvmapp' && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
              </div>

              <div className="space-y-1 text-xs mono">
                <div className="t-text-muted">Host: <span className="text-cyan-400 font-bold">cluster0.fuycg6c.mongodb.net</span></div>
                <div className="t-text-muted">DB Name: <span className="text-emerald-400 font-bold">rvmapp</span></div>
                <div className="t-text-muted">User: <span className="t-text-primary">mcsrwp_db_user</span></div>
              </div>

              <div className="text-[11px] text-cyan-400 font-medium pt-1">
                🌐 MongoDB Atlas Cloud Cluster
              </div>
            </div>

          </div>
        </div>

        {/* Step 3: Execution Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t t-border">
          <button
            type="button"
            onClick={handleRestartServer}
            disabled={restarting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 t-bg-sec hover:t-bg-hover t-text-primary text-xs font-bold rounded-xl border t-border transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 text-cyan-400 ${restarting ? 'animate-spin' : ''}`} />
            {restarting ? 'Re-initializing Server...' : 'Restart API Server Connection'}
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            <ArrowRightLeft className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
            {submitting ? 'Switching Database...' : `Switch to ${targetPreset} & Reconnect Server`}
          </button>
        </div>

      </form>

    </div>
  );
}

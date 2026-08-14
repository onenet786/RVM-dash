import React, { useState, useEffect } from 'react';
import { 
  Server, HardDrive, Lock, ShieldCheck, KeyRound, 
  RotateCcw, ArrowRightLeft, CheckCircle2, AlertTriangle, RefreshCw, MapPin, Database, Zap, RefreshCcw, Layers
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
  const [syncing, setSyncing] = useState(false);
  const [syncMode, setSyncMode] = useState('upsert');
  const [message, setMessage] = useState(null);

  // PostgreSQL Connection & Sync State
  const [pgHost, setPgHost] = useState('127.0.0.1');
  const [pgPort, setPgPort] = useState('5432');
  const [pgUser, setPgUser] = useState('postgres');
  const [pgPassword, setPgPassword] = useState('');
  const [pgDatabase, setPgDatabase] = useState('rvm_postgres');
  const [pgConnString, setPgConnString] = useState('');
  const [pgTesting, setPgTesting] = useState(false);
  const [pgSyncing, setPgSyncing] = useState(false);
  const [pgResult, setPgResult] = useState(null);

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

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
        await fetchPresetsAndHealth();
        if (onRefreshHealth) onRefreshHealth();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to switch database' });
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
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setTimeout(() => {
          fetchPresetsAndHealth();
          if (onRefreshHealth) onRefreshHealth();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRestarting(false);
    }
  };

  const handleOneWaySync = async () => {
    try {
      setSyncing(true);
      setMessage(null);

      const res = await fetch('/api/admin/sync-databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          sourcePreset: 'rvmapp',
          targetPreset: 'ONS-RVM',
          mode: syncMode
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
        await fetchPresetsAndHealth();
        if (onRefreshHealth) onRefreshHealth();
      } else {
        setMessage({ type: 'error', text: data.error || 'Sync failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestPostgres = async () => {
    try {
      setPgTesting(true);
      setPgResult(null);
      const res = await fetch('/api/admin/test-postgres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: pgHost,
          port: pgPort,
          user: pgUser,
          password: pgPassword,
          database: pgDatabase,
          connectionString: pgConnString
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPgResult({ success: true, message: data.message, database: data.database, user: data.user, version: data.version });
      } else {
        setPgResult({ success: false, message: data.error || 'PostgreSQL Connection Test Failed' });
      }
    } catch (err) {
      setPgResult({ success: false, message: err.message });
    } finally {
      setPgTesting(false);
    }
  };

  const handleSyncPostgres = async () => {
    try {
      setPgSyncing(true);
      setPgResult(null);
      const res = await fetch('/api/admin/sync-postgres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: pgHost,
          port: pgPort,
          user: pgUser,
          password: pgPassword,
          database: pgDatabase,
          connectionString: pgConnString
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPgResult({
          success: true,
          message: data.message,
          syncedTables: data.syncedTables,
          totalSyncedDocs: data.totalSyncedDocs
        });
      } else {
        setPgResult({ success: false, message: data.error || 'PostgreSQL Data Sync Failed' });
      }
    } catch (err) {
      setPgResult({ success: false, message: err.message });
    } finally {
      setPgSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 t-text-muted gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-semibold">Loading Database Manager Presets...</p>
      </div>
    );
  }

  const activeDb = healthInfo?.database || 'ONS-RVM';
  const activeHost = healthInfo?.serverHost || 'cluster0.ktted0m.mongodb.net';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden border border-emerald-500/20 glow-emerald">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Control
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Connected: {activeDb}
              </span>
            </div>
            <h1 className="text-2xl font-black t-text-primary tracking-tight mt-2">
              Database Connection & PostgreSQL Sync Manager
            </h1>
            <p className="text-xs t-text-muted mt-1 max-w-2xl">
              Switch runtime MongoDB cluster instances, stream one-way database sync, or synchronize data directly to PostgreSQL running on your hosting server.
            </p>
          </div>

          <button
            onClick={fetchPresetsAndHealth}
            className="px-4 py-2.5 t-bg-sec hover:t-bg-hover t-text-primary border t-border rounded-2xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" /> Refresh Connection
          </button>
        </div>
      </div>

      {/* Message Feedback */}
      {message && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 animate-fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Section 1: PostgreSQL Hosting Server Sync Engine */}
      <div className="glass-panel p-6 rounded-3xl space-y-5 border border-cyan-500/30 glow-cyan">
        <div className="flex items-center justify-between border-b t-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black t-text-primary">🐘 PostgreSQL Hosting Server Sync Engine</h2>
              <p className="text-xs t-text-muted mt-0.5">
                Export and synchronize MongoDB collections into PostgreSQL tables on your local/remote server with UPSERT duplicate protection.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 text-[11px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl">
            PostgreSQL v12+
          </span>
        </div>

        {/* PostgreSQL Connection Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider t-text-muted mb-1 block">PG Host</label>
            <input
              type="text"
              value={pgHost}
              onChange={(e) => setPgHost(e.target.value)}
              placeholder="127.0.0.1"
              className="w-full px-3 py-2 text-xs rounded-xl t-bg-sec border t-border t-text-primary mono focus:border-cyan-400 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider t-text-muted mb-1 block">PG Port</label>
            <input
              type="text"
              value={pgPort}
              onChange={(e) => setPgPort(e.target.value)}
              placeholder="5432"
              className="w-full px-3 py-2 text-xs rounded-xl t-bg-sec border t-border t-text-primary mono focus:border-cyan-400 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider t-text-muted mb-1 block">PG User</label>
            <input
              type="text"
              value={pgUser}
              onChange={(e) => setPgUser(e.target.value)}
              placeholder="postgres"
              className="w-full px-3 py-2 text-xs rounded-xl t-bg-sec border t-border t-text-primary mono focus:border-cyan-400 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider t-text-muted mb-1 block">PG Password</label>
            <input
              type="password"
              value={pgPassword}
              onChange={(e) => setPgPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 text-xs rounded-xl t-bg-sec border t-border t-text-primary mono focus:border-cyan-400 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider t-text-muted mb-1 block">PG Database Name</label>
            <input
              type="text"
              value={pgDatabase}
              onChange={(e) => setPgDatabase(e.target.value)}
              placeholder="rvm_postgres"
              className="w-full px-3 py-2 text-xs rounded-xl t-bg-sec border t-border t-text-primary mono focus:border-cyan-400 outline-none"
            />
          </div>
        </div>

        {/* PostgreSQL Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t t-border">
          <button
            onClick={handleTestPostgres}
            disabled={pgTesting}
            className="w-full sm:w-auto px-5 py-2.5 t-bg-sec hover:t-bg-hover text-cyan-400 font-bold text-xs rounded-xl border t-border flex items-center justify-center gap-2 transition-all"
          >
            <Database className={`w-4 h-4 ${pgTesting ? 'animate-spin' : ''}`} />
            {pgTesting ? 'Testing PostgreSQL...' : 'Test PostgreSQL Connection'}
          </button>

          <button
            onClick={handleSyncPostgres}
            disabled={pgSyncing}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${pgSyncing ? 'animate-spin' : ''}`} />
            {pgSyncing ? 'Synchronizing to PostgreSQL...' : `Sync MongoDB (${activeDb}) ➔ PostgreSQL`}
          </button>
        </div>

        {/* PostgreSQL Test/Sync Feedback Result */}
        {pgResult && (
          <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-fade-in ${
            pgResult.success 
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' 
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {pgResult.success ? <CheckCircle2 className="w-4 h-4 text-cyan-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>{pgResult.message}</span>
            </div>

            {pgResult.syncedTables && (
              <div className="pt-2 border-t border-cyan-500/20">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  Synchronized PostgreSQL Tables ({pgResult.totalSyncedDocs} Total Records):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {pgResult.syncedTables.map((t) => (
                    <div key={t.name} className="p-2 t-bg-sec rounded-lg border t-border text-center">
                      <div className="text-[11px] font-bold text-emerald-400 truncate">{t.tableName}</div>
                      <div className="text-[10px] t-text-muted">{t.count} Records</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: One-Way MongoDB Database Sync Engine */}
      <div className="glass-panel p-6 rounded-3xl space-y-5 border border-purple-500/30 glow-purple">
        <div className="flex items-center justify-between border-b t-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black t-text-primary">One-Way MongoDB Sync Engine</h2>
              <p className="text-xs t-text-muted mt-0.5">
                Stream and synchronize all 18,000+ documents from <span className="text-cyan-400 font-bold">rvmapp</span> into <span className="text-emerald-400 font-bold">ONS-RVM</span>.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 text-[11px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl">
            Read-Only Protection Active
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 t-bg-sec border t-border rounded-2xl">
          <div>
            <div className="text-xs font-bold t-text-primary">Source: <span className="text-cyan-400">rvmapp</span> (Read-Only) ➔ Target: <span className="text-emerald-400">ONS-RVM</span></div>
            <div className="text-[11px] t-text-muted mt-0.5">Syncs all recycling sessions, user profiles, feedbacks, redemptions, and alerts cleanly without data loss.</div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleOneWaySync}
              disabled={syncing}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Streaming Data Sync...' : 'Sync Data (rvmapp ➔ ONS-RVM)'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Runtime MongoDB Presets */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div>
          <h2 className="text-base font-bold t-text-primary">MongoDB Cluster Presets</h2>
          <p className="text-xs t-text-muted mt-0.5">
            Select a target database preset below and authorize with Master Developer credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map((p) => {
            const isCurrent = p.dbName === activeDb;
            const isSelected = p.id === targetPreset;

            return (
              <div
                key={p.id}
                onClick={() => setTargetPreset(p.id)}
                className={`p-5 rounded-3xl border cursor-pointer transition-all space-y-3 relative ${
                  isSelected
                    ? 'border-emerald-500 t-bg-sec shadow-lg shadow-emerald-950/30'
                    : 't-border t-bg-surface hover:t-bg-hover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm t-text-primary">{p.label}</span>
                  {isCurrent ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase t-bg-sec t-text-muted border t-border">
                      Standby
                    </span>
                  )}
                </div>

                <p className="text-xs t-text-secondary">{p.description}</p>

                <div className="space-y-1 text-xs mono">
                  <div className="text-cyan-400 font-semibold">{p.host}</div>
                  <div className="t-text-muted text-[11px]">Database: <span className="text-emerald-400 font-bold">{p.dbName}</span></div>
                </div>

                <div className="pt-2 border-t t-border flex items-center justify-between">
                  <span className="text-[11px] t-text-muted font-bold">Select Preset</span>
                  <input
                    type="radio"
                    name="presetSelect"
                    checked={isSelected}
                    onChange={() => setTargetPreset(p.id)}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t t-border">
        <button
          onClick={handleRestartServer}
          disabled={restarting}
          className="w-full sm:w-auto px-4 py-2.5 t-bg-sec hover:t-bg-hover text-cyan-400 font-bold text-xs rounded-xl border t-border flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className={`w-4 h-4 ${restarting ? 'animate-spin' : ''}`} />
          {restarting ? 'Re-initializing Server...' : 'Restart API Server Connection'}
        </button>

        <button
          onClick={handleSwitchDb}
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <ArrowRightLeft className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
          {submitting ? 'Connecting to Cluster...' : `Switch to "${targetPreset}" & Reconnect Server`}
        </button>
      </div>

    </div>
  );
}

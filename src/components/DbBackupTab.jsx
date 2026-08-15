import React, { useState, useEffect } from 'react';
import { 
  HardDrive, Download, Upload, RefreshCw, CheckCircle2, 
  AlertTriangle, FileText, Database, ShieldAlert, Clock, ArrowDownToLine, RotateCcw, Lock
} from 'lucide-react';

export default function DbBackupTab({ onRefreshHealth }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [healthInfo, setHealthInfo] = useState(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const [bRes, hRes] = await Promise.all([
        fetch('/api/db/backups'),
        fetch('/api/health')
      ]);

      if (bRes.ok) setBackups(await bRes.json());
      if (hRes.ok) setHealthInfo(await hRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const activeDb = healthInfo?.database || 'ONS-RVM';
  const activeHost = healthInfo?.serverHost || 'cluster0.ktted0m.mongodb.net';
  const isProtectedDb = activeDb.toLowerCase() === 'rvmapp';

  // Helper to trigger browser file download to local PC
  const triggerClientDownload = (data, filename) => {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      setMessage(null);
      const res = await fetch('/api/db/backup');
      const json = await res.json();

      if (json.success) {
        if (json.backupData) {
          triggerClientDownload(json.backupData, json.filename);
        }
        setMessage({
          type: 'success',
          text: `Backup created & downloaded to your PC! Snapshot: ${json.filename} (${(json.sizeBytes / 1024).toFixed(1)} KB, ${json.totalDocuments} docs)`
        });
        fetchBackups();
      } else {
        throw new Error(json.error || 'Failed to create backup');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadSnapshot = async (filename) => {
    try {
      const res = await fetch(`/api/db/download/${filename}`);
      if (!res.ok) throw new Error('Failed to fetch snapshot');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setMessage({ type: 'error', text: `Download failed: ${err.message}` });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        setMessage({ type: 'error', text: 'Please select a valid .json database backup file.' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRestoreUploadedFile = async () => {
    if (!selectedFile) return;
    if (isProtectedDb) {
      setMessage({
        type: 'error',
        text: `Restoration Denied: Database "${activeDb}" is a protected production database. You can export backups from "${activeDb}", but restoration onto "${activeDb}" is strictly prohibited.`
      });
      return;
    }

    try {
      setRestoring(true);
      setMessage(null);

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const backupData = JSON.parse(event.target.result);
          const res = await fetch('/api/db/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backupData, mode: 'replace' })
          });

          const json = await res.json();
          if (res.ok && json.success) {
            setMessage({ type: 'success', text: json.message });
            setSelectedFile(null);
            if (onRefreshHealth) onRefreshHealth();
            fetchBackups();
          } else {
            throw new Error(json.error || json.details || 'Restore failed');
          }
        } catch (err) {
          setMessage({ type: 'error', text: `Restore error: ${err.message}` });
        } finally {
          setRestoring(false);
          setConfirmRestore(null);
        }
      };

      reader.readAsText(selectedFile);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setRestoring(false);
      setConfirmRestore(null);
    }
  };

  const handleRestoreSnapshotFile = async (filename) => {
    if (isProtectedDb) {
      setMessage({
        type: 'error',
        text: `Restoration Denied: Database "${activeDb}" is a protected production database. You can export backups from "${activeDb}", but restoration onto "${activeDb}" is strictly prohibited.`
      });
      return;
    }

    try {
      setRestoring(true);
      setMessage(null);

      const res = await fetch(`/api/db/restore-snapshot/${filename}`, {
        method: 'POST'
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: 'success', text: json.message });
        if (onRefreshHealth) onRefreshHealth();
        fetchBackups();
      } else {
        throw new Error(json.error || json.details || 'Snapshot restore failed');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRestoring(false);
      setConfirmRestore(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Database Management</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">
            Database Backup & Restore Utility ({healthInfo?.databaseType === 'postgres' ? 'PostgreSQL' : 'MongoDB'})
          </h2>
          <p className="text-xs t-text-secondary mt-1 flex flex-wrap items-center gap-2">
            Connected Engine: <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded uppercase mono">{healthInfo?.databaseType === 'postgres' ? 'PostgreSQL' : 'MongoDB'}</span>
            <span>•</span>
            Target DB: <span className="font-bold text-emerald-400 mono">{activeDb}</span> 
            {isProtectedDb && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded uppercase">
                RESTORE PROHIBITED (BACKUP ONLY)
              </span>
            )}
            <span>•</span>
            Host: <span className="font-semibold text-cyan-400 mono">{activeHost}</span>
          </p>

        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${creating ? 'animate-bounce' : ''}`} />
            {creating ? 'Downloading Snapshot...' : 'Create & Download Backup'}
          </button>

          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="flex items-center gap-1.5 px-3.5 py-2.5 t-bg-sec hover:t-bg-hover t-text-primary text-xs font-bold rounded-xl border t-border transition-all"
          >
            <ArrowDownToLine className="w-4 h-4 text-cyan-400" />
            Direct JSON Export
          </button>
        </div>
      </div>

      {/* Protected Production DB Notice */}
      {isProtectedDb && (
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-950/20 text-rose-300 flex items-start gap-3 text-xs">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-400">DATABASE RESTORATION PROHIBITED ON {activeDb.toUpperCase()}</h4>
            <p className="t-text-secondary leading-relaxed">
              Database <span className="font-bold text-rose-400">{activeDb}</span> is configured as a protected production database. You can export and download backups from <span className="font-bold">{activeDb}</span>, but database restoration onto <span className="font-bold">{activeDb}</span> is strictly denied to prevent data loss. Please switch to database <span className="text-emerald-400 font-bold">ONS-RVM</span> using the DB Connection Manager to execute database restorations.
            </p>
          </div>
        </div>
      )}

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

      {/* Restoration Upload Box */}
      <div className={`glass-panel p-6 rounded-3xl space-y-4 ${isProtectedDb ? 'opacity-75' : ''}`}>
        <h3 className="text-base font-bold t-text-primary flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            Restore JSON Backup into Connected Database ({activeDb})
          </span>
          {isProtectedDb && (
            <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> RESTORE DENIED ON {activeDb}
            </span>
          )}
        </h3>

        <div className="p-6 border-2 border-dashed t-border hover:border-emerald-500/40 rounded-2xl t-bg-sec flex flex-col items-center justify-center gap-3 transition-all text-center">
          <Database className="w-8 h-8 t-text-muted" />
          <div>
            <p className="text-xs font-bold t-text-primary">Select or drop a `.json` backup file to restore into database <span className="text-emerald-400 font-bold">{activeDb}</span></p>
            <p className="text-[11px] t-text-muted mt-0.5 font-medium">Will populate collections: recyclingsessions, userprofile, feedbacks, binfullnotifications, etc.</p>
          </div>

          <label className="cursor-pointer px-4 py-2 t-bg-surface hover:t-bg-hover t-text-primary text-xs font-bold rounded-xl border t-border transition-all">
            Browse JSON Backup File
            <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" disabled={isProtectedDb} />
          </label>

          {selectedFile && (
            <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-400">
              <FileText className="w-4 h-4" />
              <span className="font-mono font-bold">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              
              {isProtectedDb ? (
                <span className="ml-auto px-3.5 py-1 bg-rose-900/50 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/30 flex items-center gap-1 cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5" /> Restore Denied
                </span>
              ) : (
                <button
                  onClick={() => setConfirmRestore({ file: selectedFile, type: 'upload' })}
                  disabled={restoring}
                  className="ml-auto px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all"
                >
                  {restoring ? 'Restoring...' : `Restore into ${activeDb}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmRestore && !isProtectedDb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full t-bg-surface border border-emerald-500/40 rounded-3xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold t-text-primary">Confirm Database Restoration</h3>
            <p className="text-xs t-text-secondary">
              This will import all documents from <span className="mono text-cyan-400 font-bold">{confirmRestore.filename || confirmRestore.file?.name}</span> directly into active database <span className="text-emerald-400 font-bold">{activeDb}</span> on server <span className="mono t-text-primary">{activeHost}</span>.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmRestore(null)}
                className="px-4 py-2 t-bg-sec hover:t-bg-hover t-text-secondary text-xs font-bold rounded-xl border t-border"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmRestore.type === 'upload') handleRestoreUploadedFile();
                  else if (confirmRestore.type === 'snapshot') handleRestoreSnapshotFile(confirmRestore.filename);
                }}
                disabled={restoring}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40"
              >
                {restoring ? 'Restoring Docs...' : `Yes, Restore to ${activeDb}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Snapshots Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold t-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Stored Backup Snapshots ({backups.length})
          </h3>

          <button
            onClick={fetchBackups}
            className="p-2 t-text-secondary hover:t-text-primary t-bg-sec border t-border rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b t-border t-text-muted uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Backup Filename</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center t-text-muted">Loading snapshots...</td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center t-text-muted">No backup snapshots stored yet. Click "Create & Download Backup" above.</td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.filename} className="hover:t-bg-hover">
                    <td className="py-3 px-4 mono font-semibold text-emerald-400">{b.filename}</td>
                    <td className="py-3 px-4 t-text-secondary">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4 mono text-cyan-400 font-bold">{(b.sizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleDownloadSnapshot(b.filename)}
                        className="inline-flex items-center gap-1 px-3 py-1 t-bg-sec hover:t-bg-hover t-text-primary rounded-lg text-xs font-bold border t-border transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        Download PC
                      </button>

                      {isProtectedDb ? (
                        <button
                          disabled
                          className="inline-flex items-center gap-1 px-3 py-1 bg-rose-950/40 text-rose-400 rounded-lg text-xs font-bold border border-rose-500/30 cursor-not-allowed opacity-75"
                          title="Restoration is prohibited on rvmapp"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Restore Denied
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmRestore({ filename: b.filename, type: 'snapshot' })}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore to {activeDb}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

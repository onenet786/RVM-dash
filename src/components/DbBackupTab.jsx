import React, { useState, useEffect } from 'react';
import { 
  HardDrive, Download, Upload, RefreshCw, CheckCircle2, 
  AlertTriangle, FileText, Database, ShieldAlert, Clock, ArrowDownToLine, Trash2
} from 'lucide-react';

export default function DbBackupTab({ onRefreshHealth }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/db/backups');
      if (res.ok) {
        setBackups(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      setMessage(null);
      const res = await fetch('/api/db/backup');
      const json = await res.json();

      if (json.success) {
        setMessage({
          type: 'success',
          text: `Backup created successfully! Snapshot: ${json.filename} (${(json.sizeBytes / 1024).toFixed(1)} KB, ${json.totalDocuments} docs)`
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

  const handleRestoreFile = async () => {
    if (!selectedFile) return;
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
          if (json.success) {
            setMessage({ type: 'success', text: json.message });
            setSelectedFile(null);
            if (onRefreshHealth) onRefreshHealth();
            fetchBackups();
          } else {
            throw new Error(json.error || 'Restore failed');
          }
        } catch (err) {
          setMessage({ type: 'error', text: `Invalid JSON backup format: ${err.message}` });
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

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Database Management</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">MongoDB Backup & Restore Utility</h2>
          <p className="text-xs t-text-secondary mt-1">Export, snapshot, and restore your full MongoDB `rvmapp` database collections.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${creating ? 'animate-bounce' : ''}`} />
            {creating ? 'Creating Snapshot...' : 'Create Full Backup'}
          </button>

          <a
            href="/api/db/backup?download=true"
            download
            className="flex items-center gap-1.5 px-3.5 py-2.5 t-bg-sec hover:t-bg-hover t-text-primary text-xs font-bold rounded-xl border t-border transition-all"
          >
            <ArrowDownToLine className="w-4 h-4 text-cyan-400" />
            Download Direct JSON
          </a>
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

      {/* Restoration Upload Box */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-base font-bold t-text-primary flex items-center gap-2">
          <Upload className="w-4 h-4 text-cyan-400" />
          Restore Database from JSON Snapshot
        </h3>

        <div className="p-6 border-2 border-dashed t-border hover:border-emerald-500/40 rounded-2xl t-bg-sec flex flex-col items-center justify-center gap-3 transition-all text-center">
          <Database className="w-8 h-8 t-text-muted" />
          <div>
            <p className="text-xs font-bold t-text-primary">Select or drop a `.json` database backup file to restore</p>
            <p className="text-[11px] t-text-muted mt-0.5 font-medium">Will restore collections: recyclingsessions, userprofile, feedbacks, binfullnotifications, etc.</p>
          </div>

          <label className="cursor-pointer px-4 py-2 t-bg-surface hover:t-bg-hover t-text-primary text-xs font-bold rounded-xl border t-border transition-all">
            Browse JSON Backup File
            <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
          </label>

          {selectedFile && (
            <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-xs text-emerald-400">
              <FileText className="w-4 h-4" />
              <span className="font-mono font-bold">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              <button
                onClick={() => setConfirmRestore(true)}
                disabled={restoring}
                className="ml-auto px-3.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-all"
              >
                {restoring ? 'Restoring...' : 'Execute Restore'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full t-bg-surface border border-rose-500/40 rounded-3xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold t-text-primary">Confirm Database Restore</h3>
            <p className="text-xs t-text-secondary">
              This action will overwrite existing collections in database <span className="text-rose-400 font-bold">rvmapp</span> with the contents of <span className="mono t-text-primary font-bold">{selectedFile?.name}</span>.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmRestore(false)}
                className="px-4 py-2 t-bg-sec hover:t-bg-hover t-text-secondary text-xs font-bold rounded-xl border t-border"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreFile}
                disabled={restoring}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/40"
              >
                Yes, Restore Now
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
                  <td colSpan={4} className="py-8 text-center t-text-muted">No backup snapshots stored yet. Click "Create Full Backup" above.</td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.filename} className="hover:t-bg-hover">
                    <td className="py-3 px-4 mono font-semibold text-emerald-400">{b.filename}</td>
                    <td className="py-3 px-4 t-text-secondary">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4 mono text-cyan-400 font-bold">{(b.sizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/api/db/download/${b.filename}`}
                        download
                        className="inline-flex items-center gap-1 px-3 py-1 t-bg-sec hover:t-bg-hover t-text-primary rounded-lg text-xs font-bold border t-border transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
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

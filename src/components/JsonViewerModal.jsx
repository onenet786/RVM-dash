import React, { useState } from 'react';
import { 
  X, Copy, Check, Code, LayoutGrid, Calendar, Phone, User, 
  Wine, Coffee, Award, Cpu, AlertTriangle, MessageSquare, Image as ImageIcon, Shield, Hash, Clock
} from 'lucide-react';

export default function JsonViewerModal({ document: doc, onClose, title = "Document Details" }) {
  const [activeTab, setActiveTab] = useState('formatted'); // 'formatted' | 'raw'
  const [copied, setCopied] = useState(false);

  if (!doc) return null;

  const jsonString = JSON.stringify(doc, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatKeyName = (key) => {
    if (key === '_id') return 'Document ID';
    if (key === '__v') return 'Version Key';
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  };

  const renderFormattedValue = (key, val) => {
    if (val === null || val === undefined) {
      return <span className="t-text-muted italic text-xs">Not specified</span>;
    }

    if (key === '_id') {
      return (
        <span className="mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 inline-flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5" />
          {String(val)}
        </span>
      );
    }

    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return (
          <div className="flex items-center gap-2 t-text-secondary text-xs font-medium">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>{d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            <span className="t-text-muted mono">at {d.toLocaleTimeString()}</span>
          </div>
        );
      }
    }

    if (key === 'phoneNumber') {
      return (
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold">
          <Phone className="w-4 h-4 text-emerald-400" />
          <span>{String(val)}</span>
        </div>
      );
    }

    if (key === 'gender') {
      const isMale = val === 'male';
      return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
          isMale ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
        }`}>
          <User className="w-3.5 h-3.5 mr-1" />
          {String(val).toUpperCase()}
        </span>
      );
    }

    if (key === 'binType') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          {String(val)} BIN FULL
        </span>
      );
    }

    if (key === 'machineId') {
      return (
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30 text-xs">
            {String(val)}
          </span>
        </div>
      );
    }

    if (key === 'profilePic' && typeof val === 'string' && val.trim().startsWith('http')) {
      return (
        <div className="flex items-center gap-3">
          <img src={val} alt="Profile" className="w-10 h-10 rounded-full object-cover border t-border shadow" />
          <span className="text-xs t-text-muted truncate max-w-xs">{val}</span>
        </div>
      );
    }

    if (key === 'bottles') {
      return (
        <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm mono">
          <Wine className="w-4 h-4 text-emerald-400" />
          <span>{val} PET Bottles</span>
        </div>
      );
    }

    if (key === 'cups') {
      return (
        <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm mono">
          <Coffee className="w-4 h-4 text-amber-400" />
          <span>{val} Recyclable Cups</span>
        </div>
      );
    }

    if (key === 'points') {
      return (
        <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-base mono">
          <Award className="w-4 h-4 text-cyan-400" />
          <span>+{val} Points</span>
        </div>
      );
    }

    if (typeof val === 'number') {
      return <span className="mono font-bold text-cyan-400 text-sm">{val}</span>;
    }

    if (typeof val === 'boolean') {
      return (
        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${val ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {val ? 'TRUE' : 'FALSE'}
        </span>
      );
    }

    if (typeof val === 'object') {
      return (
        <pre className="text-xs mono text-purple-400 t-bg-sec p-2.5 rounded-lg border t-border overflow-x-auto">
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    }

    return <span className="t-text-primary text-xs font-medium leading-relaxed">{String(val)}</span>;
  };

  const keys = Object.keys(doc);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] t-bg-surface border t-border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b t-border flex items-center justify-between t-bg-sec">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold t-text-primary tracking-wide">{title}</h3>
              <p className="text-xs t-text-muted mono">BSON ID: {doc._id ? String(doc._id) : 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center t-bg-surface p-1 rounded-xl border t-border">
              <button
                onClick={() => setActiveTab('formatted')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'formatted'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 't-text-muted hover:t-text-primary'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Formatted Details
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'raw'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 't-text-muted hover:t-text-primary'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Raw JSON
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 t-text-muted hover:t-text-primary t-bg-sec rounded-xl border t-border transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 t-bg-sec space-y-4">
          
          {activeTab === 'formatted' ? (
            <div className="space-y-4">
              
              {(doc.bottles !== undefined || doc.cups !== undefined || doc.points !== undefined) && (
                <div className="grid grid-cols-3 gap-3 p-4 t-bg-surface rounded-2xl border t-border">
                  {doc.bottles !== undefined && (
                    <div className="text-center p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <span className="text-[10px] uppercase font-bold t-text-muted block">Bottles</span>
                      <span className="text-lg font-extrabold text-emerald-400 mono">{doc.bottles}</span>
                    </div>
                  )}
                  {doc.cups !== undefined && (
                    <div className="text-center p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <span className="text-[10px] uppercase font-bold t-text-muted block">Cups</span>
                      <span className="text-lg font-extrabold text-amber-400 mono">{doc.cups}</span>
                    </div>
                  )}
                  {doc.points !== undefined && (
                    <div className="text-center p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                      <span className="text-[10px] uppercase font-bold t-text-muted block">Points</span>
                      <span className="text-lg font-extrabold text-cyan-400 mono">{doc.points}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Formatted Key-Value Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {keys.map((key) => {
                  if (key === '__v') return null;
                  return (
                    <div 
                      key={key}
                      className="p-3.5 t-bg-surface border t-border rounded-2xl flex flex-col justify-between gap-1.5 hover:t-bg-hover transition-all"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">
                        {formatKeyName(key)}
                      </span>
                      <div>
                        {renderFormattedValue(key, doc[key])}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="relative">
              <div className="absolute right-3 top-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold t-text-primary t-bg-surface border t-border rounded-lg transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              </div>

              <pre className="p-5 font-mono text-xs text-emerald-400 t-bg-surface rounded-2xl border t-border leading-relaxed overflow-x-auto">
                {jsonString}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t t-border t-bg-sec flex items-center justify-between">
          <span className="text-xs t-text-muted font-mono">Total Attributes: {keys.length}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-950/40"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}

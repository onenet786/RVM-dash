import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Activity, Terminal, Layers, RefreshCw } from 'lucide-react';

export default function Navbar({ health, onRefresh }) {
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isOnline = health?.status === 'online';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3">
      <div className="flex items-center justify-between">
        
        {/* Left Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-emerald-600 to-cyan-500 rounded-xl shadow-lg shadow-emerald-950">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-wide">RVM MASTER DASHBOARD</h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md uppercase tracking-wider">
                PRO DEV
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mono">Database: <span className="text-emerald-400 font-semibold">{health?.database || 'rvmapp'}</span></p>
          </div>
        </div>

        {/* Right Status Indicators */}
        <div className="flex items-center gap-4">
          
          {/* DB Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 pulse-glow shadow-md shadow-emerald-400/50' : 'bg-rose-500'}`} />
            <span className="text-slate-300 font-medium">{isOnline ? 'MongoDB Atlas Connected' : 'Disconnected'}</span>
          </div>

          {/* Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs mono text-cyan-400">
            <Activity className="w-3.5 h-3.5" />
            {timeStr}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
            title="Ping MongoDB Server"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

      </div>
    </header>
  );
}

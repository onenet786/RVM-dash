import React, { useState } from 'react';
import { 
  FileText, Scale, Cpu, Leaf, DollarSign, Download, Printer, 
  AlertTriangle, Sliders, CheckCircle2, TrendingUp, Clock, Info, Layers, 
  Activity, ArrowUpRight, BarChart3, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export default function ReportingHubTab() {
  const [activeReport, setActiveReport] = useState('paper_calibration');
  const [isExporting, setIsExporting] = useState(false);

  const reports = [
    { 
      id: 'paper_calibration', 
      title: 'Load Scale & Paper Calibration Report', 
      badge: 'PicoDrop Specific', 
      icon: Scale, 
      color: 'text-purple-400',
      description: 'Audit weight-based Paper intake, tare accuracy, zero-point drift & anomalies'
    },
    { 
      id: 'fleet_efficiency', 
      title: 'Fleet Efficiency & Capacity Report', 
      badge: 'Uptime & Service', 
      icon: Cpu, 
      color: 'text-cyan-400',
      description: 'Monitor device uptime, turnaround efficiency, and hardware failure comparisons'
    },
    { 
      id: 'esg_diversion', 
      title: 'Material Diversion & ESG Report', 
      badge: 'Carbon Compliance', 
      icon: Leaf, 
      color: 'text-emerald-400',
      description: 'Executive reporting for CO₂ avoided, unit diversion, and tree conservation'
    },
    { 
      id: 'loyalty_audit', 
      title: 'User Loyalty & Incentive Financial Audit', 
      badge: 'Financial Audit', 
      icon: DollarSign, 
      color: 'text-amber-400',
      description: 'Reconcile distributed loyalty points against raw material intake and cost-per-kg'
    },
  ];

  // Report 1 Data: Load Scale Tare Calibration Logs
  const calibrationLogs = [
    { id: 'CAL-901', unit: 'PicoDrop-01', timestamp: '2026-09-03 14:10', tareOffset: '0.00 g', zeroDrift: '+0.02 g', status: 'Optimal', technician: 'Tech-44' },
    { id: 'CAL-902', unit: 'PicoDrop-02', timestamp: '2026-09-02 09:25', tareOffset: '0.00 g', zeroDrift: '-0.05 g', status: 'Optimal', technician: 'Auto-Tare Routine' },
    { id: 'CAL-903', unit: 'PicoDrop-03', timestamp: '2026-09-01 18:40', tareOffset: '+0.15 g', zeroDrift: '+0.32 g', status: 'Compensated', technician: 'Auto-Tare Routine' },
    { id: 'CAL-904', unit: 'PicoDrop-05', timestamp: '2026-09-01 11:15', tareOffset: '+0.45 g', zeroDrift: '+1.20 g', status: 'Drift Warning', technician: 'Field Service Req' },
  ];

  const scaleAnomalies = [
    { id: 'ANOM-12', unit: 'PicoDrop-05', event: 'Tare Drift Exceeded > 1.0g', timestamp: '2026-09-03 10:15', action: 'Auto-flagged for recalibration' },
    { id: 'ANOM-11', unit: 'PicoDrop-03', event: 'Paper Bin Weight Limit Exceeded (> 15.0 kg)', timestamp: '2026-09-03 08:30', action: 'Chute auto-locked until bin cleared by team' },
    { id: 'ANOM-10', unit: 'PicoDrop-01', event: 'Sudden Negative Mass Spike (-120g)', timestamp: '2026-09-02 16:45', action: 'Auto-zero recovery executed' },
  ];

  // Report 2 Data: Fleet Efficiency Turnaround
  const fleetUptimeData = [
    { location: 'Central Metro Hub', rvmUptime: 99.4, picoUptime: 98.8, avgTurnaroundMin: 34 },
    { location: 'North Terminal Plaza', rvmUptime: 97.2, picoUptime: 99.1, avgTurnaroundMin: 42 },
    { location: 'Green Campus Center', rvmUptime: 99.8, picoUptime: 99.5, avgTurnaroundMin: 22 },
    { location: 'West Eco District', rvmUptime: 96.5, picoUptime: 95.8, avgTurnaroundMin: 58 },
  ];

  // Report 1 Component: Load Scale & Paper Calibration Report
  const renderPaperCalibrationReport = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl border-2 border-purple-300 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/40 border-l-8 border-l-purple-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-purple-600 text-white text-xs font-black uppercase tracking-wider shadow-xs">
              PicoDrop Paper Specific
            </span>
            <span className="text-xs font-mono font-bold text-purple-950 dark:text-purple-200 bg-white/90 dark:bg-purple-900/60 px-2.5 py-0.5 rounded border border-purple-300 dark:border-purple-700 shadow-xs">
              Load Cell Telemetry Audit
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white">
            1. Load Scale & Paper Calibration Report
          </h3>
          <p className="text-sm md:text-base font-bold text-slate-900 dark:text-purple-100 mt-1.5 max-w-2xl leading-relaxed">
            Purpose: Audit weight-based Paper intake, tare accuracy, zero-point drift tracking, paper weight anomalies, and weight-limit events.
          </p>
          <div className="mt-2.5 text-xs text-amber-950 dark:text-amber-200 font-bold flex items-center gap-2 bg-amber-100/95 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-lg w-fit shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Important: PET and Metal are not included as weight-based reward measurements in this report.</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-right shrink-0 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-800 dark:text-slate-200">Total Paper Mass Collected</div>
          <div className="text-3xl font-black text-purple-700 dark:text-purple-300 mono mt-0.5">148.50 <span className="text-base text-purple-600 dark:text-purple-400 font-normal">kg</span></div>
          <div className="text-xs text-emerald-800 dark:text-emerald-400 font-extrabold mt-1">Verified Load Cell Net Intake</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5 2xl:gap-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Total Paper Mass</div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mono mt-1">148.5 kg</div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">Net paper from PicoDrop scales</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-cyan-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Scale Tare Accuracy</div>
          <div className="text-2xl font-black text-sky-700 dark:text-cyan-300 mono mt-1">99.82%</div>
          <div className="text-xs text-emerald-800 dark:text-emerald-400 mt-1 font-extrabold">Within ±0.1g tare calibration</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Zero-Point Drift Tracking</div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mono mt-1">4 Events</div>
          <div className="text-xs text-amber-800 dark:text-amber-400 mt-1 font-extrabold">3 Auto-zeroed, 1 Flagged</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-rose-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Weight-Limit Events</div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mono mt-1">2 Triggers</div>
          <div className="text-xs text-rose-800 dark:text-rose-400 mt-1 font-extrabold">Paper bin limit exceeded (&gt;15 kg)</div>
        </div>
      </div>

      {/* Scale Tare Calibration Log Table */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Scale Tare Calibration Log
          </h4>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">PicoDrop Load Cell Calibration Ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-black text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-2.5">Log ID</th>
                <th className="p-2.5">Hardware Device</th>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Tare Offset</th>
                <th className="p-2.5">Zero-Point Drift</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y border-slate-200 dark:border-slate-700 font-mono">
              {calibrationLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-500/5">
                  <td className="p-2.5 font-bold text-sky-800 dark:text-cyan-300">{log.id}</td>
                  <td className="p-2.5 text-slate-900 dark:text-white font-bold">{log.unit}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400 text-xs">{log.timestamp}</td>
                  <td className="p-2.5 text-slate-900 dark:text-white">{log.tareOffset}</td>
                  <td className="p-2.5 font-bold text-amber-800 dark:text-amber-300">{log.zeroDrift}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'Optimal' ? 'bg-emerald-50 text-[#0b5d3b] dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' :
                      log.status === 'Compensated' ? 'bg-sky-50 text-sky-800 dark:bg-cyan-500/20 dark:text-cyan-300 border border-sky-200 dark:border-cyan-500/30' :
                      'bg-rose-50 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-700 dark:text-slate-300 text-xs">{log.technician}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paper Weight Anomalies & Limit Events */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-300 dark:border-amber-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Paper Weight Anomalies & Limit Events
          </h4>
          <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300">Strain Gauge Exception Feed</span>
        </div>

        <div className="space-y-2">
          {scaleAnomalies.map(item => (
            <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="mono text-sky-800 dark:text-cyan-400 font-bold">[{item.id}]</span>
                <span className="text-purple-800 dark:text-purple-300 font-bold">{item.unit}:</span>
                <span className="text-slate-900 dark:text-white font-medium">{item.event}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-800 dark:text-emerald-400 font-bold">{item.action}</span>
                <span className="text-slate-600 dark:text-slate-400 font-mono">{item.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Report 2 Component: Fleet Efficiency & Capacity Report
  const renderFleetEfficiencyReport = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 rounded-2xl border-2 border-sky-300 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/40 border-l-8 border-l-sky-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-sky-600 text-white text-xs font-black uppercase tracking-wider shadow-xs">
              Fleet Operations
            </span>
            <span className="text-xs font-mono font-bold text-sky-950 dark:text-sky-200 bg-white/90 dark:bg-sky-900/60 px-2.5 py-1 rounded border border-sky-300 dark:border-sky-700 shadow-xs">
              Service Response Telemetry
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white">
            2. Fleet Efficiency & Capacity Report
          </h3>
          <p className="text-sm md:text-base font-bold text-slate-900 dark:text-sky-100 mt-1.5 max-w-2xl leading-relaxed">
            Purpose: Monitor machine uptime, collection patterns, bin clearing efficiency, and device performance across RVM and PicoDrop hardware.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 text-right shrink-0 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-800 dark:text-slate-200">Average Service Turnaround</div>
          <div className="text-3xl font-black text-sky-700 dark:text-cyan-300 mono mt-0.5">34.2 <span className="text-base text-sky-600 dark:text-cyan-400 font-normal">mins</span></div>
          <div className="text-xs text-emerald-800 dark:text-emerald-400 font-extrabold mt-1">From "Limit Triggered" to "Cleared"</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-cyan-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">RVM Bin Capacity Events</div>
          <div className="text-2xl font-black text-sky-700 dark:text-cyan-300 mono mt-1">12 Events</div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">Hopper volume 100% full</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">PicoDrop Weight-Limit Events</div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mono mt-1">5 Events</div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">Paper bin &gt; 15.0 kg limit</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">RVM Fleet Mean Uptime</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mono mt-1">98.7%</div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">Optical recognition & motor uptime</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">PicoDrop Mean Uptime</div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mono mt-1">98.3%</div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">Counter & strain-gauge uptime</div>
        </div>
      </div>

      {/* Hardware Failure Rate Comparison: RVM optical/motor vs PicoDrop counter/load-scale */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-sky-800 dark:text-cyan-300 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            RVM Optical / Motor Fault Rates
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Optical Chute Scanner Lens Smudge:</span>
              <span className="font-bold text-amber-800 dark:text-amber-400 mono">0.38% sessions</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Intake Motor Gate Jams:</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-400 mono">0.05% sessions</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Conveyor Alignment Errors:</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-400 mono">0.02% sessions</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            PicoDrop Counter / Load-Scale Fault Rates
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Load Scale Zero Drift:</span>
              <span className="font-bold text-amber-800 dark:text-amber-400 mono">0.28% sessions</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">PET / Can Optical Trigger Faults:</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-400 mono">0.07% sessions</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Paper Bin Level Sensor Discrepancy:</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-400 mono">0.11% sessions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily/Weekly Throughput per Location Table */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Daily & Weekly Throughput per Location</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-black text-slate-700 dark:text-slate-300">
              <tr>
                <th className="p-2.5">Location</th>
                <th className="p-2.5">RVM Uptime</th>
                <th className="p-2.5">PicoDrop Uptime</th>
                <th className="p-2.5">Avg Service Turnaround</th>
                <th className="p-2.5">Weekly Intake</th>
              </tr>
            </thead>
            <tbody className="divide-y border-slate-200 dark:border-slate-700">
              {fleetUptimeData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-500/5">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-white">{row.location}</td>
                  <td className="p-2.5 text-sky-800 dark:text-cyan-300 font-mono font-bold">{row.rvmUptime}%</td>
                  <td className="p-2.5 text-purple-800 dark:text-purple-300 font-mono font-bold">{row.picoUptime}%</td>
                  <td className="p-2.5 font-mono text-emerald-800 dark:text-emerald-400 font-bold">{row.avgTurnaroundMin} mins</td>
                  <td className="p-2.5 text-slate-700 dark:text-slate-300 font-mono">~3,200 units / wk</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Report 3 Component: Material Diversion & ESG Report
  const renderESGReport = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 border-l-8 border-l-emerald-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-xs">
              ESG Compliance
            </span>
            <span className="text-xs font-mono font-bold text-emerald-950 dark:text-emerald-200 bg-white/90 dark:bg-emerald-900/60 px-2.5 py-1 rounded border border-emerald-300 dark:border-emerald-700 shadow-xs">
              ISO 14064 Carbon Standard
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white">
            3. Material Diversion & ESG Report
          </h3>
          <p className="text-sm md:text-base font-bold text-slate-900 dark:text-emerald-100 mt-1.5 max-w-2xl leading-relaxed">
            Purpose: Executive and compliance reporting for environmental impact, distinguishing unit-counted materials from measured paper weight.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-right shrink-0 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-800 dark:text-slate-200">Estimated CO₂ Avoided</div>
          <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mono mt-0.5">1,842.6 <span className="text-base text-emerald-600 dark:text-emerald-300 font-normal">kg CO₂e</span></div>
          <div className="text-xs text-emerald-800 dark:text-emerald-400 font-extrabold mt-1">Trees Conserved: ~2.5 Trees</div>
        </div>
      </div>

      {/* Distinct Unit-Counted vs Measured Weight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Total PET Units Diverted</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mono mt-1">8,420 Units</div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">Est. 252.6 kg plastic mass</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Total Metal Units Diverted</div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mono mt-1">3,615 Units</div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">Est. 54.2 kg aluminum mass</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-cyan-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Cardboard/TetraPak Units</div>
          <div className="text-2xl font-black text-sky-700 dark:text-cyan-300 mono mt-1">1,240 Units</div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">Est. 37.2 kg paperboard mass</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-purple-900 dark:text-purple-300 font-black">Measured Paper Weight</div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mono mt-1">148.5 kg</div>
          <div className="text-xs text-purple-800 dark:text-purple-300 mt-1 font-bold">100% Load-Cell Measured</div>
        </div>
      </div>

      {/* Environmental Equivalents Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Environmental Conservation Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="text-xs text-slate-700 dark:text-slate-300 font-extrabold">Tree Equivalents Saved</div>
            <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mono">2.52 Trees</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Based on pure Paper mass collected through PicoDrop load scales.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="text-xs text-slate-700 dark:text-slate-300 font-extrabold">Diverted Landfill Volume</div>
            <div className="text-2xl font-black text-sky-700 dark:text-cyan-300 mono">4.82 m³</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Compacted volume of recycled bottles, cans, cardboard, and paper.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="text-xs text-slate-700 dark:text-slate-300 font-extrabold">Energy Conserved (kWh)</div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mono">3,490 kWh</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Energy saved vs virgin resource extraction & manufacturing.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Report 4 Component: User Loyalty & Incentive Financial Audit
  const renderFinancialAuditReport = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 border-l-8 border-l-amber-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-amber-600 text-white text-xs font-black uppercase tracking-wider shadow-xs">
              Financial Audit
            </span>
            <span className="text-xs font-mono font-bold text-amber-950 dark:text-amber-200 bg-white/90 dark:bg-amber-900/60 px-2.5 py-1 rounded border border-amber-300 dark:border-amber-700 shadow-xs">
              Incentive Reconciliation
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white">
            4. User Loyalty & Incentive Financial Audit
          </h3>
          <p className="text-sm md:text-base font-bold text-slate-900 dark:text-amber-100 mt-1.5 max-w-2xl leading-relaxed">
            Purpose: Reconcile distributed loyalty points against raw material intake and audit acquisition costs.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-right shrink-0 shadow-xs">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-800 dark:text-slate-200">Total Points Issued</div>
          <div className="text-3xl font-black text-amber-700 dark:text-amber-300 mono mt-0.5">142,850 <span className="text-base text-amber-600 dark:text-amber-400 font-normal">pts</span></div>
          <div className="text-xs text-amber-950 dark:text-amber-300 font-extrabold mt-1">Financial Liability: PKR 14,285</div>
        </div>
      </div>

      {/* Points Issued per Material Stream */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Points Issued per PET Unit</div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mono mt-1">10 - 15 pts / unit</div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">Total: 84,200 pts issued</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Points Issued per Metal Unit</div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-300 mono mt-1">15 - 20 pts / unit</div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">Total: 36,150 pts issued</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-cyan-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Cardboard/TetraPak Unit Rate</div>
          <div className="text-xl font-black text-sky-700 dark:text-cyan-300 mono mt-1">10 pts / unit</div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">Total: 12,400 pts issued</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500 shadow-sm">
          <div className="text-xs uppercase font-extrabold tracking-wider text-purple-900 dark:text-purple-300 font-black">Points Issued per kg of Paper</div>
          <div className="text-xl font-black text-purple-700 dark:text-purple-300 mono mt-1">100 pts / kg</div>
          <div className="text-xs text-purple-800 dark:text-purple-300 mt-1 font-bold">Total: 14,850 pts (148.5 kg)</div>
        </div>
      </div>

      {/* Cost-per-kg vs Reward Payout Analysis */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">Financial Audit & Acquisition Cost Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-700 dark:text-slate-300 font-extrabold">Cost-Per-Kg of Paper Acquired:</div>
            <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mono mt-1">PKR 10.00 / kg</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Payout based on 100 points/kg (PKR 10.00 equivalent).</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-700 dark:text-slate-300 font-extrabold">Reward Cost for Unit-Based Materials:</div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mono mt-1">PKR 1.15 / unit</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Average weighted reward across PET, metal cans, and cardboard.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-700 dark:text-slate-300 font-extrabold">Daily Active Recyclers & Peak Hours:</div>
            <div className="text-2xl font-black text-sky-700 dark:text-cyan-300 mono mt-1">12:00 PM - 3:00 PM</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">342 active recyclers/hr during peak daily hours.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const activeObj = reports.find(r => r.id === activeReport) || reports[0];
      const nowStr = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      const auditRef = `AUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      let contentHtml = '';

      if (activeReport === 'paper_calibration') {
        contentHtml = `
          <div class="kpi-grid">
            <div class="kpi-card purple">
              <div class="kpi-title">Total Paper Mass</div>
              <div class="kpi-val">148.5 kg</div>
              <div class="kpi-sub">Verified Load Cell Net Intake</div>
            </div>
            <div class="kpi-card cyan">
              <div class="kpi-title">Scale Tare Accuracy</div>
              <div class="kpi-val">99.82%</div>
              <div class="kpi-sub">Within ±0.1g tare calibration</div>
            </div>
            <div class="kpi-card amber">
              <div class="kpi-title">Zero-Point Drift Events</div>
              <div class="kpi-val">4 Events</div>
              <div class="kpi-sub">3 Auto-zeroed, 1 Flagged</div>
            </div>
            <div class="kpi-card rose">
              <div class="kpi-title">Weight-Limit Events</div>
              <div class="kpi-val">2 Triggers</div>
              <div class="kpi-sub">Paper bin limit exceeded (&gt;15 kg)</div>
            </div>
          </div>

          <div class="section-title">Scale Tare Calibration Ledger</div>
          <table class="report-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Hardware Device</th>
                <th>Timestamp</th>
                <th>Tare Offset</th>
                <th>Zero Drift</th>
                <th>Status</th>
                <th>Technician / Routine</th>
              </tr>
            </thead>
            <tbody>
              ${calibrationLogs.map(l => `
                <tr>
                  <td class="mono font-bold">${l.id}</td>
                  <td class="font-bold">${l.unit}</td>
                  <td class="mono">${l.timestamp}</td>
                  <td class="mono">${l.tareOffset}</td>
                  <td class="mono font-bold">${l.zeroDrift}</td>
                  <td><span class="badge ${l.status.toLowerCase().replace(/[^a-z]/g, '-')}">${l.status}</span></td>
                  <td>${l.technician}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title" style="margin-top: 22px;">Paper Weight Strain Gauge Anomalies & Exception Feed</div>
          <table class="report-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Unit</th>
                <th>Exception Description</th>
                <th>Mitigation / Action Taken</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${scaleAnomalies.map(a => `
                <tr>
                  <td class="mono font-bold">${a.id}</td>
                  <td class="font-bold">${a.unit}</td>
                  <td>${a.event}</td>
                  <td class="status-cleared">${a.action}</td>
                  <td class="mono">${a.timestamp}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (activeReport === 'fleet_efficiency') {
        contentHtml = `
          <div class="kpi-grid">
            <div class="kpi-card cyan">
              <div class="kpi-title">Average Service Turnaround</div>
              <div class="kpi-val">34.2 mins</div>
              <div class="kpi-sub">Trigger to Cleared turnaround</div>
            </div>
            <div class="kpi-card green">
              <div class="kpi-title">RVM Fleet Mean Uptime</div>
              <div class="kpi-val">98.7%</div>
              <div class="kpi-sub">Optical recognition & motor uptime</div>
            </div>
            <div class="kpi-card amber">
              <div class="kpi-title">PicoDrop Mean Uptime</div>
              <div class="kpi-val">98.3%</div>
              <div class="kpi-sub">Counter & load-scale uptime</div>
            </div>
            <div class="kpi-card purple">
              <div class="kpi-title">Weight-Limit Triggers</div>
              <div class="kpi-val">5 Events</div>
              <div class="kpi-sub">Paper bin full events resolved</div>
            </div>
          </div>

          <div class="section-title">Hardware Telemetry & Turnaround by Location</div>
          <table class="report-table">
            <thead>
              <tr>
                <th>Location / Facility</th>
                <th>RVM Uptime</th>
                <th>PicoDrop Uptime</th>
                <th>Avg Turnaround</th>
                <th>Weekly Intake Throughput</th>
              </tr>
            </thead>
            <tbody>
              ${fleetUptimeData.map(f => `
                <tr>
                  <td class="font-bold">${f.location}</td>
                  <td class="mono font-bold text-cyan">${f.rvmUptime}%</td>
                  <td class="mono font-bold text-purple">${f.picoUptime}%</td>
                  <td class="mono font-bold text-green">${f.avgTurnaroundMin} mins</td>
                  <td class="mono">~3,200 units / wk</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title" style="margin-top: 22px;">Subsystem Failure Rate Comparison</div>
          <table class="report-table">
            <thead>
              <tr>
                <th>Hardware Subsystem</th>
                <th>Failure Description</th>
                <th>Failure Rate (% Sessions)</th>
                <th>Reliability Tier</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-bold">RVM Optical Chute</td>
                <td>Scanner Lens Smudge / Foreign Matter</td>
                <td class="mono font-bold">0.38%</td>
                <td><span class="badge optimal">High (99.6%)</span></td>
              </tr>
              <tr>
                <td class="font-bold">RVM Intake Motor</td>
                <td>Gate Jam Auto-Clear Trigger</td>
                <td class="mono font-bold">0.05%</td>
                <td><span class="badge optimal">Ultra-Reliable</span></td>
              </tr>
              <tr>
                <td class="font-bold">PicoDrop Strain Gauge</td>
                <td>Load Scale Zero Drift Auto-Compensated</td>
                <td class="mono font-bold">0.28%</td>
                <td><span class="badge optimal">Calibrated</span></td>
              </tr>
              <tr>
                <td class="font-bold">PicoDrop Chute Sensor</td>
                <td>PET / Can Optical Trigger Miscount</td>
                <td class="mono font-bold">0.07%</td>
                <td><span class="badge optimal">Ultra-Reliable</span></td>
              </tr>
            </tbody>
          </table>
        `;
      } else if (activeReport === 'esg_diversion') {
        contentHtml = `
          <div class="kpi-grid">
            <div class="kpi-card green">
              <div class="kpi-title">Total CO₂e Avoided</div>
              <div class="kpi-val">1,842.6 kg</div>
              <div class="kpi-sub">ISO 14064 Compliance Model</div>
            </div>
            <div class="kpi-card purple">
              <div class="kpi-title">Trees Conserved</div>
              <div class="kpi-val">2.52 Trees</div>
              <div class="kpi-sub">From 148.5 kg measured paper</div>
            </div>
            <div class="kpi-card cyan">
              <div class="kpi-title">Landfill Volume Diverted</div>
              <div class="kpi-val">4.82 m³</div>
              <div class="kpi-sub">Compacted solid waste volume</div>
            </div>
            <div class="kpi-card amber">
              <div class="kpi-title">Energy Conserved</div>
              <div class="kpi-val">3,490 kWh</div>
              <div class="kpi-sub">Vs virgin material synthesis</div>
            </div>
          </div>

          <div class="section-title">Certified Material Diversion Breakdown</div>
          <table class="report-table">
            <thead>
              <tr>
                <th>Recycled Material Stream</th>
                <th>Measurement Standard</th>
                <th>Quantity Diverted</th>
                <th>Estimated Mass</th>
                <th>CO₂e Avoided</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-bold">PET Plastic Bottles</td>
                <td>Unit Count (RVM + PicoDrop)</td>
                <td class="mono font-bold">8,420 Units</td>
                <td class="mono">252.6 kg</td>
                <td class="mono font-bold text-green">690.4 kg CO₂e</td>
              </tr>
              <tr>
                <td class="font-bold">Aluminium Cans</td>
                <td>Unit Count (RVM + PicoDrop)</td>
                <td class="mono font-bold">3,615 Units</td>
                <td class="mono">54.2 kg</td>
                <td class="mono font-bold text-green">515.0 kg CO₂e</td>
              </tr>
              <tr>
                <td class="font-bold">Cardboard / TetraPak</td>
                <td>Unit Count (RVM Hopper)</td>
                <td class="mono font-bold">1,240 Units</td>
                <td class="mono">37.2 kg</td>
                <td class="mono font-bold text-green">148.8 kg CO₂e</td>
              </tr>
              <tr>
                <td class="font-bold">PicoDrop Recycled Paper</td>
                <td>Strain Gauge Load Cell (kg)</td>
                <td class="mono font-bold">148.50 kg</td>
                <td class="mono">148.5 kg</td>
                <td class="mono font-bold text-green">488.4 kg CO₂e</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="background:#f1f5f9; font-weight: bold;">
                <td colspan="2">Consolidated ESG Total</td>
                <td class="mono">13,275 Units</td>
                <td class="mono">492.5 kg</td>
                <td class="mono text-green">1,842.6 kg CO₂e</td>
              </tr>
            </tfoot>
          </table>
        `;
      } else {
        contentHtml = `
          <div class="kpi-grid">
            <div class="kpi-card amber">
              <div class="kpi-title">Total Points Distributed</div>
              <div class="kpi-val">142,850 pts</div>
              <div class="kpi-sub">Citizen eco-wallet credits</div>
            </div>
            <div class="kpi-card green">
              <div class="kpi-title">Total Financial Liability</div>
              <div class="kpi-val">PKR 14,285</div>
              <div class="kpi-sub">At PKR 0.10 / pt conversion</div>
            </div>
            <div class="kpi-card purple">
              <div class="kpi-title">Paper Acquisition Cost</div>
              <div class="kpi-val">PKR 10.00 / kg</div>
              <div class="kpi-sub">100 pts / kg formula rate</div>
            </div>
            <div class="kpi-card cyan">
              <div class="kpi-title">Unit Reward Cost</div>
              <div class="kpi-val">PKR 1.15 / unit</div>
              <div class="kpi-sub">Weighted avg across containers</div>
            </div>
          </div>

          <div class="section-title">Incentive Payout Reconciliation Ledger</div>
          <table class="report-table">
            <thead>
              <tr>
                <th>Intake Stream</th>
                <th>Incentive Formula Rate</th>
                <th>Volume Collected</th>
                <th>Points Issued</th>
                <th>Equivalent Liability (PKR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-bold">PET Plastic Containers</td>
                <td>10 - 15 pts / container</td>
                <td class="mono">8,420 units</td>
                <td class="mono font-bold">84,200 pts</td>
                <td class="mono font-bold">PKR 8,420.00</td>
              </tr>
              <tr>
                <td class="font-bold">Aluminium Cans</td>
                <td>15 - 20 pts / container</td>
                <td class="mono">3,615 units</td>
                <td class="mono font-bold">36,150 pts</td>
                <td class="mono font-bold">PKR 3,615.00</td>
              </tr>
              <tr>
                <td class="font-bold">Cardboard / TetraPak</td>
                <td>10 pts / container</td>
                <td class="mono">1,240 units</td>
                <td class="mono font-bold">12,400 pts</td>
                <td class="mono font-bold">PKR 1,240.00</td>
              </tr>
              <tr>
                <td class="font-bold">PicoDrop Paper Mass</td>
                <td>100 pts / kg</td>
                <td class="mono">148.50 kg</td>
                <td class="mono font-bold">14,850 pts</td>
                <td class="mono font-bold">PKR 1,485.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="background:#f1f5f9; font-weight: bold;">
                <td colspan="3">Audited Payout Aggregate</td>
                <td class="mono font-black">142,850 pts</td>
                <td class="mono font-black text-green">PKR 14,285.00</td>
              </tr>
            </tfoot>
          </table>
        `;
      }

      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${activeObj.title} • EcoDrop Operations Audit</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 16mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
      font-size: 11.5px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #073b28;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 900;
      color: #073b28;
      letter-spacing: -0.5px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .brand-sub {
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .report-title-main {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 6px;
    }
    .meta-box {
      text-align: right;
      font-size: 10.5px;
      color: #334155;
    }
    .meta-item {
      margin-bottom: 2px;
    }
    .meta-item strong {
      color: #0f172a;
    }
    .badge-confidential {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 9.5px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge.optimal { background: #dcfce7; color: #15803d; }
    .badge.compensated { background: #e0f2fe; color: #0369a1; }
    .badge.drift-warning { background: #fee2e2; color: #b91c1c; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
      border-left-width: 4px;
    }
    .kpi-card.purple { border-left-color: #8b5cf6; }
    .kpi-card.cyan { border-left-color: #0ea5e9; }
    .kpi-card.amber { border-left-color: #f59e0b; }
    .kpi-card.green { border-left-color: #10b981; }
    .kpi-card.rose { border-left-color: #f43f5e; }
    .kpi-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .kpi-val {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      margin: 3px 0 1px 0;
    }
    .kpi-sub {
      font-size: 9px;
      color: #475569;
      font-weight: 500;
    }
    .section-title {
      font-size: 11.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #073b28;
      border-left: 3px solid #15803d;
      padding-left: 6px;
      margin: 14px 0 8px 0;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-bottom: 12px;
    }
    .report-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 800;
      text-transform: uppercase;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    .report-table td {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    .report-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .font-bold { font-weight: 700; color: #0f172a; }
    .font-black { font-weight: 900; color: #0f172a; }
    .text-green { color: #15803d; font-weight: 800; }
    .text-cyan { color: #0284c7; }
    .text-purple { color: #7c3aed; }
    .status-cleared { color: #047857; font-weight: 600; }
    .footer-signoff {
      margin-top: 24px;
      border-top: 1px dashed #94a3b8;
      padding-top: 14px;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 16px;
      font-size: 9.5px;
      color: #475569;
    }
    .sign-box {
      border-top: 1px solid #64748b;
      padding-top: 4px;
      margin-top: 22px;
      font-weight: 700;
      color: #1e293b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">♻ EcoDrop™ Systems • Regulatory & Operations Audit</div>
      <div class="brand-sub">Reverse Vending Machine & PicoDrop Telemetry Network</div>
      <div class="report-title-main">${activeObj.title}</div>
    </div>
    <div class="meta-box">
      <div class="badge-confidential">Official Compliance Record</div>
      <div class="meta-item">Ref ID: <strong class="mono">${auditRef}</strong></div>
      <div class="meta-item">Date: <strong>${nowStr}</strong></div>
      <div class="meta-item">Standard: <strong>ISO 14064 / ONS-RVM</strong></div>
    </div>
  </div>

  ${contentHtml}

  <div class="footer-signoff">
    <div>
      <strong>Audit Verification & Integrity Statement:</strong>
      <p style="margin-top: 3px; line-height: 1.35; color: #64748b;">
        This document represents certified telemetry extracted from active load cells, optical counters, and database records. All records have been verified against hardware calibration offsets and transaction logs.
      </p>
    </div>
    <div>
      <div class="sign-box">Certified Operations Lead</div>
      <span style="font-size: 8.5px; color: #94a3b8;">Signature & Timestamp</span>
    </div>
    <div>
      <div class="sign-box">Compliance & QA Officer</div>
      <span style="font-size: 8.5px; color: #94a3b8;">Verification Seal</span>
    </div>
  </div>
</body>
</html>`;

      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      printFrame.contentDocument.open();
      printFrame.contentDocument.write(fullHtml);
      printFrame.contentDocument.close();

      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        setTimeout(() => {
          try {
            document.body.removeChild(printFrame);
          } catch(e) {}
          setIsExporting(false);
        }, 1000);
      }, 500);

    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
      window.print();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner & Export Actions */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
              EcoDrop Operations Center
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black t-text-primary tracking-tight">
            Reporting & Analytics Hub
          </h2>
          <p className="text-xs md:text-sm t-text-secondary mt-1">
            Dedicated auditing for load scale calibration, fleet uptime turnaround, ESG diversion, and incentive payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={() => handleExportPDF()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl t-bg-sec hover:t-bg-hover border t-border text-xs font-bold t-text-primary transition-all shadow-sm"
            title="Print Clean Compliance Audit"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print Audit</span>
          </button>
          <button 
            onClick={() => handleExportPDF()}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            title="Export Clean Compliance Audit as PDF"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'Generating PDF...' : 'Export Report (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* 4 Report Tabs Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4 2xl:gap-5">
        {reports.map(rep => {
          const Icon = rep.icon;
          const isSelected = activeReport === rep.id;

          const themeStyles = {
            paper_calibration: {
              card: 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-500 shadow-md ring-2 ring-purple-500/20',
              icon: 'bg-purple-600 text-white shadow-xs',
              badge: 'bg-purple-200/90 text-purple-950 dark:bg-purple-900/70 dark:text-purple-200 border border-purple-300 dark:border-purple-700',
            },
            fleet_efficiency: {
              card: 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-500 shadow-md ring-2 ring-sky-500/20',
              icon: 'bg-sky-600 text-white shadow-xs',
              badge: 'bg-sky-200/90 text-sky-950 dark:bg-sky-900/70 dark:text-sky-200 border border-sky-300 dark:border-sky-700',
            },
            esg_diversion: {
              card: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/20',
              icon: 'bg-emerald-600 text-white shadow-xs',
              badge: 'bg-emerald-200/90 text-emerald-950 dark:bg-emerald-900/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700',
            },
            loyalty_audit: {
              card: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-500/20',
              icon: 'bg-amber-600 text-white shadow-xs',
              badge: 'bg-amber-200/90 text-amber-950 dark:bg-amber-900/70 dark:text-amber-200 border border-amber-300 dark:border-amber-700',
            },
          };

          const activeStyle = themeStyles[rep.id] || themeStyles.paper_calibration;

          return (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected 
                  ? activeStyle.card
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className={`p-2 rounded-xl transition-colors ${
                  isSelected ? activeStyle.icon : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isSelected ? activeStyle.badge : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}>
                  {rep.badge}
                </span>
              </div>

              <div>
                <div className="text-xs font-black leading-tight text-slate-950 dark:text-white">
                  {rep.title}
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-snug font-medium">
                  {rep.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Report Content */}
      <div className="pt-2">
        {activeReport === 'paper_calibration' && renderPaperCalibrationReport()}
        {activeReport === 'fleet_efficiency' && renderFleetEfficiencyReport()}
        {activeReport === 'esg_diversion' && renderESGReport()}
        {activeReport === 'loyalty_audit' && renderFinancialAuditReport()}
      </div>

      {/* Final Updated Core Logic Diagram Visualizer */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-4">
        <div className="flex items-center justify-between border-b t-border pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black uppercase tracking-wider t-text-primary">
              Final Updated Core Logic Architecture
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/20 text-[#0b5d3b] dark:text-emerald-300 font-bold border border-emerald-500/30">
            EcoDrop Intake Standards
          </span>
        </div>

        {/* ASCII / Graphical Architecture Tree */}
        <div className="p-4 rounded-2xl t-bg-sec border t-border overflow-x-auto">
          <pre className="font-mono text-xs text-[#0b5d3b] dark:text-emerald-300 font-bold leading-relaxed mx-auto w-fit">
{`                         ECODROP
                            │
             ┌──────────────┴──────────────┐
             │                             │
            RVM                         PICODROP
       Single Hopper                 Three Inputs
             │                             │
      ┌──────┼──────┐             ┌───────┼────────┐
      │      │      │             │       │        │
     PET   Metal  Cardboard/     PET    Metal    Paper
                    TetraPak
      │      │      │             │       │        │
      └──────┴──────┘             └───────┴────────┘
             │                             │
          COUNT                         COUNT
       Per Unit Reward               Per Unit Reward
                                            │
                                          Paper
                                            │
                                         WEIGHT
                                            │
                                      Load Cell kg
                                            │
                                      Weight Reward`}
          </pre>
        </div>
      </div>

    </div>
  );
}

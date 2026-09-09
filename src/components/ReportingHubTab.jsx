import React, { useState } from 'react';
import { 
  FileText, Scale, Cpu, Leaf, DollarSign, Download, Printer, 
  AlertTriangle, Sliders, CheckCircle2, TrendingUp, Clock, Info, Layers, 
  Activity, ArrowUpRight, BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export default function ReportingHubTab() {
  const [activeReport, setActiveReport] = useState('paper_calibration');

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
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 border-l-4 border-l-purple-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 text-xs font-black uppercase tracking-wider border border-purple-300 dark:border-purple-700">
              PicoDrop Paper Specific
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 shadow-xs">
              Load Cell Telemetry Audit
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            1. Load Scale & Paper Calibration Report
          </h3>
          <p className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-200 mt-1.5 max-w-2xl leading-relaxed">
            Purpose: Audit weight-based Paper intake, tare accuracy, zero-point drift tracking, paper weight anomalies, and weight-limit events.
          </p>
          <div className="mt-2.5 text-xs text-amber-950 dark:text-amber-200 font-bold flex items-center gap-2 bg-amber-100/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-lg w-fit shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Important: PET and Metal are not included as weight-based reward measurements in this report.</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-right shrink-0 shadow-xs">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Total Paper Mass Collected</div>
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
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 border-l-4 border-l-cyan-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-900 dark:text-sky-200 text-xs font-black uppercase tracking-wider border border-sky-300 dark:border-sky-700">
              Fleet Operations
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 shadow-xs">
              Service Response Telemetry
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            2. Fleet Efficiency & Capacity Report
          </h3>
          <p className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-200 mt-1.5 max-w-2xl leading-relaxed">
            Purpose: Monitor machine uptime, collection patterns, bin clearing efficiency, and device performance across RVM and PicoDrop hardware.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-right shrink-0 shadow-xs">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Average Service Turnaround</div>
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
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-xs font-black uppercase tracking-wider border border-emerald-300 dark:border-emerald-700">
              ESG Compliance
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 shadow-xs">
              ISO 14064 Carbon Standard
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            3. Material Diversion & ESG Report
          </h3>
          <p className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-200 mt-1.5 max-w-2xl leading-relaxed">
            Purpose: Executive and compliance reporting for environmental impact, distinguishing unit-counted materials from measured paper weight.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-right shrink-0 shadow-xs">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Estimated CO₂ Avoided</div>
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
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 border-l-4 border-l-amber-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-xs font-black uppercase tracking-wider border border-amber-300 dark:border-amber-700">
              Financial Audit
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 shadow-xs">
              Incentive Reconciliation
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            4. User Loyalty & Incentive Financial Audit
          </h3>
          <p className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-200 mt-1.5 max-w-2xl leading-relaxed">
            Purpose: Reconcile distributed loyalty points against raw material intake and audit acquisition costs.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-right shrink-0 shadow-xs">
          <div className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300">Total Points Issued</div>
          <div className="text-3xl font-black text-amber-700 dark:text-amber-300 mono mt-0.5">142,850 <span className="text-base text-amber-600 dark:text-amber-400 font-normal">pts</span></div>
          <div className="text-xs text-amber-900 dark:text-amber-300 font-extrabold mt-1">Financial Liability: PKR 14,285</div>
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
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl t-bg-sec hover:t-bg-hover border t-border text-xs font-bold t-text-primary transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print Audit</span>
          </button>
          <button 
            onClick={() => alert('Generating compliance audit PDF...')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40"
          >
            <Download className="w-4 h-4" />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* 4 Report Tabs Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4 2xl:gap-5">
        {reports.map(rep => {
          const Icon = rep.icon;
          const isSelected = activeReport === rep.id;

          return (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected 
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-400' 
                  : 'glass-panel hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-cyan-500 text-black' : 'bg-white/5 t-text-muted'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                  isSelected ? 'bg-cyan-400 text-black font-black' : 'bg-white/5 t-text-muted'
                }`}>
                  {rep.badge}
                </span>
              </div>

              <div>
                <div className="text-xs font-black leading-tight t-text-primary">
                  {rep.title}
                </div>
                <div className="text-[10px] t-text-muted mt-1 leading-snug">
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

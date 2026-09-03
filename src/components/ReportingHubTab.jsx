import React, { useState } from 'react';
import { 
  FileText, Scale, Cpu, Leaf, DollarSign, Download, Printer, 
  Calendar, CheckCircle2, AlertTriangle, ArrowUpRight, TrendingUp,
  Sliders, Gauge, Clock, ShieldCheck, RefreshCw, BarChart3, PieChart
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export default function ReportingHubTab() {
  const [activeReport, setActiveReport] = useState('paper_calibration');
  const [timeRange, setTimeRange] = useState('30d');

  // Reports definition
  const reports = [
    { 
      id: 'paper_calibration', 
      title: 'Load Scale & Paper Calibration Report', 
      badge: 'PicoDrop Specific', 
      icon: Scale, 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30'
    },
    { 
      id: 'fleet_efficiency', 
      title: 'Fleet Efficiency & Capacity Report', 
      badge: 'RVM + PicoDrop', 
      icon: Cpu, 
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/30'
    },
    { 
      id: 'esg_diversion', 
      title: 'Material Diversion & ESG Report', 
      badge: 'Compliance & Carbon', 
      icon: Leaf, 
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30'
    },
    { 
      id: 'loyalty_audit', 
      title: 'User Loyalty & Incentive Financial Audit', 
      badge: 'Payout Reconciliation', 
      icon: DollarSign, 
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30'
    },
  ];

  // Report 1: Scale Tare Calibration Data
  const calibrationLogs = [
    { id: 'CAL-901', unit: 'PicoDrop-01', timestamp: '2026-09-03 14:10', tareOffset: '0.00 g', zeroDrift: '+0.02 g', status: 'Optimal', technician: 'Tech-44' },
    { id: 'CAL-902', unit: 'PicoDrop-02', timestamp: '2026-09-02 09:25', tareOffset: '0.00 g', zeroDrift: '-0.05 g', status: 'Optimal', technician: 'Auto-Tare' },
    { id: 'CAL-903', unit: 'PicoDrop-03', timestamp: '2026-09-01 18:40', tareOffset: '+0.15 g', zeroDrift: '+0.32 g', status: 'Compensated', technician: 'Auto-Tare' },
    { id: 'CAL-904', unit: 'PicoDrop-05', timestamp: '2026-09-01 11:15', tareOffset: '+0.45 g', zeroDrift: '+1.20 g', status: 'Drift Warning', technician: 'Maintenance Req' },
  ];

  const scaleAnomalies = [
    { id: 'ANOM-12', unit: 'PicoDrop-05', event: 'Tare Drift Exceeded > 1.0g', timestamp: '2026-09-03 10:15', action: 'Auto-flagged for recalibration' },
    { id: 'ANOM-11', unit: 'PicoDrop-03', event: 'Weight Limit Surge (> 15.0 kg)', timestamp: '2026-09-03 08:30', action: 'Chute auto-locked until bin cleared' },
    { id: 'ANOM-10', unit: 'PicoDrop-01', event: 'Sudden Negative Mass Spike (-120g)', timestamp: '2026-09-02 16:45', action: 'Auto-zero recovery executed' },
  ];

  // Report 2: Fleet Efficiency & Turnaround Data
  const fleetUptimeData = [
    { location: 'Central Metro Hub', rvmUptime: 99.4, picoUptime: 98.8, avgTurnaroundMin: 34 },
    { location: 'North Terminal Plaza', rvmUptime: 97.2, picoUptime: 99.1, avgTurnaroundMin: 42 },
    { location: 'Green Campus Center', rvmUptime: 99.8, picoUptime: 99.5, avgTurnaroundMin: 22 },
    { location: 'West Eco District', rvmUptime: 96.5, picoUptime: 95.8, avgTurnaroundMin: 58 },
  ];

  // Render Report 1: Load Scale & Paper Calibration Report
  const renderPaperCalibrationReport = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 text-[10px] font-black uppercase">
              PicoDrop Paper Specific
            </span>
            <span className="text-xs text-purple-300 font-mono">Load Scale Audit v2.4</span>
          </div>
          <h3 className="text-lg font-black text-white mt-1">Load Scale & Paper Calibration Audit</h3>
          <p className="text-xs text-gray-300 mt-0.5">
            Audit weight-based Paper intake, tare accuracy, zero-point drift tracking, and weight limit threshold events.
          </p>
          <div className="mt-2 text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            PET and Metal are not included as weight-based reward measurements in this report.
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-purple-500/30 text-right shrink-0">
          <div className="text-[10px] uppercase font-bold text-gray-400">Total Paper Mass Audited</div>
          <div className="text-2xl font-black text-purple-300 mono">148.50 kg</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-0.5">Net Mass Rewarded: 148,500 pts</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-purple-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">Total Paper Mass</div>
          <div className="text-xl font-black text-purple-400 mono mt-1">148.5 kg</div>
          <div className="text-[10px] text-gray-400 mt-1">Aggregated Net Load Scales</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-cyan-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">Scale Tare Accuracy</div>
          <div className="text-xl font-black text-cyan-400 mono mt-1">99.82%</div>
          <div className="text-[10px] text-emerald-400 mt-1">Within ±0.1g tolerance</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-amber-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">Zero-Point Drift Events</div>
          <div className="text-xl font-black text-amber-400 mono mt-1">4 Recorded</div>
          <div className="text-[10px] text-amber-400 mt-1">3 Auto-compensated, 1 Manual</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-rose-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">Weight-Limit Triggers</div>
          <div className="text-xl font-black text-rose-400 mono mt-1">2 Events</div>
          <div className="text-[10px] text-rose-400 mt-1">Paper bin limit exceeded (&gt;15 kg)</div>
        </div>
      </div>

      {/* Scale Tare Calibration Log Table */}
      <div className="glass-panel p-5 rounded-2xl border t-border space-y-3">
        <div className="flex items-center justify-between border-b t-border pb-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-purple-400" />
            Scale Tare Calibration Log
          </h4>
          <span className="text-[10px] text-gray-400 font-mono">Load Cell Strain-Gauge Telemetry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="t-bg-sec text-[10px] uppercase font-bold t-text-muted">
              <tr>
                <th className="p-2.5">Log ID</th>
                <th className="p-2.5">Hardware Unit</th>
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Tare Offset</th>
                <th className="p-2.5">Zero-Point Drift</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border font-mono">
              {calibrationLogs.map(log => (
                <tr key={log.id} className="hover:bg-white/5">
                  <td className="p-2.5 font-bold text-cyan-300">{log.id}</td>
                  <td className="p-2.5 text-white font-bold">{log.unit}</td>
                  <td className="p-2.5 text-gray-400 text-[11px]">{log.timestamp}</td>
                  <td className="p-2.5">{log.tareOffset}</td>
                  <td className="p-2.5 font-bold text-amber-300">{log.zeroDrift}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'Optimal' ? 'bg-emerald-500/20 text-emerald-300' :
                      log.status === 'Compensated' ? 'bg-cyan-500/20 text-cyan-300' :
                      'bg-rose-500/20 text-rose-300'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-gray-300 text-[11px]">{log.technician}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paper Weight Anomalies & Threshold Events */}
      <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 space-y-3">
        <div className="flex items-center justify-between border-b t-border pb-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Paper Weight Anomalies & Limit Events
          </h4>
          <span className="text-[10px] text-amber-400 font-mono font-bold">Audited Thresholds</span>
        </div>

        <div className="space-y-2">
          {scaleAnomalies.map(item => (
            <div key={item.id} className="p-3 rounded-xl bg-black/20 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="mono text-cyan-400 font-bold">[{item.id}]</span>
                <span className="text-purple-300 font-bold">{item.unit}:</span>
                <span className="text-white font-medium">{item.event}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-emerald-400">{item.action}</span>
                <span className="t-text-muted font-mono">{item.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Report 2: Fleet Efficiency & Capacity Report
  const renderFleetEfficiencyReport = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/30 text-cyan-200 text-[10px] font-black uppercase">
              Fleet Operations
            </span>
            <span className="text-xs text-cyan-300 font-mono">Telemetry Service Audit</span>
          </div>
          <h3 className="text-lg font-black text-white mt-1">Fleet Efficiency & Capacity Report</h3>
          <p className="text-xs text-gray-300 mt-0.5">
            Monitor machine uptime, collection patterns, bin clearing turnaround efficiency, and hardware failure rates.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/30 text-right shrink-0">
          <div className="text-[10px] uppercase font-bold text-gray-400">Mean Service Turnaround</div>
          <div className="text-2xl font-black text-cyan-300 mono">34.2 mins</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-0.5">Target: &lt; 45 mins (Met)</div>
        </div>
      </div>

      {/* KPI Comparison Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-cyan-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">RVM Fleet Uptime</div>
          <div className="text-xl font-black text-cyan-400 mono mt-1">98.7%</div>
          <div className="text-[10px] text-gray-400 mt-1">Optical hopper availability</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-purple-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">PicoDrop Fleet Uptime</div>
          <div className="text-xl font-black text-purple-400 mono mt-1">98.3%</div>
          <div className="text-[10px] text-gray-400 mt-1">Tri-chute scale availability</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-amber-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">RVM Bin Full Events</div>
          <div className="text-xl font-black text-amber-400 mono mt-1">12 Total</div>
          <div className="text-[10px] text-gray-400 mt-1">Unit capacity trigger (100%)</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-rose-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">PicoDrop Weight Limits</div>
          <div className="text-xl font-black text-rose-400 mono mt-1">5 Total</div>
          <div className="text-[10px] text-gray-400 mt-1">Paper scale &gt; 15kg limit</div>
        </div>
      </div>

      {/* Failure Rate Comparison: Optical/Motor vs Counter/Load Scale */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border t-border space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            RVM Hardware Diagnostics
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20">
              <span className="t-text-muted">Optical Scanner Lens Smudge:</span>
              <span className="font-bold text-amber-400 mono">0.4% sessions</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20">
              <span className="t-text-muted">Intake Motor Gate Jams:</span>
              <span className="font-bold text-emerald-400 mono">0.05% sessions</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20">
              <span className="t-text-muted">Internal Conveyor Errors:</span>
              <span className="font-bold text-emerald-400 mono">0.02% sessions</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border t-border space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-purple-400" />
            PicoDrop Hardware Diagnostics
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20">
              <span className="t-text-muted">Load Scale Zero Drift:</span>
              <span className="font-bold text-amber-400 mono">0.3% sessions</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20">
              <span className="t-text-muted">PET / Can Optical Trigger Faults:</span>
              <span className="font-bold text-emerald-400 mono">0.08% sessions</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20">
              <span className="t-text-muted">Paper Bin Level Sensor Discrepancy:</span>
              <span className="font-bold text-emerald-400 mono">0.12% sessions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Turnaround Table */}
      <div className="glass-panel p-5 rounded-2xl border t-border space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-white">Location Throughput & Turnaround Efficiency</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="t-bg-sec text-[10px] uppercase font-bold t-text-muted">
              <tr>
                <th className="p-2.5">Location</th>
                <th className="p-2.5">RVM Uptime</th>
                <th className="p-2.5">PicoDrop Uptime</th>
                <th className="p-2.5">Avg Service Turnaround</th>
                <th className="p-2.5">Performance Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border">
              {fleetUptimeData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5">
                  <td className="p-2.5 font-bold text-white">{row.location}</td>
                  <td className="p-2.5 text-cyan-300 font-mono">{row.rvmUptime}%</td>
                  <td className="p-2.5 text-purple-300 font-mono">{row.picoUptime}%</td>
                  <td className="p-2.5 font-mono text-emerald-400 font-bold">{row.avgTurnaroundMin} mins</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Class A
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render Report 3: Material Diversion & ESG Report
  const renderESGReport = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 text-[10px] font-black uppercase">
              ESG Compliance
            </span>
            <span className="text-xs text-emerald-300 font-mono">Carbon Standard ISO 14064</span>
          </div>
          <h3 className="text-lg font-black text-white mt-1">Material Diversion & Environmental Impact Audit</h3>
          <p className="text-xs text-gray-300 mt-0.5">
            Executive and compliance reporting for landfill diversion, CO₂ emission offsets, and tree conservation.
          </p>
          <div className="mt-2 text-[11px] text-emerald-300 font-semibold">
            Strict Accounting: Unit-counted materials clearly distinguished from load-scale measured Paper weight.
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 text-right shrink-0">
          <div className="text-[10px] uppercase font-bold text-gray-400">Total CO₂ Avoided</div>
          <div className="text-2xl font-black text-emerald-400 mono">1,842.6 kg CO₂e</div>
          <div className="text-[10px] text-emerald-300 font-bold mt-0.5">Trees Saved: ~2.5 Trees</div>
        </div>
      </div>

      {/* Material Breakdown Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">PET Units Diverted</div>
          <div className="text-xl font-black text-emerald-400 mono mt-1">8,420 Units</div>
          <div className="text-[10px] text-gray-400 mt-1">Est. 252.6 kg plastic mass</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-amber-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">Metal Units Diverted</div>
          <div className="text-xl font-black text-amber-400 mono mt-1">3,615 Units</div>
          <div className="text-[10px] text-gray-400 mt-1">Est. 54.2 kg aluminum mass</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-cyan-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">Cardboard Units Diverted</div>
          <div className="text-xl font-black text-cyan-400 mono mt-1">1,240 Units</div>
          <div className="text-[10px] text-gray-400 mt-1">Est. 37.2 kg paperboard</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-purple-500 bg-purple-950/10">
          <div className="text-[10px] uppercase font-bold text-purple-300 font-black">Measured Paper Mass</div>
          <div className="text-xl font-black text-purple-300 mono mt-1">148.5 kg</div>
          <div className="text-[10px] text-purple-200 mt-1 font-bold">100% Load-Cell Verified</div>
        </div>
      </div>

      {/* Carbon & Conservation Equivalents Detail */}
      <div className="p-6 glass-panel rounded-2xl border t-border space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Environmental Savings Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
            <div className="text-xs t-text-muted font-bold">Avoided Landfill Volume</div>
            <div className="text-xl font-black text-cyan-300 mono">4.82 m³</div>
            <p className="text-[10px] t-text-muted">Compacted solid waste volume diverted from regional landfill.</p>
          </div>

          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
            <div className="text-xs t-text-muted font-bold">Conserved Energy (kWh)</div>
            <div className="text-xl font-black text-emerald-300 mono">3,490 kWh</div>
            <p className="text-[10px] t-text-muted">Equivalent to powering 124 residential households for 1 day.</p>
          </div>

          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
            <div className="text-xs t-text-muted font-bold">Trees Conserved (PicoDrop Paper)</div>
            <div className="text-xl font-black text-purple-300 mono">2.52 Trees</div>
            <p className="text-[10px] t-text-muted">Directly audited from 148.5 kg pure paper intake via PicoDrop load cells.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Report 4: User Loyalty & Incentive Financial Audit
  const renderFinancialAuditReport = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 text-[10px] font-black uppercase">
              Financial Audit
            </span>
            <span className="text-xs text-amber-300 font-mono">Point Ledger Reconciliation</span>
          </div>
          <h3 className="text-lg font-black text-white mt-1">User Loyalty & Incentive Financial Audit</h3>
          <p className="text-xs text-gray-300 mt-0.5">
            Reconcile distributed loyalty points against raw material intake and cost-per-kg of paper versus unit payouts.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-amber-500/30 text-right shrink-0">
          <div className="text-[10px] uppercase font-bold text-gray-400">Total Points Emitted</div>
          <div className="text-2xl font-black text-amber-300 mono">142,850 pts</div>
          <div className="text-[10px] text-gray-300 font-bold mt-0.5">Equivalent Value: PKR 14,285</div>
        </div>
      </div>

      {/* Points Emission Rules Ledger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">PET Rate</div>
          <div className="text-lg font-black text-emerald-400 mono mt-1">10 - 15 pts / unit</div>
          <div className="text-[10px] text-gray-400 mt-1">Issued: 84,200 pts</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-amber-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">Metal Can Rate</div>
          <div className="text-lg font-black text-amber-400 mono mt-1">15 - 20 pts / unit</div>
          <div className="text-[10px] text-gray-400 mt-1">Issued: 36,150 pts</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-cyan-500">
          <div className="text-[10px] uppercase font-bold t-text-muted">Cardboard/TetraPak Rate</div>
          <div className="text-lg font-black text-cyan-400 mono mt-1">10 pts / unit</div>
          <div className="text-[10px] text-gray-400 mt-1">Issued: 12,400 pts</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-purple-500 bg-purple-950/10">
          <div className="text-[10px] uppercase font-bold text-purple-300 font-black">Paper Load Cell Rate</div>
          <div className="text-lg font-black text-purple-300 mono mt-1">100 pts / kg</div>
          <div className="text-[10px] text-purple-200 mt-1 font-bold">Issued: 14,850 pts (148.5 kg)</div>
        </div>
      </div>

      {/* Financial Metrics Breakdown */}
      <div className="glass-panel p-5 rounded-2xl border t-border space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">Material Acquisition Cost vs Reward Payout</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="text-xs t-text-muted">Cost-Per-Kg of Paper Acquired:</div>
            <div className="text-xl font-black text-purple-300 mono mt-1">PKR 10.00 / kg</div>
            <div className="text-[10px] text-gray-400 mt-1">Reward Payout: 100 pts/kg = PKR 10.00</div>
          </div>

          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="text-xs t-text-muted">Avg Reward Cost for Unit Materials:</div>
            <div className="text-xl font-black text-emerald-300 mono mt-1">PKR 1.15 / unit</div>
            <div className="text-[10px] text-gray-400 mt-1">Weighted across PET, Cans, Cardboard</div>
          </div>

          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="text-xs t-text-muted">Daily Peak Recycling Hours:</div>
            <div className="text-xl font-black text-cyan-300 mono mt-1">12:00 PM - 3:00 PM</div>
            <div className="text-[10px] text-gray-400 mt-1">Peak active recyclers: 342 / hr</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header & Export Controls */}
      <div className="glass-panel p-5 rounded-3xl border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
              EcoDrop Executive Reporting Hub
            </span>
          </div>
          <h2 className="text-2xl font-black t-text-primary tracking-tight">
            Reporting & Analytics Audits
          </h2>
          <p className="text-xs t-text-secondary mt-0.5">
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
            onClick={() => alert('Exporting high-resolution audit PDF...')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40"
          >
            <Download className="w-4 h-4" />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* 4 Report Tabs Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {reports.map(rep => {
          const Icon = rep.icon;
          const isSelected = activeReport === rep.id;

          return (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected 
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-950/30' 
                  : 'glass-panel hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                  isSelected ? 'bg-cyan-400 text-black font-black' : 'bg-white/5 t-text-muted'
                }`}>
                  {rep.badge}
                </span>
              </div>

              <div>
                <div className={`text-xs font-black leading-tight ${isSelected ? 'text-white' : 't-text-primary'}`}>
                  {rep.title}
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

    </div>
  );
}

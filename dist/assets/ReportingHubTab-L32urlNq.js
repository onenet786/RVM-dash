import{r as k,j as e}from"./vendor-framework-Dqfdfwfk.js";import{F as P,at as C,au as T,a6 as D,af as g,g as f,L as R,av as S,q as E,m as u,Y as M}from"./vendor-icons-D8I6-i-5.js";function U(){const[r,v]=k.useState("paper_calibration"),[n,c]=k.useState(!1),x=[{id:"paper_calibration",title:"Load Scale & Paper Calibration Report",badge:"PicoDrop Specific",icon:g,color:"text-purple-400",description:"Audit weight-based Paper intake, tare accuracy, zero-point drift & anomalies"},{id:"fleet_efficiency",title:"Fleet Efficiency & Capacity Report",badge:"Uptime & Service",icon:f,color:"text-cyan-400",description:"Monitor device uptime, turnaround efficiency, and hardware failure comparisons"},{id:"esg_diversion",title:"Material Diversion & ESG Report",badge:"Carbon Compliance",icon:R,color:"text-emerald-400",description:"Executive reporting for CO₂ avoided, unit diversion, and tree conservation"},{id:"loyalty_audit",title:"User Loyalty & Incentive Financial Audit",badge:"Financial Audit",icon:S,color:"text-amber-400",description:"Reconcile distributed loyalty points against raw material intake and cost-per-kg"}],m=[{id:"CAL-901",unit:"PicoDrop-01",timestamp:"2026-09-03 14:10",tareOffset:"0.00 g",zeroDrift:"+0.02 g",status:"Optimal",technician:"Tech-44"},{id:"CAL-902",unit:"PicoDrop-02",timestamp:"2026-09-02 09:25",tareOffset:"0.00 g",zeroDrift:"-0.05 g",status:"Optimal",technician:"Auto-Tare Routine"},{id:"CAL-903",unit:"PicoDrop-03",timestamp:"2026-09-01 18:40",tareOffset:"+0.15 g",zeroDrift:"+0.32 g",status:"Compensated",technician:"Auto-Tare Routine"},{id:"CAL-904",unit:"PicoDrop-05",timestamp:"2026-09-01 11:15",tareOffset:"+0.45 g",zeroDrift:"+1.20 g",status:"Drift Warning",technician:"Field Service Req"}],p=[{id:"ANOM-12",unit:"PicoDrop-05",event:"Tare Drift Exceeded > 1.0g",timestamp:"2026-09-03 10:15",action:"Auto-flagged for recalibration"},{id:"ANOM-11",unit:"PicoDrop-03",event:"Paper Bin Weight Limit Exceeded (> 15.0 kg)",timestamp:"2026-09-03 08:30",action:"Chute auto-locked until bin cleared by team"},{id:"ANOM-10",unit:"PicoDrop-01",event:"Sudden Negative Mass Spike (-120g)",timestamp:"2026-09-02 16:45",action:"Auto-zero recovery executed"}],b=[{location:"Central Metro Hub",rvmUptime:99.4,picoUptime:98.8,avgTurnaroundMin:34},{location:"North Terminal Plaza",rvmUptime:97.2,picoUptime:99.1,avgTurnaroundMin:42},{location:"Green Campus Center",rvmUptime:99.8,picoUptime:99.5,avgTurnaroundMin:22},{location:"West Eco District",rvmUptime:96.5,picoUptime:95.8,avgTurnaroundMin:58}],j=()=>e.jsxs("div",{className:"space-y-6 animate-fade-in",children:[e.jsxs("div",{className:"p-5 rounded-2xl border-2 border-purple-300 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/40 border-l-8 border-l-purple-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1.5",children:[e.jsx("span",{className:"px-2.5 py-0.5 rounded bg-purple-600 text-white text-xs font-black uppercase tracking-wider shadow-xs",children:"PicoDrop Paper Specific"}),e.jsx("span",{className:"text-xs font-mono font-bold text-purple-950 dark:text-purple-200 bg-white/90 dark:bg-purple-900/60 px-2.5 py-0.5 rounded border border-purple-300 dark:border-purple-700 shadow-xs",children:"Load Cell Telemetry Audit"})]}),e.jsx("h3",{className:"text-xl md:text-2xl font-black text-slate-950 dark:text-white",children:"1. Load Scale & Paper Calibration Report"}),e.jsx("p",{className:"text-sm md:text-base font-bold text-slate-900 dark:text-purple-100 mt-1.5 max-w-2xl leading-relaxed",children:"Purpose: Audit weight-based Paper intake, tare accuracy, zero-point drift tracking, paper weight anomalies, and weight-limit events."}),e.jsxs("div",{className:"mt-2.5 text-xs text-amber-950 dark:text-amber-200 font-bold flex items-center gap-2 bg-amber-100/95 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 px-3 py-1.5 rounded-lg w-fit shadow-xs",children:[e.jsx(u,{className:"w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0"}),e.jsx("span",{children:"Important: PET and Metal are not included as weight-based reward measurements in this report."})]})]}),e.jsxs("div",{className:"p-4 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-right shrink-0 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-800 dark:text-slate-200",children:"Total Paper Mass Collected"}),e.jsxs("div",{className:"text-3xl font-black text-purple-700 dark:text-purple-300 mono mt-0.5",children:["148.50 ",e.jsx("span",{className:"text-base text-purple-600 dark:text-purple-400 font-normal",children:"kg"})]}),e.jsx("div",{className:"text-xs text-emerald-800 dark:text-emerald-400 font-extrabold mt-1",children:"Verified Load Cell Net Intake"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5 2xl:gap-6",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"Total Paper Mass"}),e.jsx("div",{className:"text-2xl font-black text-purple-700 dark:text-purple-300 mono mt-1",children:"148.5 kg"}),e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-medium mt-1",children:"Net paper from PicoDrop scales"})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-cyan-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"Scale Tare Accuracy"}),e.jsx("div",{className:"text-2xl font-black text-sky-700 dark:text-cyan-300 mono mt-1",children:"99.82%"}),e.jsx("div",{className:"text-xs text-emerald-800 dark:text-emerald-400 mt-1 font-extrabold",children:"Within ±0.1g tare calibration"})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"Zero-Point Drift Tracking"}),e.jsx("div",{className:"text-2xl font-black text-amber-700 dark:text-amber-300 mono mt-1",children:"4 Events"}),e.jsx("div",{className:"text-xs text-amber-800 dark:text-amber-400 mt-1 font-extrabold",children:"3 Auto-zeroed, 1 Flagged"})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-rose-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"Weight-Limit Events"}),e.jsx("div",{className:"text-2xl font-black text-rose-700 dark:text-rose-300 mono mt-1",children:"2 Triggers"}),e.jsx("div",{className:"text-xs text-rose-800 dark:text-rose-400 mt-1 font-extrabold",children:"Paper bin limit exceeded (>15 kg)"})]})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5",children:[e.jsxs("h4",{className:"text-xs font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5",children:[e.jsx(M,{className:"w-4 h-4 text-purple-600 dark:text-purple-400"}),"Scale Tare Calibration Log"]}),e.jsx("span",{className:"text-xs font-mono font-bold text-slate-700 dark:text-slate-300",children:"PicoDrop Load Cell Calibration Ledger"})]}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-left text-xs",children:[e.jsx("thead",{className:"bg-slate-100 dark:bg-slate-800 text-xs uppercase font-black text-slate-700 dark:text-slate-300",children:e.jsxs("tr",{children:[e.jsx("th",{className:"p-2.5",children:"Log ID"}),e.jsx("th",{className:"p-2.5",children:"Hardware Device"}),e.jsx("th",{className:"p-2.5",children:"Timestamp"}),e.jsx("th",{className:"p-2.5",children:"Tare Offset"}),e.jsx("th",{className:"p-2.5",children:"Zero-Point Drift"}),e.jsx("th",{className:"p-2.5",children:"Status"}),e.jsx("th",{className:"p-2.5",children:"Audit Action"})]})}),e.jsx("tbody",{className:"divide-y border-slate-200 dark:border-slate-700 font-mono",children:m.map(t=>e.jsxs("tr",{className:"hover:bg-slate-500/5",children:[e.jsx("td",{className:"p-2.5 font-bold text-sky-800 dark:text-cyan-300",children:t.id}),e.jsx("td",{className:"p-2.5 text-slate-900 dark:text-white font-bold",children:t.unit}),e.jsx("td",{className:"p-2.5 text-slate-600 dark:text-slate-400 text-xs",children:t.timestamp}),e.jsx("td",{className:"p-2.5 text-slate-900 dark:text-white",children:t.tareOffset}),e.jsx("td",{className:"p-2.5 font-bold text-amber-800 dark:text-amber-300",children:t.zeroDrift}),e.jsx("td",{className:"p-2.5",children:e.jsx("span",{className:`px-2 py-0.5 rounded text-[10px] font-bold ${t.status==="Optimal"?"bg-emerald-50 text-[#0b5d3b] dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30":t.status==="Compensated"?"bg-sky-50 text-sky-800 dark:bg-cyan-500/20 dark:text-cyan-300 border border-sky-200 dark:border-cyan-500/30":"bg-rose-50 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"}`,children:t.status})}),e.jsx("td",{className:"p-2.5 text-slate-700 dark:text-slate-300 text-xs",children:t.technician})]},t.id))})]})})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-300 dark:border-amber-700 shadow-sm space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5",children:[e.jsxs("h4",{className:"text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5",children:[e.jsx(u,{className:"w-4 h-4 text-amber-600 dark:text-amber-400"}),"Paper Weight Anomalies & Limit Events"]}),e.jsx("span",{className:"text-xs font-mono font-bold text-amber-800 dark:text-amber-300",children:"Strain Gauge Exception Feed"})]}),e.jsx("div",{className:"space-y-2",children:p.map(t=>e.jsxs("div",{className:"p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsxs("span",{className:"mono text-sky-800 dark:text-cyan-400 font-bold",children:["[",t.id,"]"]}),e.jsxs("span",{className:"text-purple-800 dark:text-purple-300 font-bold",children:[t.unit,":"]}),e.jsx("span",{className:"text-slate-900 dark:text-white font-medium",children:t.event})]}),e.jsxs("div",{className:"flex items-center gap-3 text-xs",children:[e.jsx("span",{className:"text-emerald-800 dark:text-emerald-400 font-bold",children:t.action}),e.jsx("span",{className:"text-slate-600 dark:text-slate-400 font-mono",children:t.timestamp})]})]},t.id))})]})]}),N=()=>e.jsxs("div",{className:"space-y-6 animate-fade-in",children:[e.jsxs("div",{className:"p-5 rounded-2xl border-2 border-sky-300 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/40 border-l-8 border-l-sky-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1.5",children:[e.jsx("span",{className:"px-2.5 py-0.5 rounded bg-sky-600 text-white text-xs font-black uppercase tracking-wider shadow-xs",children:"Fleet Operations"}),e.jsx("span",{className:"text-xs font-mono font-bold text-sky-950 dark:text-sky-200 bg-white/90 dark:bg-sky-900/60 px-2.5 py-1 rounded border border-sky-300 dark:border-sky-700 shadow-xs",children:"Service Response Telemetry"})]}),e.jsx("h3",{className:"text-xl md:text-2xl font-black text-slate-950 dark:text-white",children:"2. Fleet Efficiency & Capacity Report"}),e.jsx("p",{className:"text-sm md:text-base font-bold text-slate-900 dark:text-sky-100 mt-1.5 max-w-2xl leading-relaxed",children:"Purpose: Monitor machine uptime, collection patterns, bin clearing efficiency, and device performance across RVM and PicoDrop hardware."})]}),e.jsxs("div",{className:"p-4 rounded-xl bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 text-right shrink-0 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-800 dark:text-slate-200",children:"Average Service Turnaround"}),e.jsxs("div",{className:"text-3xl font-black text-sky-700 dark:text-cyan-300 mono mt-0.5",children:["34.2 ",e.jsx("span",{className:"text-base text-sky-600 dark:text-cyan-400 font-normal",children:"mins"})]}),e.jsx("div",{className:"text-xs text-emerald-800 dark:text-emerald-400 font-extrabold mt-1",children:'From "Limit Triggered" to "Cleared"'})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-cyan-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"RVM Bin Capacity Events"}),e.jsx("div",{className:"text-2xl font-black text-sky-700 dark:text-cyan-300 mono mt-1",children:"12 Events"}),e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-medium mt-1",children:"Hopper volume 100% full"})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"PicoDrop Weight-Limit Events"}),e.jsx("div",{className:"text-2xl font-black text-purple-700 dark:text-purple-300 mono mt-1",children:"5 Events"}),e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-medium mt-1",children:"Paper bin > 15.0 kg limit"})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"RVM Fleet Mean Uptime"}),e.jsx("div",{className:"text-2xl font-black text-emerald-700 dark:text-emerald-400 mono mt-1",children:"98.7%"}),e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-medium mt-1",children:"Optical recognition & motor uptime"})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"PicoDrop Mean Uptime"}),e.jsx("div",{className:"text-2xl font-black text-amber-700 dark:text-amber-300 mono mt-1",children:"98.3%"}),e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-medium mt-1",children:"Counter & strain-gauge uptime"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3",children:[e.jsxs("h4",{className:"text-xs font-black uppercase tracking-wider text-sky-800 dark:text-cyan-300 flex items-center gap-1.5",children:[e.jsx(f,{className:"w-4 h-4 text-sky-600 dark:text-cyan-400"}),"RVM Optical / Motor Fault Rates"]}),e.jsxs("div",{className:"space-y-2 text-xs",children:[e.jsxs("div",{className:"flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",children:[e.jsx("span",{className:"text-slate-700 dark:text-slate-300 font-semibold",children:"Optical Chute Scanner Lens Smudge:"}),e.jsx("span",{className:"font-bold text-amber-800 dark:text-amber-400 mono",children:"0.38% sessions"})]}),e.jsxs("div",{className:"flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",children:[e.jsx("span",{className:"text-slate-700 dark:text-slate-300 font-semibold",children:"Intake Motor Gate Jams:"}),e.jsx("span",{className:"font-bold text-emerald-800 dark:text-emerald-400 mono",children:"0.05% sessions"})]}),e.jsxs("div",{className:"flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",children:[e.jsx("span",{className:"text-slate-700 dark:text-slate-300 font-semibold",children:"Conveyor Alignment Errors:"}),e.jsx("span",{className:"font-bold text-emerald-800 dark:text-emerald-400 mono",children:"0.02% sessions"})]})]})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3",children:[e.jsxs("h4",{className:"text-xs font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5",children:[e.jsx(g,{className:"w-4 h-4 text-purple-600 dark:text-purple-400"}),"PicoDrop Counter / Load-Scale Fault Rates"]}),e.jsxs("div",{className:"space-y-2 text-xs",children:[e.jsxs("div",{className:"flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",children:[e.jsx("span",{className:"text-slate-700 dark:text-slate-300 font-semibold",children:"Load Scale Zero Drift:"}),e.jsx("span",{className:"font-bold text-amber-800 dark:text-amber-400 mono",children:"0.28% sessions"})]}),e.jsxs("div",{className:"flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",children:[e.jsx("span",{className:"text-slate-700 dark:text-slate-300 font-semibold",children:"PET / Can Optical Trigger Faults:"}),e.jsx("span",{className:"font-bold text-emerald-800 dark:text-emerald-400 mono",children:"0.07% sessions"})]}),e.jsxs("div",{className:"flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",children:[e.jsx("span",{className:"text-slate-700 dark:text-slate-300 font-semibold",children:"Paper Bin Level Sensor Discrepancy:"}),e.jsx("span",{className:"font-bold text-emerald-800 dark:text-emerald-400 mono",children:"0.11% sessions"})]})]})]})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3",children:[e.jsx("h4",{className:"text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white",children:"Daily & Weekly Throughput per Location"}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-left text-xs",children:[e.jsx("thead",{className:"bg-slate-100 dark:bg-slate-800 text-xs uppercase font-black text-slate-700 dark:text-slate-300",children:e.jsxs("tr",{children:[e.jsx("th",{className:"p-2.5",children:"Location"}),e.jsx("th",{className:"p-2.5",children:"RVM Uptime"}),e.jsx("th",{className:"p-2.5",children:"PicoDrop Uptime"}),e.jsx("th",{className:"p-2.5",children:"Avg Service Turnaround"}),e.jsx("th",{className:"p-2.5",children:"Weekly Intake"})]})}),e.jsx("tbody",{className:"divide-y border-slate-200 dark:border-slate-700",children:b.map((t,l)=>e.jsxs("tr",{className:"hover:bg-slate-500/5",children:[e.jsx("td",{className:"p-2.5 font-bold text-slate-900 dark:text-white",children:t.location}),e.jsxs("td",{className:"p-2.5 text-sky-800 dark:text-cyan-300 font-mono font-bold",children:[t.rvmUptime,"%"]}),e.jsxs("td",{className:"p-2.5 text-purple-800 dark:text-purple-300 font-mono font-bold",children:[t.picoUptime,"%"]}),e.jsxs("td",{className:"p-2.5 font-mono text-emerald-800 dark:text-emerald-400 font-bold",children:[t.avgTurnaroundMin," mins"]}),e.jsx("td",{className:"p-2.5 text-slate-700 dark:text-slate-300 font-mono",children:"~3,200 units / wk"})]},l))})]})})]})]}),y=()=>e.jsxs("div",{className:"space-y-6 animate-fade-in",children:[e.jsxs("div",{className:"p-5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 border-l-8 border-l-emerald-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1.5",children:[e.jsx("span",{className:"px-2.5 py-0.5 rounded bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-xs",children:"ESG Compliance"}),e.jsx("span",{className:"text-xs font-mono font-bold text-emerald-950 dark:text-emerald-200 bg-white/90 dark:bg-emerald-900/60 px-2.5 py-1 rounded border border-emerald-300 dark:border-emerald-700 shadow-xs",children:"ISO 14064 Carbon Standard"})]}),e.jsx("h3",{className:"text-xl md:text-2xl font-black text-slate-950 dark:text-white",children:"3. Material Diversion & ESG Report"}),e.jsx("p",{className:"text-sm md:text-base font-bold text-slate-900 dark:text-emerald-100 mt-1.5 max-w-2xl leading-relaxed",children:"Purpose: Executive and compliance reporting for environmental impact, distinguishing unit-counted materials from measured paper weight."})]}),e.jsxs("div",{className:"p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-right shrink-0 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-800 dark:text-slate-200",children:"Estimated CO₂ Avoided"}),e.jsxs("div",{className:"text-3xl font-black text-emerald-700 dark:text-emerald-400 mono mt-0.5",children:["1,842.6 ",e.jsx("span",{className:"text-base text-emerald-600 dark:text-emerald-300 font-normal",children:"kg CO₂e"})]}),e.jsx("div",{className:"text-xs text-emerald-800 dark:text-emerald-400 font-extrabold mt-1",children:"Trees Conserved: ~2.5 Trees"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"Total PET Units Diverted"}),e.jsx("div",{className:"text-2xl font-black text-emerald-700 dark:text-emerald-400 mono mt-1",children:"8,420 Units"}),e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-medium mt-1",children:"Est. 252.6 kg plastic mass"})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"Total Metal Units Diverted"}),e.jsx("div",{className:"text-2xl font-black text-amber-700 dark:text-amber-300 mono mt-1",children:"3,615 Units"}),e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-medium mt-1",children:"Est. 54.2 kg aluminum mass"})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-cyan-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"Cardboard/TetraPak Units"}),e.jsx("div",{className:"text-2xl font-black text-sky-700 dark:text-cyan-300 mono mt-1",children:"1,240 Units"}),e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-medium mt-1",children:"Est. 37.2 kg paperboard mass"})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-purple-900 dark:text-purple-300 font-black",children:"Measured Paper Weight"}),e.jsx("div",{className:"text-2xl font-black text-purple-700 dark:text-purple-300 mono mt-1",children:"148.5 kg"}),e.jsx("div",{className:"text-xs text-purple-800 dark:text-purple-300 mt-1 font-bold",children:"100% Load-Cell Measured"})]})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4",children:[e.jsx("h4",{className:"text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400",children:"Environmental Conservation Metrics"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1",children:[e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-extrabold",children:"Tree Equivalents Saved"}),e.jsx("div",{className:"text-2xl font-black text-purple-700 dark:text-purple-300 mono",children:"2.52 Trees"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-400 font-medium mt-1",children:"Based on pure Paper mass collected through PicoDrop load scales."})]}),e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1",children:[e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-extrabold",children:"Diverted Landfill Volume"}),e.jsx("div",{className:"text-2xl font-black text-sky-700 dark:text-cyan-300 mono",children:"4.82 m³"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-400 font-medium mt-1",children:"Compacted volume of recycled bottles, cans, cardboard, and paper."})]}),e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1",children:[e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-extrabold",children:"Energy Conserved (kWh)"}),e.jsx("div",{className:"text-2xl font-black text-emerald-700 dark:text-emerald-400 mono",children:"3,490 kWh"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-400 font-medium mt-1",children:"Energy saved vs virgin resource extraction & manufacturing."})]})]})]})]}),w=()=>e.jsxs("div",{className:"space-y-6 animate-fade-in",children:[e.jsxs("div",{className:"p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 border-l-8 border-l-amber-600 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1.5",children:[e.jsx("span",{className:"px-2.5 py-0.5 rounded bg-amber-600 text-white text-xs font-black uppercase tracking-wider shadow-xs",children:"Financial Audit"}),e.jsx("span",{className:"text-xs font-mono font-bold text-amber-950 dark:text-amber-200 bg-white/90 dark:bg-amber-900/60 px-2.5 py-1 rounded border border-amber-300 dark:border-amber-700 shadow-xs",children:"Incentive Reconciliation"})]}),e.jsx("h3",{className:"text-xl md:text-2xl font-black text-slate-950 dark:text-white",children:"4. User Loyalty & Incentive Financial Audit"}),e.jsx("p",{className:"text-sm md:text-base font-bold text-slate-900 dark:text-amber-100 mt-1.5 max-w-2xl leading-relaxed",children:"Purpose: Reconcile distributed loyalty points against raw material intake and audit acquisition costs."})]}),e.jsxs("div",{className:"p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-right shrink-0 shadow-xs",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-800 dark:text-slate-200",children:"Total Points Issued"}),e.jsxs("div",{className:"text-3xl font-black text-amber-700 dark:text-amber-300 mono mt-0.5",children:["142,850 ",e.jsx("span",{className:"text-base text-amber-600 dark:text-amber-400 font-normal",children:"pts"})]}),e.jsx("div",{className:"text-xs text-amber-950 dark:text-amber-300 font-extrabold mt-1",children:"Financial Liability: PKR 14,285"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"Points Issued per PET Unit"}),e.jsx("div",{className:"text-xl font-black text-emerald-700 dark:text-emerald-400 mono mt-1",children:"10 - 15 pts / unit"}),e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-medium mt-1",children:"Total: 84,200 pts issued"})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"Points Issued per Metal Unit"}),e.jsx("div",{className:"text-xl font-black text-amber-700 dark:text-amber-300 mono mt-1",children:"15 - 20 pts / unit"}),e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-medium mt-1",children:"Total: 36,150 pts issued"})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-cyan-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-300",children:"Cardboard/TetraPak Unit Rate"}),e.jsx("div",{className:"text-xl font-black text-sky-700 dark:text-cyan-300 mono mt-1",children:"10 pts / unit"}),e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-medium mt-1",children:"Total: 12,400 pts issued"})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500 shadow-sm",children:[e.jsx("div",{className:"text-xs uppercase font-extrabold tracking-wider text-purple-900 dark:text-purple-300 font-black",children:"Points Issued per kg of Paper"}),e.jsx("div",{className:"text-xl font-black text-purple-700 dark:text-purple-300 mono mt-1",children:"100 pts / kg"}),e.jsx("div",{className:"text-xs text-purple-800 dark:text-purple-300 mt-1 font-bold",children:"Total: 14,850 pts (148.5 kg)"})]})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4",children:[e.jsx("h4",{className:"text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300",children:"Financial Audit & Acquisition Cost Metrics"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700",children:[e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-extrabold",children:"Cost-Per-Kg of Paper Acquired:"}),e.jsx("div",{className:"text-2xl font-black text-purple-700 dark:text-purple-300 mono mt-1",children:"PKR 10.00 / kg"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-400 font-medium mt-1",children:"Payout based on 100 points/kg (PKR 10.00 equivalent)."})]}),e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700",children:[e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-extrabold",children:"Reward Cost for Unit-Based Materials:"}),e.jsx("div",{className:"text-2xl font-black text-emerald-700 dark:text-emerald-400 mono mt-1",children:"PKR 1.15 / unit"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-400 font-medium mt-1",children:"Average weighted reward across PET, metal cans, and cardboard."})]}),e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700",children:[e.jsx("div",{className:"text-xs text-slate-700 dark:text-slate-300 font-extrabold",children:"Daily Active Recyclers & Peak Hours:"}),e.jsx("div",{className:"text-2xl font-black text-sky-700 dark:text-cyan-300 mono mt-1",children:"12:00 PM - 3:00 PM"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-400 font-medium mt-1",children:"342 active recyclers/hr during peak daily hours."})]})]})]})]}),h=()=>{c(!0);try{const t=x.find(a=>a.id===r)||x[0],l=new Date().toLocaleString("en-US",{dateStyle:"medium",timeStyle:"short"}),i=`AUD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1e3+Math.random()*9e3)}`;let d="";r==="paper_calibration"?d=`
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
              ${m.map(a=>`
                <tr>
                  <td class="mono font-bold">${a.id}</td>
                  <td class="font-bold">${a.unit}</td>
                  <td class="mono">${a.timestamp}</td>
                  <td class="mono">${a.tareOffset}</td>
                  <td class="mono font-bold">${a.zeroDrift}</td>
                  <td><span class="badge ${a.status.toLowerCase().replace(/[^a-z]/g,"-")}">${a.status}</span></td>
                  <td>${a.technician}</td>
                </tr>
              `).join("")}
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
              ${p.map(a=>`
                <tr>
                  <td class="mono font-bold">${a.id}</td>
                  <td class="font-bold">${a.unit}</td>
                  <td>${a.event}</td>
                  <td class="status-cleared">${a.action}</td>
                  <td class="mono">${a.timestamp}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `:r==="fleet_efficiency"?d=`
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
              ${b.map(a=>`
                <tr>
                  <td class="font-bold">${a.location}</td>
                  <td class="mono font-bold text-cyan">${a.rvmUptime}%</td>
                  <td class="mono font-bold text-purple">${a.picoUptime}%</td>
                  <td class="mono font-bold text-green">${a.avgTurnaroundMin} mins</td>
                  <td class="mono">~3,200 units / wk</td>
                </tr>
              `).join("")}
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
        `:r==="esg_diversion"?d=`
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
        `:d=`
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
        `;const o=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${t.title} • EcoDrop Operations Audit</title>
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
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo-img {
      height: 48px;
      width: auto;
      object-fit: contain;
    }
    .brand-title {
      font-size: 17px;
      font-weight: 900;
      color: #073b28;
      letter-spacing: -0.3px;
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
    <div class="header-left">
      <img src="/isp_logo.png" class="brand-logo-img" alt="ISP Environmental Logo" />
      <div>
        <div class="brand-title">ISP Environmental Solutions Pvt. Ltd.</div>
        <div class="brand-sub">Regulatory & Operations Audit • Smart RVM Telemetry Network</div>
        <div class="report-title-main">${t.title}</div>
      </div>
    </div>
    <div class="meta-box">
      <div class="badge-confidential">Official Compliance Record</div>
      <div class="meta-item">Ref ID: <strong class="mono">${i}</strong></div>
      <div class="meta-item">Date: <strong>${l}</strong></div>
      <div class="meta-item">Standard: <strong>ISO 14064 / ONS-RVM</strong></div>
    </div>
  </div>

  ${d}

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
</html>`,s=document.createElement("iframe");s.style.position="fixed",s.style.right="0",s.style.bottom="0",s.style.width="0",s.style.height="0",s.style.border="0",document.body.appendChild(s),s.contentDocument.open(),s.contentDocument.write(o),s.contentDocument.close(),setTimeout(()=>{s.contentWindow.focus(),s.contentWindow.print(),setTimeout(()=>{try{document.body.removeChild(s)}catch{}c(!1)},1e3)},500)}catch(t){console.error("Export error:",t),c(!1),window.print()}};return e.jsxs("div",{className:"space-y-6 animate-fade-in",children:[e.jsxs("div",{className:"glass-panel p-6 rounded-3xl border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1.5",children:[e.jsx(P,{className:"w-5 h-5 text-cyan-400"}),e.jsx("span",{className:"text-xs font-black uppercase tracking-wider text-cyan-400",children:"EcoDrop Operations Center"})]}),e.jsx("h2",{className:"text-2xl md:text-3xl font-black t-text-primary tracking-tight",children:"Reporting & Analytics Hub"}),e.jsx("p",{className:"text-xs md:text-sm t-text-secondary mt-1",children:"Dedicated auditing for load scale calibration, fleet uptime turnaround, ESG diversion, and incentive payouts."})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 shrink-0",children:[e.jsxs("button",{onClick:()=>h(),className:"flex items-center gap-1.5 px-3.5 py-2 rounded-xl t-bg-sec hover:t-bg-hover border t-border text-xs font-bold t-text-primary transition-all shadow-sm",title:"Print Clean Compliance Audit",children:[e.jsx(C,{className:"w-4 h-4 text-cyan-400"}),e.jsx("span",{children:"Print Audit"})]}),e.jsxs("button",{onClick:()=>h(),disabled:n,className:"flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50",title:"Export Clean Compliance Audit as PDF",children:[n?e.jsx(T,{className:"w-4 h-4 animate-spin"}):e.jsx(D,{className:"w-4 h-4"}),e.jsx("span",{children:n?"Generating PDF...":"Export Report (PDF)"})]})]})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4 2xl:gap-5",children:x.map(t=>{const l=t.icon,i=r===t.id,d={paper_calibration:{card:"bg-purple-50/90 dark:bg-purple-950/40 border-purple-500 shadow-md ring-2 ring-purple-500/20",icon:"bg-purple-600 text-white shadow-xs",badge:"bg-purple-200/90 text-purple-950 dark:bg-purple-900/70 dark:text-purple-200 border border-purple-300 dark:border-purple-700"},fleet_efficiency:{card:"bg-sky-50/90 dark:bg-sky-950/40 border-sky-500 shadow-md ring-2 ring-sky-500/20",icon:"bg-sky-600 text-white shadow-xs",badge:"bg-sky-200/90 text-sky-950 dark:bg-sky-900/70 dark:text-sky-200 border border-sky-300 dark:border-sky-700"},esg_diversion:{card:"bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/20",icon:"bg-emerald-600 text-white shadow-xs",badge:"bg-emerald-200/90 text-emerald-950 dark:bg-emerald-900/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"},loyalty_audit:{card:"bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-500/20",icon:"bg-amber-600 text-white shadow-xs",badge:"bg-amber-200/90 text-amber-950 dark:bg-amber-900/70 dark:text-amber-200 border border-amber-300 dark:border-amber-700"}},o=d[t.id]||d.paper_calibration;return e.jsxs("button",{onClick:()=>v(t.id),className:`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${i?o.card:"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"}`,children:[e.jsxs("div",{className:"flex items-center justify-between w-full mb-3",children:[e.jsx("div",{className:`p-2 rounded-xl transition-colors ${i?o.icon:"bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`,children:e.jsx(l,{className:"w-4 h-4"})}),e.jsx("span",{className:`text-[10px] font-bold px-2 py-0.5 rounded-md ${i?o.badge:"bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`,children:t.badge})]}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-black leading-tight text-slate-950 dark:text-white",children:t.title}),e.jsx("div",{className:"text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-snug font-medium",children:t.description})]})]},t.id)})}),e.jsxs("div",{className:"pt-2",children:[r==="paper_calibration"&&j(),r==="fleet_efficiency"&&N(),r==="esg_diversion"&&y(),r==="loyalty_audit"&&w()]}),e.jsxs("div",{className:"glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between border-b t-border pb-3",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(E,{className:"w-5 h-5 text-emerald-400"}),e.jsx("h3",{className:"text-sm font-black uppercase tracking-wider t-text-primary",children:"Final Updated Core Logic Architecture"})]}),e.jsx("span",{className:"text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/20 text-[#0b5d3b] dark:text-emerald-300 font-bold border border-emerald-500/30",children:"EcoDrop Intake Standards"})]}),e.jsx("div",{className:"p-4 rounded-2xl t-bg-sec border t-border overflow-x-auto",children:e.jsx("pre",{className:"font-mono text-xs text-[#0b5d3b] dark:text-emerald-300 font-bold leading-relaxed mx-auto w-fit",children:`                         ECODROP
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
                                      Weight Reward`})})]})]})}export{U as default};

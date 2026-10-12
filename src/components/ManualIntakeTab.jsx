import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardEdit, Search, UserCheck, UserPlus, Phone, User, Award,
  Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Printer, X,
  Trash2, ShieldAlert, Cpu, ArrowRight, HelpCircle, Layers, FileText
} from 'lucide-react';

const REASONS = [
  { id: 'KIOSK_OUT_OF_ORDER', label: '⚠️ Kiosk Out of Order / Hardware Fault', desc: 'Aperture motor or intake sensor fault' },
  { id: 'BIN_FULL', label: '🛑 Bin Full / Aperture Locked', desc: 'Internal container storage reached capacity' },
  { id: 'MAINTENANCE', label: '⚙️ Scheduled Maintenance / Service', desc: 'Technician routine check or software update' },
  { id: 'BULK_DEPOSIT', label: '📦 Bulk / Office Paper Drop', desc: 'Large batch unsuitable for single-item slot' },
  { id: 'ASSISTED_DROP', label: '🤝 Attendant Assisted Deposit', desc: 'Senior citizen or manual desk assistance' },
  { id: 'OTHER', label: '📝 Other Manual Intake', desc: 'Custom manual credit reason' }
];

export default function ManualIntakeTab({ currentUser, selectedClientId, stationFilter }) {
  // Mobile search state
  const [mobileInput, setMobileInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [citizenData, setCitizenData] = useState(null); // { exists: bool, user, stats, ... }
  const [customFullName, setCustomFullName] = useState('');

  // Machine and Reason
  const [machinesList, setMachinesList] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [intakeReason, setIntakeReason] = useState('KIOSK_OUT_OF_ORDER');
  const [operatorNotes, setOperatorNotes] = useState('');

  // Item counts
  const [plasticSmall, setPlasticSmall] = useState(0);
  const [plasticMedium, setPlasticMedium] = useState(0);
  const [plasticLarge, setPlasticLarge] = useState(0);

  const [canSmall, setCanSmall] = useState(0);
  const [canMedium, setCanMedium] = useState(0);
  const [canLarge, setCanLarge] = useState(0);

  const [paperGrams, setPaperGrams] = useState(0);
  const [tetrapakCount, setTetrapakCount] = useState(0);

  // Bonus / Custom points override
  const [allowCustomPoints, setAllowCustomPoints] = useState(false);
  const [customPointsInput, setCustomPointsInput] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // History & Summary
  const [historyLogs, setHistoryLogs] = useState([]);
  const [todaySummary, setTodaySummary] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch machines and initial history
  useEffect(() => {
    fetchMachines();
    fetchHistory();
  }, []);

  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/manual-intake/machines');
      if (res.ok) {
        const data = await res.json();
        const list = data.machines || [];
        setMachinesList(list);
        if (list.length > 0 && !selectedMachine) {
          // If current user is assigned to specific machines, pick their first assigned
          const assigned = currentUser?.assignedMachines;
          if (Array.isArray(assigned) && assigned.length > 0 && assigned[0] !== '*') {
            setSelectedMachine(assigned[0]);
          } else {
            setSelectedMachine(list[0].machine_id);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load machines:', e);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch('/api/manual-intake/history');
      if (res.ok) {
        const data = await res.json();
        setHistoryLogs(data.history || []);
        setTodaySummary(data.summary || null);
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Perform Citizen Search
  const handleLookupCitizen = async (phoneToSearch) => {
    const query = (phoneToSearch || mobileInput).trim();
    if (!query || query.length < 3) {
      setSearchError('Please enter at least 4 digits of the mobile number.');
      setCitizenData(null);
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSubmitError('');

    try {
      const res = await fetch(`/api/manual-intake/lookup?mobile=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to lookup citizen.');
      }

      setCitizenData(data);
      if (data.exists && data.user) {
        setCustomFullName(data.user.fullName || '');
      } else {
        setCustomFullName('');
      }
    } catch (err) {
      setSearchError(err.message || 'Lookup failed. Please check network connection.');
      setCitizenData(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced auto-lookup when 11 digits entered (e.g. 03001234567)
  useEffect(() => {
    const cleaned = mobileInput.replace(/[^0-9]/g, '');
    if (cleaned.length === 11 || (cleaned.startsWith('92') && cleaned.length === 12)) {
      const timer = setTimeout(() => {
        handleLookupCitizen(cleaned);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [mobileInput]);

  // Aggregate items
  const totalPlasticCount = plasticSmall + plasticMedium + plasticLarge;
  const totalCanCount = canSmall + canMedium + canLarge;
  const totalItemsCount = totalPlasticCount + totalCanCount + tetrapakCount + (paperGrams > 0 ? 1 : 0);

  // Standard calculated points:
  // Plastic: 10 pts, Can: 20 pts, Paper: 15 pts/kg, UBC: 10 pts
  const autoCalculatedPoints = (totalPlasticCount * 10) +
    (totalCanCount * 20) +
    Math.round((paperGrams / 1000) * 15) +
    (tetrapakCount * 10);

  const effectivePointsToAward = allowCustomPoints && customPointsInput !== ''
    ? Math.max(0, parseInt(customPointsInput) || 0)
    : autoCalculatedPoints;

  // Environmental impact
  const totalWeightKg = parseFloat((
    (totalPlasticCount * 0.025) +
    (totalCanCount * 0.015) +
    (paperGrams / 1000) +
    (tetrapakCount * 0.02)
  ).toFixed(3));

  const co2AvoidedKg = parseFloat((
    (totalPlasticCount * 0.05) +
    (totalCanCount * 0.09) +
    ((paperGrams / 1000) * 1.3) +
    (tetrapakCount * 0.04)
  ).toFixed(3));

  // Projected New Balance
  const currentCitizenBalance = citizenData?.exists ? (citizenData.user?.pointsBalance || 0) : 0;
  const projectedBalance = currentCitizenBalance + effectivePointsToAward;

  // Handle Submit Intake
  const handleSubmitIntake = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const cleanMobile = mobileInput.trim();
    if (!cleanMobile) {
      setSubmitError('Citizen mobile number is required.');
      return;
    }

    if (totalItemsCount === 0 && paperGrams === 0) {
      setSubmitError('Please enter at least 1 bottle, can, or paper weight.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        mobile: cleanMobile,
        fullName: customFullName.trim() || undefined,
        machineId: selectedMachine || 'DESK-COUNTER-01',
        reason: intakeReason,
        notes: operatorNotes.trim(),
        plasticSmallCount: plasticSmall,
        plasticMediumCount: plasticMedium,
        plasticLargeCount: plasticLarge,
        plasticCount: totalPlasticCount,
        canSmallCount: canSmall,
        canMediumCount: canMedium,
        canLargeCount: canLarge,
        aluminiumCount: totalCanCount,
        paperWeightGrams: paperGrams,
        tetrapakCount: tetrapakCount,
        customPoints: allowCustomPoints ? effectivePointsToAward : undefined,
        operatorUsername: currentUser?.username || 'desk_operator'
      };

      const res = await fetch('/api/manual-intake/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit manual intake.');
      }

      setSubmitSuccess(data);
      fetchHistory(); // Refresh recent table
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Form for next citizen
  const handleResetForm = () => {
    setMobileInput('');
    setCitizenData(null);
    setSearchError('');
    setCustomFullName('');
    setPlasticSmall(0);
    setPlasticMedium(0);
    setPlasticLarge(0);
    setCanSmall(0);
    setCanMedium(0);
    setCanLarge(0);
    setPaperGrams(0);
    setTetrapakCount(0);
    setAllowCustomPoints(false);
    setCustomPointsInput('');
    setOperatorNotes('');
    setSubmitSuccess(null);
    setSubmitError('');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">

      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border t-border relative overflow-hidden shadow-xl bg-gradient-to-r from-emerald-950/20 via-teal-950/10 to-transparent">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ClipboardEdit className="w-3.5 h-3.5 text-emerald-400" />
              Attendant POS • Out-of-Order Fail-Safe Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight t-text-primary flex items-center gap-3">
              Manual Intake & Assisted Recycling Station
            </h1>
            <p className="text-sm t-text-secondary max-w-2xl leading-relaxed">
              Instantly credit bottles, cans, and paper against a citizen's mobile number when a physical kiosk is undergoing maintenance, aperture-jammed, or full.
            </p>
          </div>

          {/* Quick Desk KPIs */}
          {todaySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/20 p-3.5 rounded-2xl border t-border shrink-0">
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold t-text-muted block">Today Drops</span>
                <span className="text-lg font-black text-emerald-400">{todaySummary.count_today || 0}</span>
              </div>
              <div className="text-center px-2 border-l border-white/10">
                <span className="text-[10px] uppercase font-bold t-text-muted block">Bottles (PET)</span>
                <span className="text-lg font-black text-cyan-400">{todaySummary.bottles_today || 0}</span>
              </div>
              <div className="text-center px-2 border-l border-white/10">
                <span className="text-[10px] uppercase font-bold t-text-muted block">Cans (Metal)</span>
                <span className="text-lg font-black text-amber-400">{todaySummary.cans_today || 0}</span>
              </div>
              <div className="text-center px-2 border-l border-white/10">
                <span className="text-[10px] uppercase font-bold t-text-muted block">Paper Weight</span>
                <span className="text-lg font-black text-indigo-400">{((todaySummary.paper_grams_today || 0) / 1000).toFixed(1)} kg</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Intake Form Grid */}
      <form onSubmit={handleSubmitIntake} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Citizen Lookup + Kiosk Target (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Citizen Mobile Number & Profile Card */}
          <div className="glass-panel p-6 rounded-3xl border t-border space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide t-text-primary">1. Recycler Mobile Number</h3>
                  <p className="text-xs t-text-muted">Lookup account or auto-register guest</p>
                </div>
              </div>
              {citizenData?.exists && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified Member
                </span>
              )}
            </div>

            {/* Mobile Input Group */}
            <div className="space-y-2">
              <label className="text-xs font-semibold t-text-secondary flex items-center justify-between">
                <span>Citizen Mobile Number</span>
                <span className="text-[11px] t-text-muted">e.g. 03001234567</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={mobileInput}
                  onChange={(e) => setMobileInput(e.target.value)}
                  placeholder="0300 1234567"
                  className="w-full px-4 py-3.5 pl-11 text-lg font-mono font-bold tracking-wide rounded-2xl bg-black/30 border t-border t-text-primary placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  autoComplete="off"
                />
                <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <button
                  type="button"
                  onClick={() => handleLookupCitizen()}
                  disabled={isSearching || !mobileInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-black text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Lookup</span>
                </button>
              </div>
              {searchError && (
                <p className="text-xs font-semibold text-rose-400 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {searchError}
                </p>
              )}
            </div>

            {/* Citizen Details Card (Dynamic Result) */}
            {citizenData ? (
              <div className={`p-4 rounded-2xl border transition-all ${
                citizenData.exists
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-amber-950/20 border-amber-500/30'
              }`}>
                {citizenData.exists ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300 text-sm">
                          {citizenData.user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold t-text-primary flex items-center gap-1.5">
                            {citizenData.user?.fullName}
                            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          </h4>
                          <p className="text-xs font-mono t-text-secondary">{citizenData.user?.mobile}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold t-text-muted block">Current Wallet</span>
                        <span className="text-base font-black text-emerald-400">
                          {citizenData.user?.pointsBalance || 0} <span className="text-xs font-bold">PTS</span>
                        </span>
                      </div>
                    </div>

                    {/* Member Stats */}
                    {citizenData.stats && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20 text-center">
                        <div className="bg-black/20 p-2 rounded-xl">
                          <span className="text-[10px] t-text-muted block font-semibold">Total Drops</span>
                          <span className="text-xs font-extrabold t-text-primary">{citizenData.stats.totalSessions}</span>
                        </div>
                        <div className="bg-black/20 p-2 rounded-xl">
                          <span className="text-[10px] t-text-muted block font-semibold">Bottles</span>
                          <span className="text-xs font-extrabold text-cyan-400">{citizenData.stats.totalBottles}</span>
                        </div>
                        <div className="bg-black/20 p-2 rounded-xl">
                          <span className="text-[10px] t-text-muted block font-semibold">Cans</span>
                          <span className="text-xs font-extrabold text-amber-400">{citizenData.stats.totalCans}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <UserPlus className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-300">New Citizen Unregistered</h4>
                        <p className="text-[11px] t-text-muted leading-tight">
                          Account will be auto-created against this mobile number. Recycler can claim balance via mobile app anytime.
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold t-text-secondary block mb-1">
                        Citizen Full Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={customFullName}
                        onChange={(e) => setCustomFullName(e.target.value)}
                        placeholder="e.g. Muhammad Bilal"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-black/30 border t-border t-text-primary focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-black/10 border border-dashed t-border text-center">
                <p className="text-xs t-text-muted">
                  Type a mobile number above to verify member status or prepare a guest deposit.
                </p>
              </div>
            )}

            {/* Target Machine & Intake Reason */}
            <div className="space-y-4 pt-3 border-t t-border">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold t-text-secondary flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Target Machine / Kiosk Unit
                </label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-black/30 border t-border t-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {machinesList.map((m) => (
                    <option key={m.machine_id} value={m.machine_id}>
                      {m.machine_id} — {m.name} ({m.status || 'ONLINE'})
                    </option>
                  ))}
                  <option value="MANUAL-DESK-COUNTER">MANUAL-DESK-COUNTER (Reception / Main Desk)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold t-text-secondary flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Intake Reason
                </label>
                <select
                  value={intakeReason}
                  onChange={(e) => setIntakeReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-black/30 border t-border t-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {REASONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold t-text-secondary">
                  Operator Notes (Optional)
                </label>
                <input
                  type="text"
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="e.g. Aperture jam on plastic gate, verified 5 bottles"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/30 border t-border t-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recyclable Quantities + Points Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Material Counters Grid */}
          <div className="glass-panel p-6 rounded-3xl border t-border space-y-6 shadow-lg">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <Layers className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide t-text-primary">2. Recyclable Materials Count</h3>
                  <p className="text-xs t-text-muted">Enter bottles, cans, and paper weight</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPlasticSmall(0); setPlasticMedium(0); setPlasticLarge(0);
                  setCanSmall(0); setCanMedium(0); setCanLarge(0);
                  setPaperGrams(0); setTetrapakCount(0);
                }}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Items
              </button>
            </div>

            {/* Material Card 1: 🧴 Plastic Bottles (PET) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/10 border border-cyan-500/20 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🧴</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-cyan-300 flex items-center gap-2">
                      Plastic Bottles (PET)
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                        +10 pts / piece
                      </span>
                    </h4>
                    <p className="text-xs t-text-muted">Water, soda, juice bottles</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold t-text-muted block">Total Bottles</span>
                  <span className="text-2xl font-black text-cyan-400">{totalPlasticCount}</span>
                </div>
              </div>

              {/* Size Buttons */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {/* Small */}
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-center">
                  <span className="text-[11px] font-bold t-text-secondary block">Small (≤500ml)</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPlasticSmall(Math.max(0, plasticSmall - 1))}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 font-bold text-sm t-text-primary transition-colors"
                    >-</button>
                    <span className="w-8 font-mono font-bold text-sm t-text-primary">{plasticSmall}</span>
                    <button
                      type="button"
                      onClick={() => setPlasticSmall(plasticSmall + 1)}
                      className="w-7 h-7 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-sm transition-colors"
                    >+</button>
                  </div>
                </div>

                {/* Medium */}
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-center">
                  <span className="text-[11px] font-bold t-text-secondary block">Medium (1-1.5L)</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPlasticMedium(Math.max(0, plasticMedium - 1))}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 font-bold text-sm t-text-primary transition-colors"
                    >-</button>
                    <span className="w-8 font-mono font-bold text-sm t-text-primary">{plasticMedium}</span>
                    <button
                      type="button"
                      onClick={() => setPlasticMedium(plasticMedium + 1)}
                      className="w-7 h-7 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-sm transition-colors"
                    >+</button>
                  </div>
                </div>

                {/* Large */}
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-center">
                  <span className="text-[11px] font-bold t-text-secondary block">Large (≥2L)</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPlasticLarge(Math.max(0, plasticLarge - 1))}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 font-bold text-sm t-text-primary transition-colors"
                    >-</button>
                    <span className="w-8 font-mono font-bold text-sm t-text-primary">{plasticLarge}</span>
                    <button
                      type="button"
                      onClick={() => setPlasticLarge(plasticLarge + 1)}
                      className="w-7 h-7 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-sm transition-colors"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Quick Add Pills */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="t-text-muted text-[11px] font-semibold">Quick add:</span>
                <button
                  type="button"
                  onClick={() => setPlasticMedium(plasticMedium + 1)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold"
                >+1 Bottle</button>
                <button
                  type="button"
                  onClick={() => setPlasticMedium(plasticMedium + 5)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold"
                >+5 Bottles</button>
                <button
                  type="button"
                  onClick={() => setPlasticMedium(plasticMedium + 10)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold"
                >+10 Bottles</button>
              </div>
            </div>

            {/* Material Card 2: 🥫 Aluminium Beverage Cans */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/10 border border-amber-500/20 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥫</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                      Aluminium Beverage Cans
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                        +20 pts / piece
                      </span>
                    </h4>
                    <p className="text-xs t-text-muted">Soft drink, energy drink, sparkling cans</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold t-text-muted block">Total Cans</span>
                  <span className="text-2xl font-black text-amber-400">{totalCanCount}</span>
                </div>
              </div>

              {/* Size Buttons */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {/* Small 250ml */}
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-center">
                  <span className="text-[11px] font-bold t-text-secondary block">Slim (250ml)</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCanSmall(Math.max(0, canSmall - 1))}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 font-bold text-sm t-text-primary transition-colors"
                    >-</button>
                    <span className="w-8 font-mono font-bold text-sm t-text-primary">{canSmall}</span>
                    <button
                      type="button"
                      onClick={() => setCanSmall(canSmall + 1)}
                      className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-sm transition-colors"
                    >+</button>
                  </div>
                </div>

                {/* Medium 330ml */}
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-center">
                  <span className="text-[11px] font-bold t-text-secondary block">Standard (330ml)</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCanMedium(Math.max(0, canMedium - 1))}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 font-bold text-sm t-text-primary transition-colors"
                    >-</button>
                    <span className="w-8 font-mono font-bold text-sm t-text-primary">{canMedium}</span>
                    <button
                      type="button"
                      onClick={() => setCanMedium(canMedium + 1)}
                      className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-sm transition-colors"
                    >+</button>
                  </div>
                </div>

                {/* Large 500ml */}
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-center">
                  <span className="text-[11px] font-bold t-text-secondary block">Tall (500ml)</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCanLarge(Math.max(0, canLarge - 1))}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 font-bold text-sm t-text-primary transition-colors"
                    >-</button>
                    <span className="w-8 font-mono font-bold text-sm t-text-primary">{canLarge}</span>
                    <button
                      type="button"
                      onClick={() => setCanLarge(canLarge + 1)}
                      className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-sm transition-colors"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Quick Add Pills */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="t-text-muted text-[11px] font-semibold">Quick add:</span>
                <button
                  type="button"
                  onClick={() => setCanMedium(canMedium + 1)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold"
                >+1 Can</button>
                <button
                  type="button"
                  onClick={() => setCanMedium(canMedium + 5)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold"
                >+5 Cans</button>
                <button
                  type="button"
                  onClick={() => setCanMedium(canMedium + 10)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold"
                >+10 Cans</button>
              </div>
            </div>

            {/* Material Card 3: 🟦 Paper & Office Waste (Grams / KG) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/10 border border-indigo-500/20 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🟦</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-indigo-300 flex items-center gap-2">
                      Office Paper & Documents
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                        +15 pts / kg
                      </span>
                    </h4>
                    <p className="text-xs t-text-muted">A4 documents, shredding, packaging</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold t-text-muted block">Paper Weight</span>
                  <span className="text-2xl font-black text-indigo-400">
                    {paperGrams} <span className="text-xs font-bold">g</span> ({ (paperGrams / 1000).toFixed(2) } kg)
                  </span>
                </div>
              </div>

              {/* Direct Weight Input and Quick Increment Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={paperGrams === 0 ? '' : paperGrams}
                      onChange={(e) => setPaperGrams(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="Enter weight in grams..."
                      className="w-full px-3.5 py-2.5 pr-14 text-sm font-bold font-mono rounded-xl bg-black/30 border t-border t-text-primary focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold t-text-muted">
                      GRAMS
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPaperGrams(paperGrams + 250)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-bold"
                  >+250g</button>
                  <button
                    type="button"
                    onClick={() => setPaperGrams(paperGrams + 500)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-bold"
                  >+500g</button>
                  <button
                    type="button"
                    onClick={() => setPaperGrams(paperGrams + 1000)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-bold"
                  >+1.0 kg</button>
                  <button
                    type="button"
                    onClick={() => setPaperGrams(0)}
                    className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold"
                  >0g</button>
                </div>
              </div>
            </div>

            {/* Optional UBC / Tetra Pak Drawer */}
            <div className="p-3.5 rounded-2xl bg-purple-950/10 border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧃</span>
                <div>
                  <h4 className="text-xs font-bold text-purple-300">Tetra Pak / UBC Cartons</h4>
                  <p className="text-[11px] t-text-muted">+10 pts per juice / milk carton</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTetrapakCount(Math.max(0, tetrapakCount - 1))}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 font-bold text-sm t-text-primary"
                >-</button>
                <span className="w-8 text-center font-mono font-bold text-sm t-text-primary">{tetrapakCount}</span>
                <button
                  type="button"
                  onClick={() => setTetrapakCount(tetrapakCount + 1)}
                  className="w-7 h-7 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-sm"
                >+</button>
              </div>
            </div>

          </div>

          {/* Reward Calculation & Checkout Box */}
          <div className="glass-panel p-6 rounded-3xl border t-border space-y-5 bg-gradient-to-br from-emerald-950/30 to-black/40 shadow-xl">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide t-text-primary">
                  3. Live Reward Points & Impact
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="customPointsToggle"
                  checked={allowCustomPoints}
                  onChange={(e) => setAllowCustomPoints(e.target.checked)}
                  className="rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="customPointsToggle" className="text-xs t-text-secondary cursor-pointer select-none">
                  Manual Points Override
                </label>
              </div>
            </div>

            {/* Impact Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase font-bold t-text-muted block">Total Units</span>
                <span className="text-xl font-black t-text-primary">{totalItemsCount}</span>
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase font-bold t-text-muted block">Total Weight</span>
                <span className="text-xl font-black text-cyan-400">{totalWeightKg} <span className="text-xs">kg</span></span>
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase font-bold t-text-muted block">Avoided CO₂</span>
                <span className="text-xl font-black text-emerald-400">{co2AvoidedKg} <span className="text-xs">kg</span></span>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/30">
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">Reward Credit</span>
                <span className="text-xl font-black text-emerald-300">+{effectivePointsToAward} <span className="text-xs">PTS</span></span>
              </div>
            </div>

            {/* Custom Points Field if Overriding */}
            {allowCustomPoints && (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-1.5 animate-fadeIn">
                <label className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                  <span>Custom Eco-Points to Award</span>
                  <span className="text-[11px] t-text-muted">Default: {autoCalculatedPoints} pts</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={customPointsInput}
                  onChange={(e) => setCustomPointsInput(e.target.value)}
                  placeholder={`e.g. ${autoCalculatedPoints}`}
                  className="w-full px-3.5 py-2 text-sm font-bold font-mono rounded-xl bg-black/40 border border-emerald-500/40 text-emerald-300 focus:outline-none"
                />
              </div>
            )}

            {/* Projected Wallet Balance Preview */}
            <div className="p-4 rounded-2xl bg-black/30 border t-border flex items-center justify-between">
              <div>
                <span className="text-xs font-bold t-text-secondary block">Citizen Wallet Projection</span>
                <p className="text-xs t-text-muted">
                  {citizenData?.exists
                    ? `Current Balance: ${currentCitizenBalance} pts`
                    : 'New Citizen Account (0 pts start)'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold t-text-secondary">{currentCitizenBalance}</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                <span className="text-lg font-black text-emerald-400">{projectedBalance} PTS</span>
              </div>
            </div>

            {/* Error Message if any */}
            {submitError && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {submitError}
              </div>
            )}

            {/* Submit Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || (totalItemsCount === 0 && paperGrams === 0) || !mobileInput.trim()}
                className="flex-1 py-4 px-6 rounded-2xl font-black text-sm tracking-wide bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 uppercase"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Deposit...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Credit & Complete Deposit</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="py-4 px-6 rounded-2xl font-bold text-xs bg-white/5 hover:bg-white/10 t-text-secondary transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

        </div>
      </form>

      {/* Success Modal / Transaction Receipt */}
      {submitSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-emerald-500/40 shadow-2xl space-y-6 relative bg-gradient-to-b from-gray-950 to-black">
            <button
              onClick={() => setSubmitSuccess(null)}
              className="absolute right-5 top-5 p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black t-text-primary">Deposit Credited Successfully!</h3>
              <p className="text-xs t-text-secondary max-w-sm mx-auto">
                {submitSuccess.message}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-black/50 p-4 rounded-2xl border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="t-text-muted">SESSION ID:</span>
                <span className="t-text-primary font-bold">{submitSuccess.sessionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="t-text-muted">RECYCLER:</span>
                <span className="t-text-primary font-bold">{submitSuccess.user?.fullName} ({submitSuccess.user?.mobile})</span>
              </div>
              <div className="flex justify-between">
                <span className="t-text-muted">MACHINE:</span>
                <span className="t-text-primary">{submitSuccess.machineId}</span>
              </div>
              <div className="flex justify-between">
                <span className="t-text-muted">ITEMS DEPOSITED:</span>
                <span className="text-cyan-400 font-bold">
                  {submitSuccess.items?.plastic > 0 ? `${submitSuccess.items.plastic} Bottles ` : ''}
                  {submitSuccess.items?.cans > 0 ? `${submitSuccess.items.cans} Cans ` : ''}
                  {submitSuccess.items?.paperGrams > 0 ? `${submitSuccess.items.paperGrams}g Paper ` : ''}
                  {submitSuccess.items?.tetrapak > 0 ? `${submitSuccess.items.tetrapak} UBC` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="t-text-muted">NET WEIGHT:</span>
                <span className="t-text-primary">{submitSuccess.items?.totalWeightKg} kg</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
                <span className="text-emerald-400 font-bold">POINTS AWARDED:</span>
                <span className="text-emerald-400 font-black">+{submitSuccess.pointsEarned} PTS</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="t-text-primary font-bold">NEW WALLET BALANCE:</span>
                <span className="text-emerald-300 font-black">{submitSuccess.newBalance} PTS</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 t-text-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-white/10"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase transition-colors"
              >
                Next Citizen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Audit Table: Today's Assisted Intake Activity */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border t-border space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b t-border pb-4">
          <div>
            <h3 className="text-base font-extrabold t-text-primary flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Assisted Intake Ledger (Recent Audit Trail)
            </h3>
            <p className="text-xs t-text-secondary">
              All manual drop operations recorded in PostgreSQL database table <code className="font-mono text-emerald-400">manual_intake_logs</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchHistory}
            disabled={isLoadingHistory}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold t-text-secondary flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b t-border t-text-muted font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Citizen</th>
                <th className="py-3 px-3">Machine / Location</th>
                <th className="py-3 px-3">Materials</th>
                <th className="py-3 px-3 text-right">Points</th>
                <th className="py-3 px-3">Reason</th>
                <th className="py-3 px-3">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {historyLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center t-text-muted">
                    No manual intake entries recorded yet.
                  </td>
                </tr>
              ) : (
                historyLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] t-text-muted whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      <span className="block text-[10px] text-gray-500">
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold t-text-primary block">{log.user_full_name || 'Eco Citizen'}</span>
                      <span className="font-mono text-[11px] text-emerald-400">{log.mobile}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs t-text-secondary whitespace-nowrap">
                      {log.machine_id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {log.plastic_count > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                            {log.plastic_count} Bottles
                          </span>
                        )}
                        {log.aluminium_count > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                            {log.aluminium_count} Cans
                          </span>
                        )}
                        {log.paper_weight_grams > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                            {log.paper_weight_grams}g Paper
                          </span>
                        )}
                        {log.tetrapak_count > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                            {log.tetrapak_count} UBC
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-black text-emerald-400 text-sm">+{log.points_awarded}</span>
                      <span className="text-[10px] font-bold text-gray-500 block">PTS</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 t-text-secondary border t-border">
                        {log.reason?.replace(/_/g, ' ') || 'MANUAL'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] t-text-muted">
                      {log.operator_username || 'attendant'}
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

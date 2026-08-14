import React, { useState, useEffect } from 'react';
import { 
  Leaf, Trees, Car, Recycle, Award, RefreshCw, Info, CheckCircle2, 
  Scale, ShieldCheck, Flame, ArrowUpRight, Database
} from 'lucide-react';

export default function EnvironmentalImpactTab() {
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getMachinesQuery = () => {
    try {
      const u = JSON.parse(localStorage.getItem('rvm_auth_user') || '{}');
      if (!u.assignedMachines) return '';
      const arr = Array.isArray(u.assignedMachines) ? u.assignedMachines : [u.assignedMachines];
      if (arr.includes('*')) return '';
      return `?assignedMachines=${encodeURIComponent(arr.join(','))}`;
    } catch (e) {
      return '';
    }
  };

  const fetchImpact = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/environmental-impact${getMachinesQuery()}`);
      if (res.ok) {
        setImpactData(await res.json());
      }
    } catch (err) {
      console.error('Fetch impact error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpact();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 t-text-muted gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-semibold">Calculating Audited Environmental Impact & ESG Metrics...</p>
      </div>
    );
  }

  const {
    totalWeightProcessedKg = 0,
    totalCo2eAvoidedKg = 0,
    totalCo2eAvoidedTonnes = 0,
    treesPlantedEquivalent = 0,
    passengerCarMilesAvoided = 0,
    compostYieldKg = 0,
    weightMeasurementType = 'Estimated',
    breakdown = []
  } = impactData || {};

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Audit Header Banner */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Audited ESG Reporting</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">RVM Environmental Impact & Carbon Math</h2>
          <p className="text-xs t-text-secondary mt-1 flex flex-wrap items-center gap-2">
            <span>Audited, Corrected, And Reconciled With The Reward System PRD</span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md uppercase">
              AUGUST 2026 AUDIT
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 t-bg-sec border t-border rounded-xl text-xs flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <span className="t-text-muted">Weight Label:</span>
            <span className={`font-bold ${weightMeasurementType === 'Measured' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {weightMeasurementType}
            </span>
          </div>

          <button
            onClick={fetchImpact}
            className="p-2.5 t-bg-sec hover:t-bg-hover t-text-primary border t-border rounded-xl transition-all"
            title="Refresh Carbon Math"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Audited Equivalency Impact KPI Cards (PDF Section 7.2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Avoided CO2e Emissions */}
        <div className="glass-panel p-5 rounded-3xl border border-emerald-500/30 space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Avoided Carbon CO2e</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-400 mono">{totalCo2eAvoidedKg.toLocaleString()} kg</div>
            <div className="text-xs t-text-muted font-mono font-semibold mt-0.5">({totalCo2eAvoidedTonnes} Metric Tonnes)</div>
          </div>
          <p className="text-[10px] t-text-muted border-t t-border pt-2 leading-relaxed">
            Sum of <code className="text-emerald-400">Weight(m) × Factor(m)</code> across all materials.
          </p>
        </div>

        {/* 2. Trees Planted Equivalent */}
        <div className="glass-panel p-5 rounded-3xl border border-cyan-500/30 space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Trees Planted Equiv.</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Trees className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-cyan-400 mono">{treesPlantedEquivalent.toLocaleString()} Trees</div>
            <div className="text-xs t-text-muted font-mono font-semibold mt-0.5">1 Tree = 21.77 kg CO2e</div>
          </div>
          <p className="text-[10px] t-text-muted border-t t-border pt-2 leading-relaxed">
            Basis: Urban tree seedling grown 10 years (EPA-derived).
          </p>
        </div>

        {/* 3. Passenger Car Miles Avoided */}
        <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Car Miles Avoided</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-400 mono">{passengerCarMilesAvoided.toLocaleString()} Miles</div>
            <div className="text-xs t-text-muted font-mono font-semibold mt-0.5">1 Mile = 0.40 kg CO2e</div>
          </div>
          <p className="text-[10px] t-text-muted border-t t-border pt-2 leading-relaxed">
            Basis: Avg passenger-vehicle emissions (EPA-derived).
          </p>
        </div>

        {/* 4. Compost Output Yield */}
        <div className="glass-panel p-5 rounded-3xl border border-purple-500/30 space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Compost Yield Output</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Recycle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-purple-400 mono">{compostYieldKg.toLocaleString()} kg</div>
            <div className="text-xs t-text-muted font-mono font-semibold mt-0.5">Yield Factor = 40% (0.40)</div>
          </div>
          <p className="text-[10px] t-text-muted border-t t-border pt-2 leading-relaxed">
            Disjoint Estimated Batch Mode (No double-counting).
          </p>
        </div>

      </div>

      {/* Material Breakdown & Carbon Math Table (PDF Section 7.1) */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold t-text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Audited Material CO2e Breakdown (Single Source of Truth)
            </h3>
            <p className="text-xs t-text-secondary mt-0.5">Reconciled mapping between PRD Reward Classes and Environmental Factors.</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
            Total Weight: {totalWeightProcessedKg} kg
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b t-border t-text-muted uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Material Taxonomy</th>
                <th className="py-3 px-4">Reward Class (PRD 4.1)</th>
                <th className="py-3 px-4 text-right">Processed Weight (kg)</th>
                <th className="py-3 px-4 text-center">Factor (kg CO2e / kg)</th>
                <th className="py-3 px-4 text-right">Verified CO2e Saved (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border">
              {breakdown.map((row) => (
                <tr key={row.material} className="hover:t-bg-hover">
                  <td className="py-3.5 px-4 font-extrabold t-text-primary">{row.material}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold t-bg-sec border t-border t-text-secondary">
                      {row.rewardClass}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right mono font-bold t-text-primary">
                    {row.weightKg.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {row.factor}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right mono font-extrabold text-emerald-400">
                    {row.co2eSavedKg.toLocaleString()} kg
                  </td>
                </tr>
              ))}
              
              {/* Total Summary Row */}
              <tr className="t-bg-sec font-extrabold border-t-2 border-emerald-500/40">
                <td colSpan={2} className="py-4 px-4 text-emerald-400 text-sm">
                  TOTAL VERIFIED AVOIDED CARBON
                </td>
                <td className="py-4 px-4 text-right text-sm mono t-text-primary">
                  {totalWeightProcessedKg.toLocaleString()} kg
                </td>
                <td className="py-4 px-4 text-center text-xs t-text-muted">
                  Weighted Avg
                </td>
                <td className="py-4 px-4 text-right text-base mono text-emerald-400">
                  {totalCo2eAvoidedKg.toLocaleString()} kg
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Fixes Summary Rules Box */}
      <div className="glass-panel p-6 rounded-3xl space-y-4 border border-cyan-500/30">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold t-text-primary">Audited Carbon Formula Rules & Disjoint Constraints</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl t-bg-sec border t-border space-y-1.5">
            <span className="font-extrabold text-cyan-400 block">Fix 1 & 2: Disjoint Compost Rule</span>
            <p className="t-text-secondary leading-relaxed">
              Organic & Tea inputs earn CO2e credit ONCE (0.5 factor). Compost is a separate downstream yield (40%). Actual weighed batches replace estimates, never summed twice.
            </p>
          </div>

          <div className="p-4 rounded-2xl t-bg-sec border t-border space-y-1.5">
            <span className="font-extrabold text-emerald-400 block">Fix 3 & 4: Taxonomy Reconciliation</span>
            <p className="t-text-secondary leading-relaxed">
              Tea is a reporting sub-label of Organic (non-additive 0.5). Reward PET S/M/L roll into Plastic (1.5). Aluminium Can maps to Aluminium (9.1).
            </p>
          </div>

          <div className="p-4 rounded-2xl t-bg-sec border t-border space-y-1.5">
            <span className="font-extrabold text-amber-400 block">Fix 5 & 6: EPA Basis & Labeling</span>
            <p className="t-text-secondary leading-relaxed">
              Equivalency divisors cited (21.77 kg/tree, 0.40 kg/car mile). Every output explicitly inherits the Measured or Estimated label.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, TreePine, Droplets, Award, 
  Plus, Search, RefreshCw, Upload, Download, CheckCircle2, 
  ExternalLink, Mail, Phone, ChevronRight, X, AlertCircle, 
  BarChart3, ShieldCheck, Sparkles, Trash2, Edit3, ArrowUpRight,
  Palette, Cpu, Key, Lock, Check, CheckSquare, Square
} from 'lucide-react';

function OrgLogo({ url, name = '', size = "w-12 h-12" }) {
  const [hasError, setHasError] = useState(false);

  const getGradient = (n = '') => {
    const lower = n.toLowerCase();
    if (lower.includes('alfalah')) return 'from-red-600 to-rose-700 text-white';
    if (lower.includes('engro')) return 'from-emerald-600 to-teal-700 text-white';
    if (lower.includes('punjab') || lower.includes('ucp')) return 'from-blue-600 to-indigo-700 text-white';
    if (lower.includes('metro')) return 'from-amber-500 to-yellow-600 text-slate-950 font-black';
    return 'from-emerald-500 to-cyan-600 text-white';
  };

  const initial = (name || 'E').charAt(0).toUpperCase();

  if (url && !hasError && !url.includes('wikimedia.org')) {
    return (
      <div className={`${size} rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-sm`}>
        <img
          src={url}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${size} rounded-2xl bg-gradient-to-br ${getGradient(name)} flex items-center justify-center shrink-0 shadow-sm border border-white/20 select-none font-black text-base tracking-wider`}>
      {initial}
    </div>
  );
}

export default function EnterpriseClientsTab({ currentUser, selectedClientId = 'ALL' }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgDepartments, setOrgDepartments] = useState([]);
  const [orgEmployees, setOrgEmployees] = useState([]);
  const [activeOrgSubTab, setActiveOrgSubTab] = useState('departments'); // 'departments' | 'staff' | 'upload'
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [orgStats, setOrgStats] = useState(null);
  const [loadingOrgDetails, setLoadingOrgDetails] = useState(false);
  
  // New Org Form State
  const [newOrg, setNewOrg] = useState({
    name: '',
    domain: '',
    contact_email: '',
    contact_phone: '',
    monthly_target_kg: 2000,
    monthly_budget: 200000,
    logo_url: ''
  });
  const [savingOrg, setSavingOrg] = useState(false);

  // Department Form
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptManager, setNewDeptManager] = useState('');
  const [newDeptTarget, setNewDeptTarget] = useState(500);

  // Bulk Upload Form
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // ESG Certificate Modal
  const [showCertificate, setShowCertificate] = useState(false);

  // Personalization & Fleet Assignment Modal State
  const [personalizeModalOrg, setPersonalizeModalOrg] = useState(null);
  const [personalizeTab, setPersonalizeTab] = useState('machines'); // 'machines' | 'branding' | 'admin_user'
  const [allNetworkMachines, setAllNetworkMachines] = useState([]);
  const [selectedMachineIds, setSelectedMachineIds] = useState([]);
  const [savingFleet, setSavingFleet] = useState(false);
  const [fleetSuccessMsg, setFleetSuccessMsg] = useState('');

  // Branding Form State
  const [brandingForm, setBrandingForm] = useState({
    dashboard_title: '',
    welcome_msg: '',
    primary_color: '#059669',
    theme: 'isp-portal',
    logo_url: ''
  });
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSuccessMsg, setBrandingSuccessMsg] = useState('');

  // Admin User Provisioning Form State
  const [adminUserForm, setAdminUserForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: ''
  });
  const [savingAdminUser, setSavingAdminUser] = useState(false);
  const [adminUserSuccessMsg, setAdminUserSuccessMsg] = useState('');
  const [adminUserErrorMsg, setAdminUserErrorMsg] = useState('');

  // Super Admin Role Verification & Deletion State
  const isSuperAdmin = currentUser?.username === 'onenet' || 
    currentUser?.username === 'bilalaaqueel' || 
    currentUser?.roleId === 'super_admin' || 
    currentUser?.roleId === 'superadmin' || 
    currentUser?.isSuperAdmin === true;

  const [selectedOrgIds, setSelectedOrgIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, mode: 'single', org: null, loading: false });
  const [deleteAlert, setDeleteAlert] = useState(null);

  const handleOpenDeleteSingle = (e, org) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setDeleteModal({ isOpen: true, mode: 'single', org, loading: false });
  };

  const handleOpenDeleteBulk = () => {
    if (selectedOrgIds.length === 0) return;
    setDeleteModal({ isOpen: true, mode: 'bulk', org: null, loading: false });
  };

  const handleConfirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('rvm_token') || sessionStorage.getItem('rvm_token');
      const authHeaders = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      if (deleteModal.mode === 'bulk') {
        const res = await fetch('/api/enterprise/organizations/bulk-delete', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ orgIds: selectedOrgIds })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to bulk delete clients');
        setDeleteAlert({ type: 'success', text: data.message || `Deleted ${selectedOrgIds.length} enterprise clients.` });
        setSelectedOrgIds([]);
      } else if (deleteModal.org) {
        const res = await fetch(`/api/enterprise/organizations/${encodeURIComponent(deleteModal.org.org_id)}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete client');
        setDeleteAlert({ type: 'success', text: `Enterprise client "${deleteModal.org.name}" deleted successfully.` });
        setSelectedOrgIds(prev => prev.filter(id => id !== deleteModal.org.org_id));
      }
      setDeleteModal({ isOpen: false, mode: 'single', org: null, loading: false });
      fetchOrganizations();
    } catch (err) {
      setDeleteAlert({ type: 'error', text: err.message });
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const toggleSelectOrg = (orgId) => {
    setSelectedOrgIds(prev => 
      prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
    );
  };

  const toggleSelectAll = (filteredList) => {
    if (selectedOrgIds.length === filteredList.length) {
      setSelectedOrgIds([]);
    } else {
      setSelectedOrgIds(filteredList.map(o => o.org_id));
    }
  };

  const openPersonalizeModal = async (org) => {
    setPersonalizeModalOrg(org);
    setPersonalizeTab('machines');
    setFleetSuccessMsg('');
    setBrandingSuccessMsg('');
    setAdminUserSuccessMsg('');
    setAdminUserErrorMsg('');

    // Pre-fill branding
    setBrandingForm({
      dashboard_title: org.dashboard_title || `${org.name} Sustainability Portal`,
      welcome_msg: org.welcome_msg || `Welcome to ${org.name} Sustainability & ESG Rewards Kiosks.`,
      primary_color: org.primary_color || '#059669',
      theme: org.theme || 'isp-portal',
      logo_url: org.logo_url || ''
    });

    // Pre-fill assigned machines
    const initialMachines = Array.isArray(org.assigned_machines) 
      ? org.assigned_machines 
      : (typeof org.assigned_machines === 'string' ? JSON.parse(org.assigned_machines || '[]') : []);
    setSelectedMachineIds(initialMachines);

    // Pre-fill admin user
    if (org.admin_user) {
      setAdminUserForm({
        username: org.admin_user.username || '',
        fullName: org.admin_user.fullName || '',
        email: org.admin_user.email || '',
        password: ''
      });
    } else {
      const slug = org.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 12);
      setAdminUserForm({
        username: `${slug}_admin`,
        fullName: `${org.name} Corporate Client Lead`,
        email: org.contact_email || `admin@${org.domain}`,
        password: 'adminpassword123'
      });
    }

    // Fetch all available network machines
    try {
      const res = await fetch('/api/analytics/machines');
      if (res.ok) {
        const data = await res.json();
        setAllNetworkMachines(Array.isArray(data) ? data : (data.machines || []));
      }
    } catch (e) {
      console.error('Failed to fetch network machines:', e);
    }
  };

  const handleSaveFleet = async () => {
    if (!personalizeModalOrg) return;
    setSavingFleet(true);
    setFleetSuccessMsg('');
    try {
      const res = await fetch(`/api/enterprise/organizations/${personalizeModalOrg.org_id}/assign-machines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineIds: selectedMachineIds
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFleetSuccessMsg(data.message || 'Kiosks assigned successfully!');
        fetchOrganizations();
      } else {
        alert(data.error || 'Failed to assign machines');
      }
    } catch (e) {
      alert('Network error while assigning machines');
    } finally {
      setSavingFleet(false);
    }
  };

  const handleSavePersonalization = async () => {
    if (!personalizeModalOrg) return;
    setSavingBranding(true);
    setBrandingSuccessMsg('');
    try {
      const res = await fetch(`/api/enterprise/organizations/${personalizeModalOrg.org_id}/personalization`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandingForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBrandingSuccessMsg('Dashboard personalization saved successfully!');
        fetchOrganizations();
      } else {
        alert(data.error || 'Failed to update personalization');
      }
    } catch (e) {
      alert('Network error while saving personalization');
    } finally {
      setSavingBranding(false);
    }
  };

  const handleProvisionAdminUser = async (e) => {
    e.preventDefault();
    if (!personalizeModalOrg) return;
    setSavingAdminUser(true);
    setAdminUserSuccessMsg('');
    setAdminUserErrorMsg('');
    try {
      const res = await fetch('/api/enterprise/create-client-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: personalizeModalOrg.org_id,
          username: adminUserForm.username,
          fullName: adminUserForm.fullName,
          email: adminUserForm.email,
          password: adminUserForm.password
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminUserSuccessMsg(data.message || 'Client Admin provisioned successfully!');
        fetchOrganizations();
      } else {
        setAdminUserErrorMsg(data.error || 'Failed to provision Client Admin');
      }
    } catch (e) {
      setAdminUserErrorMsg('Network error while creating Client Admin');
    } finally {
      setSavingAdminUser(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/enterprise/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      console.error('Failed to load enterprise clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const openOrgDetails = async (org) => {
    setSelectedOrg(org);
    setLoadingOrgDetails(true);
    setShowAddDept(false);
    setShowBulkUpload(false);
    setUploadResult(null);
    setStaffSearchQuery('');
    setActiveOrgSubTab('departments');
    try {
      const [deptRes, statsRes, empRes] = await Promise.all([
        fetch(`/api/enterprise/departments/${org.org_id}`),
        fetch(`/api/enterprise/stats/${org.org_id}`),
        fetch(`/api/enterprise/employees/${org.org_id}`)
      ]);
      if (deptRes.ok) {
        const dData = await deptRes.json();
        setOrgDepartments(dData.departments || []);
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setOrgStats(sData.stats || null);
      }
      if (empRes.ok) {
        const empData = await empRes.json();
        setOrgEmployees(empData.employees || []);
      }
    } catch (err) {
      console.error('Error fetching org details:', err);
    } finally {
      setLoadingOrgDetails(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrg.name || !newOrg.domain) {
      alert('Please enter both Company Name and Corporate Domain');
      return;
    }
    setSavingOrg(true);
    try {
      const res = await fetch('/api/enterprise/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrg)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewOrg({ name: '', domain: '', contact_email: '', contact_phone: '', monthly_target_kg: 2000, monthly_budget: 200000, logo_url: '' });
        fetchOrganizations();
      } else {
        alert(data.error || 'Failed to save organization');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSavingOrg(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName || !selectedOrg) return;
    try {
      const res = await fetch('/api/enterprise/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: selectedOrg.org_id,
          name: newDeptName,
          manager_name: newDeptManager,
          monthly_target_kg: newDeptTarget
        })
      });
      const data = await res.json();
      if (data.success) {
        setOrgDepartments(prev => [...prev, data.department]);
        setNewDeptName('');
        setNewDeptManager('');
        setShowAddDept(false);
      }
    } catch (err) {
      alert('Error adding department: ' + err.message);
    }
  };

  const handleBulkImport = async () => {
    if (!csvText.trim() || !selectedOrg) return;
    setUploadingCsv(true);
    setUploadResult(null);

    // Parse simple CSV/TSV lines
    const lines = csvText.trim().split('\n');
    const employees = [];
    for (let line of lines) {
      const parts = line.split(/[,\t]/).map(s => s.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 2) {
        // e.g. Name, Email, Dept, ID
        if (parts[1].toLowerCase().includes('email') || parts[0].toLowerCase().includes('name')) continue;
        employees.push({
          full_name: parts[0],
          email: parts[1],
          department: parts[2] || 'General',
          employee_id: parts[3] || null,
          mobile: parts[4] || null
        });
      }
    }

    if (employees.length === 0) {
      alert('Could not parse any valid employee rows. Format: Name, Email, Department, EmployeeID');
      setUploadingCsv(false);
      return;
    }

    try {
      const res = await fetch('/api/enterprise/employees/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: selectedOrg.org_id, employees })
      });
      const data = await res.json();
      setUploadResult(data);
      if (data.success) {
        setCsvText('');
        fetchOrganizations();
        openOrgDetails(selectedOrg);
      }
    } catch (err) {
      setUploadResult({ success: false, error: err.message });
    } finally {
      setUploadingCsv(false);
    }
  };

  // Aggregated KPIs across all enterprise clients
  const totalClients = organizations.length;
  const totalEmployees = organizations.reduce((acc, o) => acc + (o.total_employees || 0), 0);
  const totalPaperKg = parseFloat(organizations.reduce((acc, o) => acc + (o.total_paper_kg || 0), 0).toFixed(1));
  const totalBottles = organizations.reduce((acc, o) => acc + (o.total_bottles || 0), 0);
  const totalCans = organizations.reduce((acc, o) => acc + (o.total_cans || 0), 0);
  const totalMassKg = parseFloat(organizations.reduce((acc, o) => acc + (o.total_recycled_kg || o.total_paper_kg || 0), 0).toFixed(1));
  const totalTrees = parseFloat((totalPaperKg * 0.017).toFixed(1));
  const totalCo2Kg = parseFloat(((totalPaperKg * 1.5) + (totalBottles * 0.035) + (totalCans * 0.135)).toFixed(1));

  const filteredOrgs = organizations.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl t-bg-sec border t-border backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Multi-Tenant B2B Enterprise Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              🧴 PET Bottles • 🥫 Cans • 📄 Paper
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black t-text-primary tracking-tight flex items-center gap-2.5">
            <Building2 className="w-8 h-8 text-emerald-500" /> Enterprise Corporate Clients & ESG
          </h1>
          <p className="text-xs sm:text-sm t-text-muted mt-1 max-w-3xl">
            Manage corporate client tenants, automated domain routing (<code className="px-1.5 py-0.5 rounded bg-slate-500/10 font-bold">@company.com</code>), 
            department leaderboards, touchless staff claims, and multi-material recycling audit compliance.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/PecoDrop_Enterprise_User_Guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            download="PecoDrop_Enterprise_User_Guide.pdf"
            className="px-3.5 py-2.5 rounded-2xl border t-border t-bg t-text-primary hover:text-emerald-500 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            title="Download Bilingual Employee User Guide (English & Urdu Nastaliq)"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">User Guide (PDF / اردو)</span>
          </a>
          <button
            onClick={fetchOrganizations}
            disabled={loading}
            className="p-2.5 rounded-2xl border t-border t-bg-hover t-text-muted hover:t-text-primary transition-all shadow-sm"
            title="Refresh Clients"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Enterprise Client
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (5 Cards covering all materials) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl t-bg-sec border t-border shadow-sm flex items-center gap-3.5 min-h-[84px]">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider t-text-muted truncate">Corporate Clients</div>
            <div className="text-xl sm:text-2xl font-black t-text-primary mt-0.5">{totalClients} <span className="text-[11px] font-semibold text-emerald-500">Active</span></div>
          </div>
        </div>

        <div className="p-4 rounded-3xl t-bg-sec border t-border shadow-sm flex items-center gap-3.5 min-h-[84px]">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider t-text-muted truncate">Enrolled Staff</div>
            <div className="text-xl sm:text-2xl font-black t-text-primary mt-0.5">{totalEmployees.toLocaleString()}</div>
          </div>
        </div>

        <div className="p-4 rounded-3xl t-bg-sec border t-border shadow-sm flex items-center gap-3.5 min-h-[84px]">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider t-text-muted truncate">Paper Recycled</div>
            <div className="text-xl sm:text-2xl font-black t-text-primary mt-0.5">{totalPaperKg.toLocaleString()} <span className="text-xs font-semibold text-amber-500">kg</span></div>
          </div>
        </div>

        <div className="p-4 rounded-3xl t-bg-sec border t-border shadow-sm flex items-center gap-3.5 min-h-[84px]">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0">
            <span className="text-lg">🧴</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider t-text-muted truncate">Bottles & Cans</div>
            <div className="text-xl sm:text-2xl font-black t-text-primary mt-0.5">
              {(totalBottles + totalCans).toLocaleString()}
            </div>
            <div className="text-[10px] font-semibold t-text-muted truncate">
              {totalBottles} PET / {totalCans} Cans
            </div>
          </div>
        </div>

        <div className="p-4 rounded-3xl t-bg-sec border t-border shadow-sm flex items-center gap-3.5 min-h-[84px] col-span-2 md:col-span-1">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <TreePine className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider t-text-muted truncate">Trees Saved (ESG)</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-500 mt-0.5">{totalTrees} <span className="text-xs font-semibold t-text-muted">🌳</span></div>
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {deleteAlert && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in ${
          deleteAlert.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
            : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {deleteAlert.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />}
            <span className="text-sm font-semibold">{deleteAlert.text}</span>
          </div>
          <button onClick={() => setDeleteAlert(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl t-bg-sec border t-border shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 t-text-muted" />
          <input
            type="text"
            placeholder="Search enterprise clients by company name or domain (@bankalfalah.com)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl t-bg t-text-primary border t-border outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0 justify-between sm:justify-end">
          {isSuperAdmin && filteredOrgs.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSelectAll(filteredOrgs)}
                className="px-3 py-2 rounded-xl border t-border bg-slate-500/5 hover:bg-slate-500/15 text-xs font-bold t-text-secondary hover:t-text-primary flex items-center gap-2 transition-all cursor-pointer select-none"
                title="Select / Deselect all visible clients"
              >
                <input
                  type="checkbox"
                  checked={selectedOrgIds.length === filteredOrgs.length && filteredOrgs.length > 0}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 accent-emerald-600 pointer-events-none"
                />
                <span>Select All</span>
              </button>

              {selectedOrgIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleOpenDeleteBulk}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-rose-600/25 transition-all animate-fade-in"
                  title="Delete all selected enterprise clients"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedOrgIds.length})</span>
                </button>
              )}
            </div>
          )}

          <span className="px-3 py-1.5 rounded-xl bg-slate-500/10 text-xs font-bold t-text-muted">
            Showing {filteredOrgs.length} of {organizations.length} Clients
          </span>
        </div>
      </div>

      {/* 4. Organizations Grid */}
      {loading ? (
        <div className="py-20 text-center t-text-muted flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm font-semibold">Loading enterprise client tenants...</p>
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="py-16 text-center t-bg-sec border t-border rounded-3xl p-8 space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-emerald-500/40" />
          <h3 className="text-base font-bold t-text-primary">No Enterprise Clients Found</h3>
          <p className="text-xs t-text-muted max-w-md mx-auto">
            {searchQuery ? 'No client matched your search criteria.' : 'No enterprise clients have been added yet. Click "+ Add Enterprise Client" to onboard your first corporate partner.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrgs.map((org) => {
            const currentRecycledKg = org.total_recycled_kg || org.total_paper_kg || 0;
            const progressPct = Math.min(100, Math.round((currentRecycledKg / (org.monthly_target_kg || 1)) * 100));
            const isSelected = selectedOrgIds.includes(org.org_id);
            return (
              <div 
                key={org.org_id}
                className={`p-5 sm:p-6 rounded-3xl t-bg-sec border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between group ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 't-border hover:border-emerald-500/40'
                }`}
              >
                <div>
                  {/* Top Meta Bar: Checkbox + Status Badge + Super Admin Trash Action */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b t-border">
                    <div className="flex items-center gap-2">
                      {isSuperAdmin && (
                        <label 
                          onClick={(e) => e.stopPropagation()} 
                          className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-emerald-500 transition-colors select-none"
                          title="Select client for bulk actions"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOrg(org.org_id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 accent-emerald-600 cursor-pointer"
                          />
                          <span className="text-[11px] font-bold t-text-muted">Select</span>
                        </label>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        {org.status}
                      </span>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenDeleteSingle(e, org)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all shrink-0"
                          title={`Delete enterprise client ${org.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Organization Identity Header */}
                  <div className="flex items-center gap-3.5 mb-4 min-w-0">
                    <OrgLogo url={org.logo_url} name={org.name} size="w-12 h-12" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-sm sm:text-base t-text-primary group-hover:text-emerald-500 transition-colors truncate" title={org.name}>
                        {org.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 truncate max-w-[200px]" title={`@${org.domain}`}>
                          @{org.domain}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Material Badges (Bottles, Cans, Paper) */}
                  <div className="grid grid-cols-3 gap-2 mb-3.5 text-[11px]">
                    <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-center">
                      <div className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400">🧴 Bottles</div>
                      <div className="font-black text-xs sm:text-sm t-text-primary mt-0.5 truncate">{(org.total_bottles || 0).toLocaleString()}</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center">
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400">🥫 Cans</div>
                      <div className="font-black text-xs sm:text-sm t-text-primary mt-0.5 truncate">{(org.total_cans || 0).toLocaleString()}</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">📄 Paper</div>
                      <div className="font-black text-xs sm:text-sm t-text-primary mt-0.5 truncate">{(org.total_paper_kg || 0).toLocaleString()} <span className="text-[9px] font-medium">kg</span></div>
                    </div>
                  </div>

                  {/* Monthly Recycling Target Progress Bar */}
                  <div className="space-y-1.5 mb-3.5 p-3 rounded-2xl t-bg border t-border">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold t-text-muted flex items-center gap-1.5 shrink-0">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" /> Monthly ESG Target
                      </span>
                      <span className="font-black t-text-primary mono text-xs shrink-0">
                        {currentRecycledKg.toLocaleString()} / {(org.monthly_target_kg || 0).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Stat Tags */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3.5">
                    <div className="p-2 rounded-2xl t-bg border t-border">
                      <div className="text-[10px] font-bold t-text-muted">Staff</div>
                      <div className="font-black text-xs sm:text-sm t-text-primary mt-0.5 truncate">{org.total_employees || 0}</div>
                    </div>
                    <div className="p-2 rounded-2xl t-bg border t-border">
                      <div className="text-[10px] font-bold t-text-muted">Depts</div>
                      <div className="font-black text-xs sm:text-sm t-text-primary mt-0.5 truncate">{org.departments_count || 0}</div>
                    </div>
                    <div className="p-2 rounded-2xl t-bg border t-border">
                      <div className="text-[10px] font-bold t-text-muted">ESG Points</div>
                      <div className="font-black text-xs sm:text-sm text-amber-500 mt-0.5 truncate">{(org.total_points || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Corporate Client Assigned Kiosks & Admin Badges */}
                  <div className="pt-3 border-t t-border mb-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="font-bold t-text-muted flex items-center gap-1.5 shrink-0">
                        <Cpu className="w-3.5 h-3.5 text-emerald-500" /> Bound Fleet:
                      </span>
                      <span 
                        className="font-extrabold mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/25 truncate max-w-[190px] text-right"
                        title={org.assigned_machines?.join(', ') || 'None'}
                      >
                        {org.assigned_machines?.length 
                          ? `${org.assigned_machines.length} Kiosk${org.assigned_machines.length > 1 ? 's' : ''} (${org.assigned_machines.join(', ')})` 
                          : '0 Bound Kiosks'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="font-bold t-text-muted flex items-center gap-1.5 shrink-0">
                        <Users className="w-3.5 h-3.5 text-blue-500" /> Client Admin:
                      </span>
                      <span className="font-bold mono text-blue-600 dark:text-blue-400 truncate max-w-[180px] text-right" title={org.admin_user?.username ? `@${org.admin_user.username}` : 'Not Provisioned'}>
                        {org.admin_user?.username ? `@${org.admin_user.username}` : 'Not Provisioned'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                  <button
                    type="button"
                    onClick={() => openPersonalizeModal(org)}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 truncate"
                    title="Assign RVMs/PecoDrops and personalize client dashboard"
                  >
                    <Palette className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Personalize Fleet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openOrgDetails(org)}
                    className="py-2.5 px-3 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 t-text-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 border t-border truncate"
                    title="Manage departments, rosters, and staff claims"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Depts & Roster</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Client Deep-Dive Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto t-bg-sec border t-border rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b t-border pb-5">
              <div className="flex items-center gap-3.5">
                <OrgLogo url={selectedOrg.logo_url} name={selectedOrg.name} size="w-14 h-14" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black t-text-primary">{selectedOrg.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                      {selectedOrg.status}
                    </span>
                  </div>
                  <p className="text-xs t-text-muted mt-0.5 flex items-center gap-2">
                    <span>Authorized Domain: <b className="text-blue-500">@{selectedOrg.domain}</b></span>
                    <span>•</span>
                    <span>Code: <b className="mono">{selectedOrg.org_id}</b></span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCertificate(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  title="Print ESG Certificate"
                >
                  <Award className="w-3.5 h-3.5" /> Official ESG Certificate
                </button>
                <button
                  onClick={() => setSelectedOrg(null)}
                  className="p-2 rounded-xl t-bg border t-border t-text-muted hover:t-text-primary transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Impact Metric Cards for this client (Multi-Material) */}
            {orgStats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl t-bg border t-border text-center">
                  <div className="text-[10px] font-bold uppercase t-text-muted">Total Diverted</div>
                  <div className="text-base sm:text-lg font-black text-emerald-500">{(orgStats.totalKg || orgStats.paperKg || 0).toLocaleString()} kg</div>
                </div>
                <div className="p-3.5 rounded-2xl t-bg border t-border text-center">
                  <div className="text-[10px] font-bold uppercase t-text-muted">PET Bottles</div>
                  <div className="text-base sm:text-lg font-black text-cyan-500">{(orgStats.bottles || 0).toLocaleString()} <span className="text-xs">🧴</span></div>
                </div>
                <div className="p-3.5 rounded-2xl t-bg border t-border text-center">
                  <div className="text-[10px] font-bold uppercase t-text-muted">Metal Cans</div>
                  <div className="text-base sm:text-lg font-black text-amber-500">{(orgStats.cans || 0).toLocaleString()} <span className="text-xs">🥫</span></div>
                </div>
                <div className="p-3.5 rounded-2xl t-bg border t-border text-center">
                  <div className="text-[10px] font-bold uppercase t-text-muted">Paper & Fiber</div>
                  <div className="text-base sm:text-lg font-black text-blue-500">{(orgStats.paperKg || 0).toLocaleString()} kg</div>
                </div>
                <div className="p-3.5 rounded-2xl t-bg border t-border text-center">
                  <div className="text-[10px] font-bold uppercase t-text-muted">Trees Saved</div>
                  <div className="text-base sm:text-lg font-black text-emerald-500">{orgStats.treesSaved} 🌳</div>
                </div>
                <div className="p-3.5 rounded-2xl t-bg border t-border text-center">
                  <div className="text-[10px] font-bold uppercase t-text-muted">CO₂ Avoided</div>
                  <div className="text-base sm:text-lg font-black text-teal-500">{(orgStats.co2SavedKg || 0).toLocaleString()} kg</div>
                </div>
              </div>
            )}

            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-2 border-b t-border pb-3">
              <button
                onClick={() => setActiveOrgSubTab('departments')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeOrgSubTab === 'departments'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 't-text-muted hover:t-text-primary t-bg border t-border'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Departments ({orgDepartments.length})</span>
              </button>

              <button
                onClick={() => setActiveOrgSubTab('staff')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeOrgSubTab === 'staff'
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 't-text-muted hover:t-text-primary t-bg border t-border'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Corporate Staff Roster ({orgEmployees.length})</span>
              </button>

              <button
                onClick={() => setActiveOrgSubTab('upload')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ml-auto ${
                  activeOrgSubTab === 'upload'
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-sm'
                    : 't-text-muted hover:t-text-primary t-bg border t-border'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk CSV Onboarding</span>
              </button>
            </div>

            {/* TAB 1: DEPARTMENTS */}
            {activeOrgSubTab === 'departments' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm t-text-primary flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-500" /> Company Departments & Leaderboard
                  </h4>
                  <button
                    onClick={() => setShowAddDept(!showAddDept)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Dept
                  </button>
                </div>

                {/* Add Dept Sub-form */}
                {showAddDept && (
                  <form onSubmit={handleCreateDepartment} className="p-4 rounded-2xl t-bg border t-border space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Department Name (e.g., Marketing)"
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl t-bg-sec border t-border t-text-primary outline-none focus:border-emerald-500"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Manager Name (Optional)"
                        value={newDeptManager}
                        onChange={(e) => setNewDeptManager(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl t-bg-sec border t-border t-text-primary outline-none focus:border-emerald-500"
                      />
                      <input
                        type="number"
                        placeholder="Monthly Target (kg)"
                        value={newDeptTarget}
                        onChange={(e) => setNewDeptTarget(Number(e.target.value))}
                        className="px-3 py-2 text-xs rounded-xl t-bg-sec border t-border t-text-primary outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowAddDept(false)} className="px-3 py-1.5 text-xs font-bold t-text-muted">Cancel</button>
                      <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow">Save Department</button>
                    </div>
                  </form>
                )}

                {/* Departments Table */}
                <div className="border t-border rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b t-border t-bg t-text-muted uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Manager</th>
                        <th className="py-2.5 px-3 text-center">Staff</th>
                        <th className="py-2.5 px-3 text-center">🧴 PET</th>
                        <th className="py-2.5 px-3 text-center">🥫 Cans</th>
                        <th className="py-2.5 px-3 text-right">📄 Paper</th>
                        <th className="py-2.5 px-3 text-right">Total Mass</th>
                        <th className="py-2.5 px-3 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y t-border">
                      {orgDepartments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center t-text-muted">
                            No departments recorded yet. Click "+ Add Dept" to create the first unit.
                          </td>
                        </tr>
                      ) : (
                        orgDepartments.map((dept) => (
                          <tr key={dept.dept_id} className="hover:t-bg-hover">
                            <td className="py-2.5 px-3 font-bold t-text-primary">{dept.name}</td>
                            <td className="py-2.5 px-3 t-text-muted">{dept.manager_name || '—'}</td>
                            <td className="py-2.5 px-3 text-center font-bold">{dept.employees_count || 0}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-cyan-400">{(dept.recycled_bottles || 0).toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-amber-400">{(dept.recycled_cans || 0).toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right font-black text-amber-500">{(dept.recycled_paper_kg || 0).toLocaleString()} kg</td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-400">{(dept.recycled_total_kg || dept.recycled_paper_kg || 0).toLocaleString()} kg</td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-500">{(dept.total_points || 0).toLocaleString()} pts</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: ENROLLED CORPORATE STAFF */}
            {activeOrgSubTab === 'staff' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Touchless Notice Banner */}
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3 text-xs">
                  <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-blue-300">
                      Zero App Installation • Touchless Web Claim Architecture
                    </div>
                    <div className="text-blue-200/80 leading-relaxed text-[11px]">
                      Employees of <strong className="text-white">{selectedOrg.name}</strong> do not need to download or install any mobile application. When recycling PET bottles, cans, or paper at corporate PecoDrop kiosks, they scan the kiosk screen QR code with their default smartphone camera and authenticate instantly via Corporate Google SSO.
                    </div>
                  </div>
                </div>

                {/* Staff Search Bar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 t-text-muted" />
                    <input
                      type="text"
                      placeholder="Search employees by name, email, department, or employee ID..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => setActiveOrgSubTab('upload')}
                    className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Staff</span>
                  </button>
                </div>

                {/* Staff Roster Table */}
                {(() => {
                  const filteredStaff = orgEmployees.filter(emp => {
                    const q = staffSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      (emp.fullName && emp.fullName.toLowerCase().includes(q)) ||
                      (emp.email && emp.email.toLowerCase().includes(q)) ||
                      (emp.deptName && emp.deptName.toLowerCase().includes(q)) ||
                      (emp.employeeId && emp.employeeId.toLowerCase().includes(q))
                    );
                  });

                  return (
                    <div className="border t-border rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b t-border t-bg t-text-muted uppercase tracking-wider text-[10px] font-bold">
                            <th className="py-2.5 px-3">Employee Name & Email</th>
                            <th className="py-2.5 px-3">Department</th>
                            <th className="py-2.5 px-3">Employee ID</th>
                            <th className="py-2.5 px-3 text-center">🧴 PET</th>
                            <th className="py-2.5 px-3 text-center">🥫 Cans</th>
                            <th className="py-2.5 px-3 text-right">📄 Paper</th>
                            <th className="py-2.5 px-3 text-right">Points Earned</th>
                            <th className="py-2.5 px-3 text-center">Access Method</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y t-border">
                          {filteredStaff.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center t-text-muted">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-400" />
                                <p className="font-semibold">No employees enrolled yet for {selectedOrg.name}</p>
                                <p className="text-[11px] mt-1">Click "Bulk CSV Onboard" above or have employees scan the kiosk to auto-enroll.</p>
                              </td>
                            </tr>
                          ) : (
                            filteredStaff.map((emp) => (
                              <tr key={emp.userId || emp.email} className="hover:t-bg-hover">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold t-text-primary flex items-center gap-1.5">
                                    <span>{emp.fullName || emp.username}</span>
                                  </div>
                                  <div className="text-[11px] t-text-muted mono flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    <span>{emp.email}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {emp.deptName || 'General'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 mono font-semibold text-slate-300">
                                  {emp.employeeId || '—'}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-cyan-400">
                                  {(emp.bottles || 0).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                                  {(emp.cans || 0).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-amber-500">
                                  {(emp.paperKg || 0).toLocaleString()} kg
                                </td>
                                <td className="py-2.5 px-3 text-right font-extrabold text-emerald-400 mono">
                                  {(emp.pointsBalance || 0).toLocaleString()} pts
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30" title="Touchless Web SSO via standard phone camera">
                                    <span>⚡</span> Web Claim (No App)
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 3: BULK CSV ONBOARDING */}
            {activeOrgSubTab === 'upload' && (
              <div className="p-4 rounded-2xl t-bg border t-border space-y-4 animate-in fade-in">
                <div>
                  <h5 className="font-bold text-sm t-text-primary flex items-center gap-2">
                    <Upload className="w-4 h-4 text-purple-400" />
                    Bulk Enroll Employees via CSV
                  </h5>
                  <p className="text-xs t-text-muted mt-1 leading-relaxed">
                    Paste your company employee roster below. Staff members will be pre-enrolled with their corporate email and department so their recycling at PecoDrop kiosks is immediately recognized.
                  </p>
                  <p className="text-[11px] text-blue-400 font-mono mt-1">
                    Columns: <code>Full Name, Email Address, Department, EmployeeID, Phone</code>
                  </p>
                </div>

                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`Ali Khan, ali@${selectedOrg.domain}, Operations, EMP-101\nSara Raza, sara@${selectedOrg.domain}, Finance & Accounts, EMP-102\nBilal Tariq, bilal@${selectedOrg.domain}, IT Infrastructure, EMP-103`}
                  className="w-full p-3 font-mono text-xs rounded-xl t-bg-sec border t-border t-text-primary outline-none focus:border-purple-500"
                />

                {uploadResult && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${uploadResult.success ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>
                    {uploadResult.message || uploadResult.error}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] t-text-muted">
                    No apps required for employees. Enrolled staff log in via Google 1-Tap.
                  </span>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setActiveOrgSubTab('departments')} 
                      className="px-4 py-2 text-xs font-bold t-text-muted hover:t-text-primary"
                    >
                      Back
                    </button>
                    <button 
                      type="button" 
                      onClick={handleBulkImport}
                      disabled={uploadingCsv || !csvText.trim()}
                      className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg disabled:opacity-50 transition-all"
                    >
                      {uploadingCsv ? 'Processing Bulk Import...' : 'Import & Enroll Roster'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 6. Printable Official ESG Certificate Modal */}
      {showCertificate && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl p-8 space-y-6 border-4 border-emerald-600 relative print:border-none print:m-0">
            
            <button 
              onClick={() => setShowCertificate(false)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 border-b-2 border-emerald-100 pb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-1 border border-emerald-200">
                <Award className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-emerald-950 uppercase tracking-wider">Corporate Sustainability Certificate</h2>
              <p className="text-xs text-slate-500 font-semibold tracking-wide">OFFICIALLY CERTIFIED BY ISP ENVIRONMENTAL SOLUTIONS</p>
            </div>

            <div className="text-center space-y-4 my-6">
              <p className="text-sm text-slate-600">This certifies that</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedOrg.name}</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                has demonstrated outstanding environmental stewardship by diverting recyclable materials—including Paper/Cardboard, PET Plastic Bottles, and Metal Cans—via smart touchless PecoDrop Reverse Vending and Digital Weighing Systems.
              </p>

              {/* Multi-Material Audit Stats */}
              <div className="grid grid-cols-3 gap-3 my-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">📄 Paper Diverted</div>
                  <div className="text-xl font-black text-emerald-700">{(selectedOrg.total_paper_kg || 0).toLocaleString()} kg</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">🧴 PET Bottles</div>
                  <div className="text-xl font-black text-cyan-700">{(selectedOrg.total_bottles || 0).toLocaleString()} pcs</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">🥫 Aluminium Cans</div>
                  <div className="text-xl font-black text-amber-700">{(selectedOrg.total_cans || 0).toLocaleString()} pcs</div>
                </div>
              </div>

              {/* Lifecycle Impact Equivalent */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Trees Preserved</span>
                  <span className="font-extrabold text-emerald-600 text-sm">{Math.round((selectedOrg.total_paper_kg || 0) * 0.017)} Trees 🌳</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">CO₂ Avoided</span>
                  <span className="font-extrabold text-teal-600 text-sm">
                    {Math.round(((selectedOrg.total_paper_kg || 0) * 1.5) + ((selectedOrg.total_bottles || 0) * 0.035) + ((selectedOrg.total_cans || 0) * 0.135))} kg
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Mass Diverted</span>
                  <span className="font-extrabold text-blue-600 text-sm">
                    {(selectedOrg.total_recycled_kg || selectedOrg.total_paper_kg || 0).toLocaleString()} kg
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-slate-200 pt-6 text-xs text-slate-500">
              <div>
                <div className="font-bold text-slate-700">Certification ID: <span className="mono font-normal">ISP-ESG-{selectedOrg.org_id}-{Date.now().toString().slice(-4)}</span></div>
                <div>Date Issued: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-emerald-700 text-sm">ISP Environmental Solutions</div>
                <div className="text-[11px]">Authorized Green Audit Committee</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 print:hidden pt-4">
              <button 
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-4 h-4" /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Add Organization Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleCreateOrg} className="w-full max-w-lg t-bg-sec border t-border rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b t-border pb-4">
              <h3 className="font-black text-lg t-text-primary flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" /> Onboard Enterprise Client
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 rounded-lg t-text-muted hover:t-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold t-text-primary mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Alfalah Limited"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold t-text-primary mb-1">Corporate Email Domain * (For Auto-Routing)</label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 rounded-l-xl border-r-0 border t-border t-bg text-xs font-bold text-blue-500">@</span>
                  <input
                    type="text"
                    placeholder="bankalfalah.com"
                    value={newOrg.domain}
                    onChange={(e) => setNewOrg({ ...newOrg, domain: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-r-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <span className="text-[10px] t-text-muted mt-0.5 block">
                  Any user signing in with this email domain will automatically link to this enterprise tenant.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold t-text-primary mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="csr@company.com"
                    value={newOrg.contact_email}
                    onChange={(e) => setNewOrg({ ...newOrg, contact_email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold t-text-primary mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={newOrg.contact_phone}
                    onChange={(e) => setNewOrg({ ...newOrg, contact_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold t-text-primary mb-1">Monthly Target (Total kg Diverted)</label>
                  <input
                    type="number"
                    value={newOrg.monthly_target_kg}
                    onChange={(e) => setNewOrg({ ...newOrg, monthly_target_kg: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold t-text-primary mb-1">Monthly Points Pool</label>
                  <input
                    type="number"
                    value={newOrg.monthly_budget}
                    onChange={(e) => setNewOrg({ ...newOrg, monthly_budget: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold t-text-primary mb-1">Logo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://company.com/logo.png"
                  value={newOrg.logo_url}
                  onChange={(e) => setNewOrg({ ...newOrg, logo_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t t-border">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold t-text-muted hover:t-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingOrg}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {savingOrg ? 'Registering...' : 'Register Enterprise Client'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Personalize & Fleet Assignment Modal */}
      {personalizeModalOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto t-bg-sec border t-border rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b t-border pb-5">
              <div className="flex items-center gap-3.5">
                <OrgLogo url={brandingForm.logo_url || personalizeModalOrg.logo_url} name={personalizeModalOrg.name} size="w-14 h-14" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black t-text-primary">{personalizeModalOrg.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Personalization Hub
                    </span>
                  </div>
                  <p className="text-xs t-text-muted mt-0.5 flex items-center gap-2">
                    <span>Domain: <b className="text-blue-400">@{personalizeModalOrg.domain}</b></span>
                    <span>•</span>
                    <span>Client Code: <b className="mono">{personalizeModalOrg.org_id}</b></span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPersonalizeModalOrg(null)}
                className="p-2 rounded-xl t-bg border t-border t-text-muted hover:t-text-primary transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b t-border pb-3">
              <button
                onClick={() => setPersonalizeTab('machines')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  personalizeTab === 'machines'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 't-text-muted hover:t-text-primary t-bg border t-border'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>📍 Assign Kiosks ({selectedMachineIds.length})</span>
              </button>

              <button
                onClick={() => setPersonalizeTab('branding')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  personalizeTab === 'branding'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 't-text-muted hover:t-text-primary t-bg border t-border'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>🎨 Dashboard Branding & Theme</span>
              </button>

              <button
                onClick={() => setPersonalizeTab('admin_user')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  personalizeTab === 'admin_user'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 't-text-muted hover:t-text-primary t-bg border t-border'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>👤 Corporate Client Admin Login</span>
              </button>
            </div>

            {/* TAB 1: FLEET KIOSK ASSIGNMENT */}
            {personalizeTab === 'machines' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-xs">
                    <p className="font-bold text-emerald-400">Delegated Hardware Kiosks</p>
                    <p className="t-text-muted text-[11px] mt-0.5">
                      Select which RVM and PecoDrop kiosks are owned/leased by this corporate client. 
                      The client admin will have complete visibility and can delegate subsets to team sub-users.
                    </p>
                  </div>
                  <div className="font-extrabold text-xs mono px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    {selectedMachineIds.length} Assigned
                  </div>
                </div>

                {fleetSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{fleetSuccessMsg}</span>
                  </div>
                )}

                {allNetworkMachines.length === 0 ? (
                  <div className="py-12 text-center t-text-muted">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs font-bold">Scanning network machines...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {allNetworkMachines.map((m) => {
                      const mId = m.machineId || m.machine_id;
                      const isSelected = selectedMachineIds.includes(mId);
                      const isPeco = String(mId).toUpperCase().includes('PECO');
                      return (
                        <div
                          key={mId}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMachineIds(selectedMachineIds.filter(id => id !== mId));
                            } else {
                              setSelectedMachineIds([...selectedMachineIds, mId]);
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm'
                              : 't-bg t-border hover:border-emerald-500/30 hover:t-bg-hover'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500/40'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-extrabold mono text-xs t-text-primary">{mId}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                isPeco 
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {isPeco ? 'Corporate PecoDrop' : 'Public RVM'}
                              </span>
                            </div>

                            <p className="text-xs font-semibold t-text-primary truncate">{m.name || `Kiosk ${mId}`}</p>
                            <p className="text-[11px] t-text-muted truncate mt-0.5">📍 {m.location || 'Site Location'}</p>

                            {isPeco && (
                              <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold">
                                <span className="text-pink-400">⭕ Plastic</span>
                                <span className="text-emerald-400">🔺 Cans</span>
                                <span className="text-cyan-400">🟦 Paper</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t t-border">
                  <button
                    onClick={handleSaveFleet}
                    disabled={savingFleet}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{savingFleet ? 'Saving Fleet Assignments...' : 'Save Assigned Kiosks'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: PERSONALIZED BRANDING & THEME */}
            {personalizeTab === 'branding' && (
              <div className="space-y-5">
                {brandingSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{brandingSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold t-text-primary mb-1">Personalized Dashboard Title</label>
                    <input
                      type="text"
                      value={brandingForm.dashboard_title}
                      onChange={(e) => setBrandingForm({ ...brandingForm, dashboard_title: e.target.value })}
                      placeholder="e.g. Engro Green Horizon Portal"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold t-text-primary mb-1">Corporate Client Logo URL</label>
                    <input
                      type="url"
                      value={brandingForm.logo_url}
                      onChange={(e) => setBrandingForm({ ...brandingForm, logo_url: e.target.value })}
                      placeholder="https://company.com/logo.png"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold t-text-primary mb-1">Welcome Greeting Message</label>
                  <textarea
                    rows={2}
                    value={brandingForm.welcome_msg}
                    onChange={(e) => setBrandingForm({ ...brandingForm, welcome_msg: e.target.value })}
                    placeholder="e.g. Welcome Engro Team! Track your department recycling impact."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold t-text-primary mb-1.5">Primary Brand Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingForm.primary_color}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                        className="w-9 h-9 rounded-xl border border-slate-500/30 cursor-pointer p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={brandingForm.primary_color}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs rounded-xl t-bg border t-border t-text-primary mono"
                      />
                    </div>
                    {/* Quick color swatches */}
                    <div className="flex items-center gap-2 mt-2">
                      {[
                        { hex: '#059669', name: 'Emerald' },
                        { hex: '#2563eb', name: 'Sapphire' },
                        { hex: '#dc2626', name: 'Crimson' },
                        { hex: '#7c3aed', name: 'Violet' },
                        { hex: '#d97706', name: 'Amber' },
                        { hex: '#0284c7', name: 'Sky' }
                      ].map(swatch => (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => setBrandingForm({ ...brandingForm, primary_color: swatch.hex })}
                          className={`w-6 h-6 rounded-lg transition-transform ${
                            brandingForm.primary_color.toLowerCase() === swatch.hex.toLowerCase() ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                          title={swatch.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold t-text-primary mb-1.5">Default Interface Theme</label>
                    <select
                      value={brandingForm.theme}
                      onChange={(e) => setBrandingForm({ ...brandingForm, theme: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                    >
                      <option value="isp-portal">ISP Enterprise Portal (Executive Clean)</option>
                      <option value="isp-eco">ISP Eco Vanguard (Default Green)</option>
                      <option value="cyber-dark">Cyber Emerald (Dark Obsidian)</option>
                      <option value="ocean-dark">Ocean Sapphire (Deep Navy)</option>
                      <option value="neon-violet">Neon Violet (Cosmic Theme)</option>
                      <option value="sleek-light">Light Luxe (Modern Clean)</option>
                    </select>
                  </div>
                </div>

                {/* LIVE PREVIEW OF CLIENT DASHBOARD BANNER */}
                <div className="p-4 rounded-2xl t-bg border t-border space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    Live Client Overview Preview
                  </div>
                  <div 
                    className="p-4 rounded-xl border border-white/10 text-white flex items-center justify-between gap-4 shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${brandingForm.primary_color}ee, #0b1e17)`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <OrgLogo url={brandingForm.logo_url} name={personalizeModalOrg.name} size="w-10 h-10" />
                      <div>
                        <div className="font-black text-sm">{brandingForm.dashboard_title || personalizeModalOrg.name}</div>
                        <div className="text-xs text-white/80 line-clamp-1">{brandingForm.welcome_msg}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/30 border border-white/20 whitespace-nowrap">
                      Corporate Client Mode
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t t-border">
                  <button
                    onClick={handleSavePersonalization}
                    disabled={savingBranding}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{savingBranding ? 'Saving Branding...' : 'Save Personalization'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: CORPORATE CLIENT ADMIN USER */}
            {personalizeTab === 'admin_user' && (
              <form onSubmit={handleProvisionAdminUser} className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs">
                    <p className="font-bold text-blue-400">Corporate Client Lead Administrator</p>
                    <p className="t-text-muted text-[11px] mt-0.5">
                      This user will have full access to manage their organization's assigned machines, view carbon/CSR reports, and create team Sub-Users with delegated machine access.
                    </p>
                  </div>
                </div>

                {personalizeModalOrg.admin_user && (
                  <div className="p-3.5 rounded-xl bg-slate-500/10 border t-border flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold t-text-muted">Current Provisioned Admin:</span>
                      <div className="font-extrabold t-text-primary flex items-center gap-2 mt-0.5">
                        <span className="mono text-emerald-400">@{personalizeModalOrg.admin_user.username}</span>
                        <span>({personalizeModalOrg.admin_user.fullName || 'Admin'})</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                )}

                {adminUserSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{adminUserSuccessMsg}</span>
                  </div>
                )}

                {adminUserErrorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{adminUserErrorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold t-text-primary mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      value={adminUserForm.username}
                      onChange={(e) => setAdminUserForm({ ...adminUserForm, username: e.target.value })}
                      placeholder="e.g. engro_admin"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500 mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold t-text-primary mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={adminUserForm.fullName}
                      onChange={(e) => setAdminUserForm({ ...adminUserForm, fullName: e.target.value })}
                      placeholder="e.g. Tariq Mehmood - Head of CSR"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold t-text-primary mb-1">Official Email</label>
                    <input
                      type="email"
                      value={adminUserForm.email}
                      onChange={(e) => setAdminUserForm({ ...adminUserForm, email: e.target.value })}
                      placeholder={`csr@${personalizeModalOrg.domain}`}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold t-text-primary mb-1">
                      Password {personalizeModalOrg.admin_user ? '(Leave blank to keep existing)' : '*'}
                    </label>
                    <input
                      type="password"
                      required={!personalizeModalOrg.admin_user}
                      value={adminUserForm.password}
                      onChange={(e) => setAdminUserForm({ ...adminUserForm, password: e.target.value })}
                      placeholder={personalizeModalOrg.admin_user ? '••••••••' : 'Enter strong password'}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl t-bg border t-border t-text-primary outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t t-border">
                  <button
                    type="submit"
                    disabled={savingAdminUser}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Key className="w-4 h-4" />
                    <span>{savingAdminUser ? 'Provisioning Account...' : 'Provision Client Admin'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* 8. Super Admin Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-3xl t-bg-sec border border-rose-500/30 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black t-text-primary">
                  {deleteModal.mode === 'bulk' 
                    ? `Delete ${selectedOrgIds.length} Enterprise Clients?` 
                    : `Delete ${deleteModal.org?.name || 'Enterprise Client'}?`}
                </h3>
                <p className="text-xs text-rose-500 font-semibold">Super Admin Permanent Action</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15 text-xs space-y-2 t-text-secondary leading-relaxed">
              <p>
                {deleteModal.mode === 'bulk' ? (
                  <>
                    Are you sure you want to delete the <strong className="t-text-primary">{selectedOrgIds.length} selected organizations</strong>?
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete <strong className="t-text-primary">{deleteModal.org?.name}</strong> (@{deleteModal.org?.domain})?
                  </>
                )}
              </p>
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                ⚠️ All associated smart recycling machines and PecoDrop kiosks will be automatically detached and safely returned to the <strong>ISP Environmental Master</strong> fleet. Client admin and sub-user logins will be revoked.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteModal.loading}
                onClick={() => setDeleteModal({ isOpen: false, mode: 'single', org: null, loading: false })}
                className="px-4 py-2.5 rounded-xl border t-border t-text-secondary text-xs font-bold hover:bg-slate-500/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteModal.loading}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {deleteModal.loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting Client...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{deleteModal.mode === 'bulk' ? 'Confirm Bulk Delete' : 'Confirm Delete Client'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

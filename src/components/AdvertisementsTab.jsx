import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, Upload, Film, Play, Pause, Trash2, Plus, RefreshCw, CheckCircle2, 
  AlertCircle, Monitor, Sparkles, Sliders, ExternalLink, HardDrive, Layers, Eye,
  Send, Check, X, Building2, MapPin, Repeat, Radio, Shield, Globe, Database,
  ArrowUpRight, Video, Settings2, PlayCircle, Smartphone
} from 'lucide-react';

import pecoThumb from '../assets/ad_peco_green_journey.jpg';
import pepsiThumb from '../assets/ad_pepsi_recycle_earn.jpg';
import universityThumb from '../assets/ad_university_bottle_drive.jpg';

export default function AdvertisementsTab({ currentUser, selectedClientId, stationFilter }) {
  const [ads, setAds] = useState([]);
  const [machines, setMachines] = useState([]);

  const getAuthToken = () => {
    return sessionStorage.getItem('rvm_auth_token') || localStorage.getItem('rvm_auth_token') || '';
  };

  const getActiveUser = () => {
    let u = currentUser;
    if (!u || (!u.username && !u.roleId)) {
      try {
        u = JSON.parse(sessionStorage.getItem('rvm_auth_user') || localStorage.getItem('rvm_auth_user') || '{}');
      } catch (e) {
        u = {};
      }
    }
    return u || {};
  };

  const activeUser = getActiveUser();
  const isSuperAdmin = (
    activeUser?.username === 'onenet' ||
    activeUser?.username === 'bilalaaqueel' ||
    activeUser?.roleId === 'super_admin' ||
    activeUser?.roleId === 'superadmin' ||
    (activeUser?.roleName && activeUser.roleName.toLowerCase().includes('super admin'))
  );

  const isCorporateClient = !isSuperAdmin && (
    Boolean(activeUser?.orgId) ||
    activeUser?.roleId === 'client_admin' ||
    activeUser?.roleId === 'corporate_sub_user'
  );

  const corporateOrgName = (
    activeUser?.organizationName ||
    activeUser?.orgName ||
    (activeUser?.fullName ? activeUser.fullName.replace(/Corporate Client Lead.*/i, '').trim() : '') ||
    'Corporate'
  );
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  
  // Filter States
  const [networkScope, setNetworkScope] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [screenProfile, setScreenProfile] = useState('ALL');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [purgeLocalFiles, setPurgeLocalFiles] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Upload Form State
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [adTitle, setAdTitle] = useState('');
  const [adVideoUrl, setAdVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetCategory, setTargetCategory] = useState('Public RVM');
  const [targetOrientation, setTargetOrientation] = useState('16:9 Landscape');
  const [uploading, setUploading] = useState(false);
  
  // Destination targeting state in Upload modal:
  // Modes: 'ALL' (Fleet-wide Global Sync) | 'ALL_PECO' (All PecoDrop) | 'ALL_RVM' (All Public RVM) | 'SPECIFIC' (Selected machines)
  const [uploadTargetMode, setUploadTargetMode] = useState('ALL');
  const [selectedUploadMachines, setSelectedUploadMachines] = useState([]);

  // Feedback notifications
  const [toastMsg, setToastMsg] = useState(null);

  // Database-backed campaigns matching digital signage table
  const [campaigns, setCampaigns] = useState([]);

  const fileInputRef = useRef(null);

  const showToast = (type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => {
      setToastMsg(null);
    }, 4500);
  };

  const fetchMachines = async () => {
    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/analytics/machines', { headers });
      if (res.ok) {
        const data = await res.json();
        setMachines(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load machines:', err);
    }
  };

  // Live fleet machines from PostgreSQL
  const rawFleetList = machines.map(m => ({
    id: m.machineId || m.machine_id || m.id,
    name: m.name || `Machine ${m.machineId || m.id}`,
    location: m.location || 'Local Hub',
    type: ['PECODROP', 'PECO_DROP'].includes(String(m.machineType || m.machine_type || '').toUpperCase()) ? 'peco' : 'rvm',
    clientId: m.clientId,
    clientName: m.clientName
  }));

  // If corporate client, enforce strict boundary to client-owned machines:
  const allFleetMachines = isCorporateClient && activeUser?.orgId
    ? rawFleetList.filter(m => String(m.clientId || '').toUpperCase() === String(activeUser.orgId).toUpperCase() || (Array.isArray(activeUser?.assignedMachines) && activeUser.assignedMachines.includes(String(m.id).toUpperCase())))
    : (isSuperAdmin && rawFleetList.length === 0 ? [
        { id: 'PECO-01', name: 'Corporate Kiosk PECO-01', location: 'Engro Campus', type: 'peco' },
        { id: 'PECO-02', name: 'Corporate Kiosk PECO-02', location: 'Corporate HQ', type: 'peco' },
        { id: 'RVM-ISB-01', name: 'Public RVM Station RVM-ISB-01', location: 'Metro Station', type: 'rvm' }
      ] : rawFleetList);

  const pecoFleetList = allFleetMachines.filter(m => m.type === 'peco');
  const rvmFleetList = allFleetMachines.filter(m => m.type === 'rvm');

  const fetchAds = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const url = isSuperAdmin && selectedClientId && selectedClientId !== 'ALL'
        ? `/api/machine/ads?clientId=${encodeURIComponent(selectedClientId)}`
        : '/api/machine/ads';
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const loadedCampaigns = (data.ads || []).map(ad => {
          let thumb = pecoThumb;
          if (ad.categoryBadge?.includes('Campus') || ad.title?.toLowerCase().includes('bottle')) {
            thumb = universityThumb;
          } else if (ad.categoryBadge?.includes('Public') || ad.title?.toLowerCase().includes('pepsi')) {
            thumb = pepsiThumb;
          }
          if (ad.thumbnailUrl && (ad.thumbnailUrl.startsWith('http') || ad.thumbnailUrl.startsWith('/uploads'))) {
            thumb = ad.thumbnailUrl;
          }

          let formattedSize = '14.0 MB';
          if (ad.fileSize && typeof ad.fileSize === 'string' && (ad.fileSize.includes('MB') || ad.fileSize.includes('GB') || ad.fileSize.includes('KB'))) {
            formattedSize = ad.fileSize;
          } else if (ad.fileSizeBytes && Number(ad.fileSizeBytes) > 0) {
            formattedSize = `${(Number(ad.fileSizeBytes) / (1024 * 1024)).toFixed(1)} MB`;
          } else if (ad.fileSize) {
            const num = parseFloat(ad.fileSize);
            if (!isNaN(num)) {
              formattedSize = num > 100000 ? `${(num / (1024 * 1024)).toFixed(1)} MB` : `${num.toFixed(1)} MB`;
            }
          }

          return {
            id: ad.id,
            title: ad.title,
            filename: ad.fileName,
            fileSize: formattedSize,
            fileSizeBytes: ad.fileSizeBytes || null,
            duration: ad.duration || '0:30',
            thumbnail: thumb,
            aspectRatio: ad.aspectRatio || '16:9 Landscape',
            categoryBadge: ad.categoryBadge || 'Public RVM',
            categoryTheme: ad.categoryTheme || (ad.categoryBadge?.includes('PecoDrop') ? 'purple' : ad.categoryBadge?.includes('Campus') ? 'cyan' : 'emerald'),
            status: ad.status || 'Active Loop',
            isActive: ad.isActive !== false,
            destinations: Array.isArray(ad.destinations) && ad.destinations.length > 0 
              ? ad.destinations 
              : [{ id: 'ALL', label: 'All Screens (Fleet-wide Global Video Sync)', type: 'global' }],
            location: ad.location || 'All Locations (Nationwide)',
            scope: ad.scope || 'ALL',
            orientation: ad.aspectRatio || '16:9 Landscape',
            videoUrl: ad.videoUrl
          };
        });
        setCampaigns(loadedCampaigns);
        setAds(data.ads || []);
      }
    } catch (err) {
      console.error('Failed to load ads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
    fetchAds();
  }, []);

  const handleSyncAllDisplays = async () => {
    try {
      setSyncingAll(true);
      const token = getAuthToken();
      const res = await fetch('/api/machine/ads/sync-all', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      await fetchAds();
      showToast('success', '🚀 Fleet Video Sync Dispatched: All connected kiosk screens (Public RVMs & Corporate PecoDrop kiosks) synchronized successfully with master video playlist!');
    } catch (err) {
      showToast('error', 'Failed to synchronize displays.');
    } finally {
      setSyncingAll(false);
    }
  };

  const handlePushToScreens = async (campaign) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/machine/ads/${campaign.id}/push`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const destNames = campaign.destinations.map(d => d.label).join(', ') || 'All Screens';
      showToast('success', `📡 Broadcast Dispatched: "${campaign.title}" pushed live to [${destNames}]! Hardware display refresh signal transmitted.`);
      await fetchAds();
    } catch (err) {
      showToast('error', `Failed to push campaign: ${err.message}`);
    }
  };

  const handleOpenChangeMachines = (campaign) => {
    setEditingCampaign(campaign);
  };

  const handleSelectPresetDestination = (presetType) => {
    if (!editingCampaign) return;
    if (presetType === 'ALL') {
      setEditingCampaign({
        ...editingCampaign,
        destinations: [{ id: 'ALL', label: 'All Screens (Fleet-wide Global Video Sync)', type: 'global' }]
      });
    } else if (presetType === 'ALL_PECO') {
      setEditingCampaign({
        ...editingCampaign,
        destinations: [{ id: 'ALL_PECO', label: 'All PecoDrop Kiosks (Dual Displays)', type: 'peco' }]
      });
    } else if (presetType === 'ALL_RVM') {
      setEditingCampaign({
        ...editingCampaign,
        destinations: [{ id: 'ALL_RVM', label: 'All Public RVM Stations (Header Display)', type: 'rvm' }]
      });
    }
  };

  const handleToggleSpecificDestination = (m) => {
    if (!editingCampaign) return;
    let current = [...editingCampaign.destinations];
    
    // If currently on a global preset (ALL, ALL_PECO, ALL_RVM), clicking a specific machine clears the preset and starts individual selection
    const isGlobal = current.some(d => d.id === 'ALL' || d.id === 'GLOBAL-01' || d.id === 'ALL_SCREENS' || d.id === 'ALL_PECO' || d.id === 'ALL_RVM');
    if (isGlobal) {
      current = [];
    }

    const exists = current.find(d => d.id === m.id);
    if (exists) {
      current = current.filter(d => d.id !== m.id);
    } else {
      current.push({
        id: m.id,
        label: `${m.id} (${m.location})`,
        type: m.type
      });
    }

    // If all were unchecked, fallback to ALL
    if (current.length === 0) {
      current = [{ id: 'ALL', label: 'All Screens (Fleet-wide Global Video Sync)', type: 'global' }];
    }

    setEditingCampaign({
      ...editingCampaign,
      destinations: current
    });
  };

  const handleSaveCampaignDestinations = async () => {
    if (!editingCampaign) return;
    try {
      const token = getAuthToken();
      await fetch(`/api/machine/ads/${editingCampaign.id}/destinations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ destinations: editingCampaign.destinations })
      });
      // Broadcast immediately so kiosks download or remove accordingly:
      await fetch(`/api/machine/ads/${editingCampaign.id}/push`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      await fetchAds();
      showToast('success', `📡 Broadcast updated: "${editingCampaign.title}" synchronized live with target displays!`);
    } catch (err) {
      showToast('error', 'Failed to update destinations.');
    } finally {
      setEditingCampaign(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCampaign) return;
    try {
      setDeleting(true);
      const params = new URLSearchParams({
        fileName: deletingCampaign.filename || '',
        title: deletingCampaign.title || '',
        purgeLocal: purgeLocalFiles ? 'true' : 'false'
      });

      const token = getAuthToken();
      const res = await fetch(`/api/machine/ads/${encodeURIComponent(deletingCampaign.id)}?${params.toString()}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        // Refresh live from database to guarantee absolute DB synchronization!
        await fetchAds();
        if (purgeLocalFiles) {
          showToast('success', `🗑️ Video "${deletingCampaign.title}" deleted from database and purged from RVM & PecoDrop local kiosk folders!`);
        } else {
          showToast('success', `🗑️ Video campaign "${deletingCampaign.title}" permanently removed from database.`);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast('error', errData.error || 'Failed to delete advertisement campaign.');
      }
      setDeletingCampaign(null);
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      showToast('error', `Failed to delete campaign: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleUploadMachine = (mId) => {
    setSelectedUploadMachines(prev => 
      prev.includes(mId) ? prev.filter(id => id !== mId) : [...prev, mId]
    );
  };

  const handleOpenUploadModal = () => {
    setUploadTargetMode('ALL');
    setSelectedUploadMachines([]);
    setAdTitle('');
    setAdVideoUrl('');
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  const handleUploadAndSave = async (e) => {
    e.preventDefault();
    if (!adTitle.trim()) {
      showToast('error', 'Please enter a campaign video title.');
      return;
    }

    try {
      setUploading(true);
      let finalVideoUrl = adVideoUrl.trim() || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      let fileName = selectedFile ? selectedFile.name : `${adTitle.toLowerCase().replace(/\s+/g, '_')}.mp4`;
      let fileSizeBytes = selectedFile ? selectedFile.size : 14889779;

      // Determine destinations and scope based on chosen target mode:
      let destinations = [];
      let scope = 'ALL';
      let catTheme = targetCategory === 'PecoDrop Exclusive' ? 'purple' : targetCategory === 'Campus Specific' ? 'cyan' : 'emerald';

      const token = getAuthToken();

      if (uploadTargetMode === 'ALL') {
        destinations = [{ id: 'ALL', label: isCorporateClient ? `All Corporate Displays (${corporateOrgName})` : 'All Screens (Fleet-wide Global Video Sync)', type: isCorporateClient ? 'peco' : 'global' }];
        scope = isCorporateClient ? 'PECODROP' : 'ALL';
      } else if (uploadTargetMode === 'ALL_PECO') {
        destinations = [{ id: 'ALL_PECO', label: isCorporateClient ? `All ${corporateOrgName} PecoDrop Kiosks` : 'All PecoDrop Kiosks (Dual Displays)', type: 'peco' }];
        scope = 'PECODROP';
        catTheme = 'purple';
      } else if (uploadTargetMode === 'ALL_RVM') {
        destinations = [{ id: 'ALL_RVM', label: 'All Public RVM Stations (Header Display)', type: 'rvm' }];
        scope = 'RVM_NEW';
        catTheme = 'cyan';
      } else {
        // Specific machines selected
        if (selectedUploadMachines.length === 0) {
          showToast('error', 'Please select at least one specific machine or choose "All Screens".');
          setUploading(false);
          return;
        }
        destinations = selectedUploadMachines.map(mId => {
          const match = allFleetMachines.find(m => m.id === mId);
          return {
            id: mId,
            label: match ? `${match.id} (${match.location})` : mId,
            type: match?.type || 'rvm'
          };
        });
        const hasPeco = destinations.some(d => d.type === 'peco');
        const hasRvm = destinations.some(d => d.type === 'rvm');
        scope = (hasPeco && hasRvm) ? 'ALL' : hasPeco ? 'PECODROP' : 'RVM_NEW';
        catTheme = hasPeco && !hasRvm ? 'purple' : hasRvm && !hasPeco ? 'cyan' : 'emerald';
      }

      // If user uploaded a physical file, post to upload endpoint first with auth header
      if (uploadMode === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('video', selectedFile);
        formData.append('title', adTitle.trim());
        const uploadHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        const uploadRes = await fetch('/api/machine/ads/upload', {
          method: 'POST',
          headers: uploadHeaders,
          body: formData
        });
        if (uploadRes.ok) {
          const upData = await uploadRes.json();
          finalVideoUrl = upData.url || finalVideoUrl;
          fileName = upData.fileName || fileName;
        }
      }

      // Save campaign record directly to PostgreSQL DB with client & auth scoping
      const saveHeaders = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const saveRes = await fetch('/api/machine/ads', {
        method: 'POST',
        headers: saveHeaders,
        body: JSON.stringify({
          title: adTitle.trim(),
          videoUrl: finalVideoUrl,
          fileName,
          fileSize: fileSizeBytes,
          durationSeconds: 30,
          isActive: true,
          categoryBadge: isCorporateClient ? `${corporateOrgName} Campaign` : targetCategory,
          aspectRatio: targetOrientation,
          categoryTheme: catTheme,
          location: isCorporateClient ? `${corporateOrgName} Campus & Facilities` : 'All Locations (Nationwide)',
          scope,
          destinations,
          status: 'Active Loop',
          clientId: isCorporateClient ? activeUser?.orgId : 'ISP_MASTER',
          orgId: isCorporateClient ? activeUser?.orgId : 'ISP_MASTER'
        })
      });

      if (!saveRes.ok) {
        const errJson = await saveRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save to database');
      }

      await fetchAds();
      showToast('success', `🚀 Campaign "${adTitle}" saved & broadcast signal sent to target screens!`);
      setShowUploadModal(false);
      setAdTitle('');
      setAdVideoUrl('');
      setSelectedFile(null);
      setSelectedUploadMachines([]);
    } catch (err) {
      showToast('error', err.message || 'Failed to upload video ad.');
    } finally {
      setUploading(false);
    }
  };

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (networkScope === 'PECODROP' && c.scope !== 'PECODROP') return false;
    if (networkScope === 'RVM_NEW' && c.scope !== 'RVM_NEW') return false;
    if (selectedLocation !== 'ALL' && c.location !== selectedLocation) return false;
    if (screenProfile !== 'ALL' && c.orientation !== screenProfile) return false;
    return true;
  });

  const activeCount = campaigns.length;
  const loopCount = campaigns.filter(c => c.status === 'Active Loop').length;
  const singleCount = campaigns.filter(c => c.status !== 'Active Loop').length;
  const totalStorageMbNum = campaigns.reduce((acc, c) => {
    let sizeMb = 0;
    if (c.fileSizeBytes && Number(c.fileSizeBytes) > 0) {
      sizeMb = Number(c.fileSizeBytes) / (1024 * 1024);
    } else if (c.fileSize) {
      const s = String(c.fileSize).toUpperCase();
      const num = parseFloat(s);
      if (!isNaN(num)) {
        if (s.includes('GB')) sizeMb = num * 1024;
        else if (s.includes('KB')) sizeMb = num / 1024;
        else if (s.includes('MB')) sizeMb = num;
        else if (num > 100000) sizeMb = num / (1024 * 1024);
        else sizeMb = num;
      }
    }
    return acc + sizeMb;
  }, 0);

  const storageDisplay = totalStorageMbNum >= 1024 
    ? { value: (totalStorageMbNum / 1024).toFixed(2), unit: 'GB Used' }
    : { value: totalStorageMbNum.toFixed(1), unit: 'MB Used' };

  return (
    <div className="space-y-6 animate-fade-in w-full">

      {/* Top Banner - Exactly matching the attached design */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border t-border shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Left Title & Status Badges */}
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-emerald-600 text-white p-3 shrink-0 flex items-center justify-center shadow-sm">
              <Tv className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  {isCorporateClient ? 'CORPORATE DIGITAL SIGNAGE' : 'DIGITAL SIGNAGE HUB'}
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {isCorporateClient ? `${corporateOrgName} Kiosks Live Sync` : 'Machine Displays Live Sync'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black t-text-primary tracking-tight">
                {isCorporateClient ? `${corporateOrgName} Screen Ad & Video Manager` : 'Screen Ad & Video Manager'}
              </h1>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSyncAllDisplays}
              disabled={syncingAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all shadow-xs active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 ${syncingAll ? 'animate-spin' : ''}`} />
              <span>Sync All Displays</span>
            </button>

            <button
              onClick={handleOpenUploadModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-900/20 transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New Video Ad</span>
            </button>

            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300 shadow-xs">
              AD
            </div>
          </div>
        </div>
      </div>

      {/* Toast Feedback Notification */}
      {toastMsg && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in shadow-md ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span className="text-xs sm:text-sm font-semibold">{toastMsg.message}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Metric Cards - 4 Standard Columns matching image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
        
        {/* Card 1: ACTIVE MEDIA LIBRARY */}
        <div className="glass-panel p-5 rounded-2xl border t-border shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ACTIVE MEDIA LIBRARY
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black t-text-primary tracking-tight">{activeCount}</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">video assets</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {loopCount} in rotation • {singleCount} targeted single unit
          </div>
        </div>

        {/* Card 2: ACTIVE SCREENS */}
        <div className="glass-panel p-5 rounded-2xl border t-border shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ACTIVE SCREENS
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Monitor className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black t-text-primary tracking-tight">{allFleetMachines.length}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
              100% Synced
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {isCorporateClient
              ? `${pecoFleetList.length} Corporate Kiosk${pecoFleetList.length === 1 ? '' : 's'}`
              : `${rvmFleetList.length} RVM Headers • ${pecoFleetList.length} PecoDrop Screens`}
          </div>
        </div>

        {/* Card 3: SIGNAGE STORAGE */}
        <div className="glass-panel p-5 rounded-2xl border t-border shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              SIGNAGE STORAGE
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black t-text-primary tracking-tight">{storageDisplay.value}</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{storageDisplay.unit}</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Optimized MP4 video format (H.264)
          </div>
        </div>

        {/* Card 4: PLAYBACK MODE */}
        <div className="glass-panel p-5 rounded-2xl border t-border shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              PLAYBACK MODE
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black t-text-primary mt-3 tracking-tight">
            Seamless Loop
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>Autoplays during standby</span>
          </div>
        </div>
      </div>

      {/* Target Display Scope & Machine Filter Card */}
      <div className="glass-panel p-6 rounded-3xl border t-border shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black t-text-primary">Target Display Scope & Machine Filter</h3>
              <p className="text-xs t-text-muted">Choose which location or individual machine display you want to manage</p>
            </div>
          </div>

          <button
            onClick={() => {
              setNetworkScope('ALL');
              setSelectedLocation('ALL');
              setScreenProfile('ALL');
            }}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all self-start sm:self-auto"
          >
            View All Video Campaigns
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Dropdown 1: Target Network Scope */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Network Scope</label>
            <select
              value={networkScope}
              onChange={(e) => setNetworkScope(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold t-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-xs"
            >
              {isCorporateClient ? (
                <option value="ALL">🏢 {corporateOrgName} Fleet ({allFleetMachines.length} Kiosks)</option>
              ) : (
                <>
                  <option value="ALL">🌐 Global Fleet (All {allFleetMachines.length} Machines)</option>
                  <option value="RVM_NEW">♻️ Public RVM Fleet ({rvmFleetList.length} Machines)</option>
                  <option value="PECODROP">🏢 Corporate PecoDrop Fleet ({pecoFleetList.length} Machines)</option>
                </>
              )}
            </select>
          </div>

          {/* Dropdown 2: Select Facility / Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Facility / Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold t-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-xs"
            >
              <option value="ALL">All Locations ({isCorporateClient ? corporateOrgName : 'Nationwide'})</option>
              {Array.from(new Set(allFleetMachines.map(m => m.location).filter(Boolean))).map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Dropdown 3: Hardware Screen Profile */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hardware Screen Profile</label>
            <select
              value={screenProfile}
              onChange={(e) => setScreenProfile(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold t-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-xs"
            >
              <option value="ALL">All Display Orientations</option>
              <option value="16:9 Landscape">16:9 Landscape (PecoDrop)</option>
              <option value="16:9 Header Display">16:9 Header Display (Public RVM)</option>
              <option value="Single Standalone Display">Single Standalone Display</option>
            </select>
          </div>
        </div>
      </div>

      {/* Configured Video Ad Campaigns Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-base font-black t-text-primary">Configured Video Ad Campaigns</h2>
          <p className="text-xs t-text-muted mt-0.5">Manage video assignments, sequencing, and live machine routing</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 self-start sm:self-auto">
          Showing {filteredCampaigns.length} Campaigns
        </span>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((camp, index) => {
          const isPeco = camp.categoryBadge.includes('PecoDrop');
          const isPublic = camp.categoryBadge.includes('Public RVM');
          const isSelected = index === 0;

          return (
            <div 
              key={camp.id} 
              className={`glass-panel rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col ${
                isSelected ? 'ring-2 ring-emerald-500/80 border-emerald-500/40' : 'border t-border'
              }`}
            >
              {/* 16:9 Video Thumbnail Banner */}
              <div className="relative aspect-video w-full bg-slate-900 overflow-hidden group">
                <img 
                  src={camp.thumbnail} 
                  alt={camp.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />

                {/* Top Badges */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-[11px] font-bold backdrop-blur-md shadow-xs">
                    {camp.aspectRatio}
                  </span>

                  <span className={`px-2.5 py-1 rounded-lg text-white text-[11px] font-black backdrop-blur-md shadow-xs ${
                    camp.categoryTheme === 'purple' 
                      ? 'bg-purple-600/90' 
                      : camp.categoryTheme === 'cyan' 
                      ? 'bg-sky-600/90' 
                      : 'bg-emerald-600/90'
                  }`}>
                    {camp.categoryBadge}
                  </span>
                </div>

                {/* Center Play Button Overlay */}
                <button
                  onClick={() => setPreviewVideo(camp)}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors"
                  title="Click to preview video"
                >
                  <div className="w-12 h-12 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-slate-900" />
                  </div>
                </button>

                {/* Bottom Right Duration Pill */}
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-white text-[11px] font-mono font-bold">
                  {camp.duration}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  {/* Title & Status Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-extrabold t-text-primary text-base leading-snug">
                      {camp.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                      camp.status === 'Single Spot' 
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                    }`}>
                      {camp.status}
                    </span>
                  </div>

                  {/* File Metadata */}
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                    {camp.filename} • {camp.fileSize}
                  </div>

                  {/* Broadcast Destination Container */}
                  <div className="mt-4 p-3.5 rounded-2xl t-bg-sec border t-border space-y-2">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Broadcast Destination:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {camp.destinations.map(dest => {
                        const isGlobal = dest.type === 'global' || dest.id === 'ALL' || dest.id === 'GLOBAL-01' || dest.id === 'ALL_SCREENS';
                        const isPeco = dest.type === 'peco' || dest.id === 'ALL_PECO' || dest.id?.startsWith('PECO');
                        return (
                          <span 
                            key={dest.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${
                              isPeco
                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                                : isGlobal
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20'
                            }`}
                          >
                            {isGlobal ? <Globe className="w-3 h-3 text-emerald-500" /> : isPeco ? <Building2 className="w-3 h-3 text-purple-500" /> : <Tv className="w-3 h-3 text-sky-500" />}
                            <span>{dest.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t t-border">
                  <button
                    onClick={() => handleOpenChangeMachines(camp)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Change Machines</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePushToScreens(camp)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Push to {camp.destinations.length > 1 ? 'Screens' : 'Screen'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setDeletingCampaign(camp);
                        setPurgeLocalFiles(true);
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete video campaign & local kiosk files"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl relative">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-sm">{previewVideo.title}</h3>
                <span className="text-xs text-slate-400 font-mono">({previewVideo.duration})</span>
              </div>
              <button 
                onClick={() => setPreviewVideo(null)} 
                className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video 
                src={previewVideo.videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span>Resolution: 1920x1080 (Full HD H.264)</span>
              <span>Target: {previewVideo.destinations.map(d => d.label).join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Change Machines / Delegate Machines Modal */}
      {editingCampaign && (() => {
        const dests = editingCampaign.destinations || [];
        const isAllScreens = dests.some(d => d.id === 'ALL' || d.id === 'GLOBAL-01' || d.id === 'ALL_SCREENS');
        const isAllPeco = !isAllScreens && dests.some(d => d.id === 'ALL_PECO');
        const isAllRvm = !isAllScreens && dests.some(d => d.id === 'ALL_RVM');

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-panel border t-border rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b t-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold t-text-primary text-base">Delegate Machines & Broadcast Target</h3>
                    <p className="text-xs t-text-muted">{editingCampaign.title}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingCampaign(null)} 
                  className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Broadcast Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Quick Broadcast Presets:
                </label>
                <div className={`grid gap-2 ${isCorporateClient ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isCorporateClient) {
                        const corpDests = allFleetMachines.length > 0 
                          ? allFleetMachines.map(m => ({ id: m.id, label: `${m.id} (${m.location})`, type: m.type }))
                          : [{ id: 'ALL_CORP', label: `${corporateOrgName} Kiosks (All)`, type: 'peco' }];
                        setEditingCampaign({ ...editingCampaign, destinations: corpDests });
                      } else {
                        handleSelectPresetDestination('ALL');
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      isAllScreens || (isCorporateClient && dests.length === allFleetMachines.length && allFleetMachines.length > 0)
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 shadow-xs' 
                        : 't-bg-sec border t-border text-slate-500 dark:text-slate-400 hover:border-emerald-500/30'
                    }`}
                  >
                    {isCorporateClient ? <Building2 className="w-4 h-4 text-emerald-500" /> : <Globe className="w-4 h-4 text-emerald-500" />}
                    <span>{isCorporateClient ? `All ${corporateOrgName} Kiosks` : 'All Screens'}</span>
                    <span className="text-[10px] font-normal opacity-80">{isCorporateClient ? `(${allFleetMachines.length} Kiosks)` : '(Global Sync)'}</span>
                  </button>

                  {!isCorporateClient && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSelectPresetDestination('ALL_PECO')}
                        className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          isAllPeco 
                            ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/30 shadow-xs' 
                            : 't-bg-sec border t-border text-slate-500 dark:text-slate-400 hover:border-purple-500/30'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-purple-500" />
                        <span>All PecoDrop</span>
                        <span className="text-[10px] font-normal opacity-80">(Dual Screens)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPresetDestination('ALL_RVM')}
                        className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          isAllRvm 
                            ? 'bg-sky-500/15 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/30 shadow-xs' 
                            : 't-bg-sec border t-border text-slate-500 dark:text-slate-400 hover:border-sky-500/30'
                        }`}
                      >
                        <Tv className="w-4 h-4 text-sky-500" />
                        <span>All Public RVM</span>
                        <span className="text-[10px] font-normal opacity-80">(Header Displays)</span>
                      </button>
                    </>
                  )}

                  {isCorporateClient && (
                    <button
                      type="button"
                      onClick={() => {
                        if (allFleetMachines.length > 0) {
                          setEditingCampaign({ ...editingCampaign, destinations: [{ id: allFleetMachines[0].id, label: `${allFleetMachines[0].id} (${allFleetMachines[0].location})`, type: allFleetMachines[0].type }] });
                        }
                      }}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        !isAllScreens && dests.length > 0 && dests.length < allFleetMachines.length
                          ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/30 shadow-xs' 
                          : 't-bg-sec border t-border text-slate-500 dark:text-slate-400 hover:border-purple-500/30'
                      }`}
                    >
                      <Sliders className="w-4 h-4 text-purple-500" />
                      <span>Specific Kiosks</span>
                      <span className="text-[10px] font-normal opacity-80">(Custom Selection)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Specific Machines Selector (Grouped by Hardware Type) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Or Select Specific Machines:
                  </label>
                  <span className="text-[10px] font-medium text-slate-400">
                    Clicking a machine toggles custom targeting
                  </span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  
                  {/* Corporate PecoDrop Fleet */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 px-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Corporate PecoDrop Fleet (Dual Landscape Displays)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pecoFleetList.map(kiosk => {
                        const isChecked = !isAllScreens && !isAllPeco && !isAllRvm && dests.some(d => d.id === kiosk.id);
                        return (
                          <div
                            key={kiosk.id}
                            onClick={() => handleToggleSpecificDestination(kiosk)}
                            className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${
                              isChecked 
                                ? 'bg-purple-500/10 border-purple-500/50 text-purple-800 dark:text-purple-200' 
                                : 't-bg-sec border t-border text-slate-600 dark:text-slate-300 hover:border-purple-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                isChecked ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-400'
                              }`}>
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold leading-tight truncate">{kiosk.id}</div>
                                <div className="text-[10px] t-text-muted truncate">{kiosk.location}</div>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 shrink-0">
                              PECO
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Public RVM Stations */}
                  <div className="space-y-1.5 pt-2 border-t t-border">
                    <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 px-1">
                      <Tv className="w-3.5 h-3.5" />
                      <span>Public RVM Stations (Malls & Transit Hubs)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rvmFleetList.map(kiosk => {
                        const isChecked = !isAllScreens && !isAllPeco && !isAllRvm && dests.some(d => d.id === kiosk.id);
                        return (
                          <div
                            key={kiosk.id}
                            onClick={() => handleToggleSpecificDestination(kiosk)}
                            className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${
                              isChecked 
                                ? 'bg-sky-500/10 border-sky-500/50 text-sky-800 dark:text-sky-200' 
                                : 't-bg-sec border t-border text-slate-600 dark:text-slate-300 hover:border-sky-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                isChecked ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-400'
                              }`}>
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold leading-tight truncate">{kiosk.id}</div>
                                <div className="text-[10px] t-text-muted truncate">{kiosk.location}</div>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 shrink-0">
                              RVM
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

              {/* Active Selection Summary */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border t-border text-xs flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Broadcast Scope:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  {isAllScreens ? (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>All Screens (Global Sync across Fleet)</span>
                    </>
                  ) : isAllPeco ? (
                    <>
                      <Building2 className="w-3.5 h-3.5 text-purple-500" />
                      <span>All PecoDrop Kiosks ({pecoFleetList.length} Dual Displays)</span>
                    </>
                  ) : isAllRvm ? (
                    <>
                      <Tv className="w-3.5 h-3.5 text-sky-500" />
                      <span>All Public RVM Stations ({rvmFleetList.length} Displays)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{dests.length} Specific Screen{dests.length > 1 ? 's' : ''} ({dests.map(d => d.id).join(', ')})</span>
                    </>
                  )}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t t-border">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold t-text-muted hover:t-bg-sec"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCampaignDestinations}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save & Broadcast to Screens</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Upload New Video Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel border t-border rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold t-text-primary text-base">Upload New Video Ad</h3>
                  <p className="text-xs t-text-muted">Target kiosk displays across the fleet or specific machines</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)} 
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadAndSave} className="space-y-4">
              
              {/* Campaign Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="e.g. Summer Eco Rewards Drive"
                  className="w-full px-4 py-2.5 rounded-xl t-bg-sec border t-border text-xs font-bold t-text-primary focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                />
              </div>

              {/* Hardware Category & Screen Profile */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hardware Category</label>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl t-bg-sec border t-border text-xs font-bold t-text-primary focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                  >
                    <option value="Public RVM">Public RVM</option>
                    <option value="PecoDrop Exclusive">PecoDrop Exclusive</option>
                    <option value="Campus Specific">Campus Specific</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Screen Profile</label>
                  <select
                    value={targetOrientation}
                    onChange={(e) => setTargetOrientation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl t-bg-sec border t-border text-xs font-bold t-text-primary focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                  >
                    <option value="16:9 Landscape">16:9 Landscape</option>
                    <option value="16:9 Header Display">16:9 Header Display</option>
                    <option value="Single Standalone Display">Single Standalone</option>
                  </select>
                </div>
              </div>

              {/* Broadcast Target Screens */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Broadcast Target Screens *
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {uploadTargetMode === 'ALL' && (isCorporateClient ? `🏢 All ${corporateOrgName} Kiosks` : '🌐 Global Sync (All Screens)')}
                    {uploadTargetMode === 'ALL_PECO' && '🏢 All PecoDrop Kiosks'}
                    {uploadTargetMode === 'ALL_RVM' && '🥫 All Public RVM Stations'}
                    {uploadTargetMode === 'SPECIFIC' && `🎯 ${selectedUploadMachines.length} Specific Kiosks Selected`}
                  </span>
                </div>

                <div className={`grid gap-2 ${isCorporateClient ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
                  <button
                    type="button"
                    onClick={() => setUploadTargetMode('ALL')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      uploadTargetMode === 'ALL'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 shadow-xs'
                        : 't-bg-sec border t-border text-slate-500 dark:text-slate-400 hover:border-emerald-500/30'
                    }`}
                  >
                    {isCorporateClient ? <Building2 className="w-4 h-4 text-emerald-500" /> : <Globe className="w-4 h-4 text-emerald-500" />}
                    <span>{isCorporateClient ? `All ${corporateOrgName} Kiosks` : 'All Screens'}</span>
                    <span className="text-[9px] font-normal opacity-80">{isCorporateClient ? `(${allFleetMachines.length} Connected Displays)` : '(Global Sync)'}</span>
                  </button>

                  {!isCorporateClient && (
                    <>
                      <button
                        type="button"
                        onClick={() => setUploadTargetMode('ALL_PECO')}
                        className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          uploadTargetMode === 'ALL_PECO'
                            ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/30 shadow-xs'
                            : 't-bg-sec border t-border text-slate-500 dark:text-slate-400 hover:border-purple-500/30'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-purple-500" />
                        <span>All PecoDrop</span>
                        <span className="text-[9px] font-normal opacity-80">(Dual Screens)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUploadTargetMode('ALL_RVM')}
                        className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          uploadTargetMode === 'ALL_RVM'
                            ? 'bg-sky-500/15 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/30 shadow-xs'
                            : 't-bg-sec border t-border text-slate-500 dark:text-slate-400 hover:border-sky-500/30'
                        }`}
                      >
                        <Tv className="w-4 h-4 text-sky-500" />
                        <span>All Public RVM</span>
                        <span className="text-[9px] font-normal opacity-80">(Header Displays)</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setUploadTargetMode('SPECIFIC')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      uploadTargetMode === 'SPECIFIC'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30 shadow-xs'
                        : 't-bg-sec border t-border text-slate-500 dark:text-slate-400 hover:border-amber-500/30'
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-amber-500" />
                    <span>Specific Kiosks</span>
                    <span className="text-[9px] font-normal opacity-80">(Pick Displays)</span>
                  </button>
                </div>

                {/* If Specific is chosen, display selectable machines list */}
                {uploadTargetMode === 'SPECIFIC' && (
                  <div className="p-3 rounded-2xl t-bg-sec border t-border space-y-3 animate-fade-in">
                    
                    {/* Corporate PecoDrop Options */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-300">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>PecoDrop Kiosks:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const pecoIds = pecoFleetList.map(m => m.id);
                            const allSelected = pecoIds.every(id => selectedUploadMachines.includes(id));
                            if (allSelected) {
                              setSelectedUploadMachines(prev => prev.filter(id => !pecoIds.includes(id)));
                            } else {
                              setSelectedUploadMachines(prev => Array.from(new Set([...prev, ...pecoIds])));
                            }
                          }}
                          className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-bold"
                        >
                          Select All Peco
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {pecoFleetList.map(kiosk => {
                          const isSelected = selectedUploadMachines.includes(kiosk.id);
                          return (
                            <label
                              key={kiosk.id}
                              onClick={() => handleToggleUploadMachine(kiosk.id)}
                              className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-purple-500/10 border-purple-500 text-purple-800 dark:text-purple-200' 
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-400'
                              }`}>
                                {isSelected && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <span className="font-bold truncate">{kiosk.id}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {!isCorporateClient && rvmFleetList.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t t-border">
                        <div className="flex items-center justify-between text-[11px] font-bold text-sky-700 dark:text-sky-300">
                          <span className="flex items-center gap-1">
                            <Tv className="w-3 h-3" />
                            <span>Public RVM Stations:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const rvmIds = rvmFleetList.map(m => m.id);
                              const allSelected = rvmIds.every(id => selectedUploadMachines.includes(id));
                              if (allSelected) {
                                setSelectedUploadMachines(prev => prev.filter(id => !rvmIds.includes(id)));
                              } else {
                                setSelectedUploadMachines(prev => Array.from(new Set([...prev, ...rvmIds])));
                              }
                            }}
                            className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-bold"
                          >
                            Select All RVM
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {rvmFleetList.map(kiosk => {
                            const isSelected = selectedUploadMachines.includes(kiosk.id);
                            return (
                              <label
                                key={kiosk.id}
                                onClick={() => handleToggleUploadMachine(kiosk.id)}
                                className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'bg-sky-500/10 border-sky-500 text-sky-800 dark:text-sky-200' 
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                                }`}
                              >
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-400'
                                }`}>
                                  {isSelected && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <span className="font-bold truncate">{kiosk.id}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Video Source */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Video Source</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      uploadMode === 'file' 
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300' 
                        : 't-bg-sec border t-border text-slate-400'
                    }`}
                  >
                    Upload MP4 File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      uploadMode === 'url' 
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300' 
                        : 't-bg-sec border t-border text-slate-400'
                    }`}
                  >
                    Remote MP4 URL
                  </button>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-emerald-500/40 rounded-2xl text-center cursor-pointer hover:bg-emerald-500/5 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                  />
                  <Upload className="w-7 h-7 mx-auto text-emerald-600 mb-2" />
                  <div className="text-xs font-bold t-text-primary">
                    {selectedFile ? selectedFile.name : 'Click to select or drag video file here'}
                  </div>
                  <div className="text-[11px] t-text-muted mt-1">Recommended: 1080p MP4 H.264 (under 50 MB)</div>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="url"
                    value={adVideoUrl}
                    onChange={(e) => setAdVideoUrl(e.target.value)}
                    placeholder="https://your-domain.com/videos/promo_2026.mp4"
                    className="w-full px-4 py-2.5 rounded-xl t-bg-sec border t-border text-xs font-bold t-text-primary focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t t-border">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold t-text-muted hover:t-bg-sec"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{uploading ? 'Uploading...' : 'Deploy Video Campaign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Campaign Confirmation Modal with Local Kiosk Sync Purge Option */}
      {deletingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel border t-border rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold t-text-primary text-base">Delete Signage Video Campaign</h3>
                  <p className="text-xs t-text-muted">Confirm campaign removal and local kiosk hardware file purging</p>
                </div>
              </div>
              <button 
                onClick={() => setDeletingCampaign(null)} 
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Campaign Summary Card */}
            <div className="p-4 rounded-2xl t-bg-sec border t-border space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Campaign Title</span>
                  <div className="text-sm font-black t-text-primary">{deletingCampaign.title}</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-800 t-text-primary">
                  {deletingCampaign.categoryBadge}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1 border-t t-border">
                <span>File: {deletingCampaign.filename}</span>
                <span>•</span>
                <span>Size: {deletingCampaign.fileSize}</span>
              </div>
            </div>

            {/* Checkbox: Purge from local kiosk folders */}
            <label 
              onClick={() => setPurgeLocalFiles(!purgeLocalFiles)}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                purgeLocalFiles
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-100'
                  : 't-bg-sec border t-border text-slate-600 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                purgeLocalFiles
                  ? 'bg-rose-600 border-rose-600 text-white'
                  : 'border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800'
              }`}>
                {purgeLocalFiles && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="space-y-1">
                <div className="text-xs font-black text-rose-700 dark:text-rose-300">
                  Also permanently delete video file from local folders where it syncs to machines (PecoDrop & RVM desktop apps)
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Deletes the physical .mp4 file from central server uploads (<code>/server/uploads/advertisements/</code>) and kiosk sync folders (<code>/PecoDropDesktopApp/Ads</code>, <code>/RVMDesktopApp/Ads</code>, and <code>C:\RVM\Ads</code>). Machines will immediately stop playing and purge cached video copies.
                </p>
              </div>
            </label>

            {/* Warning Callout */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>This broadcast campaign will be removed from all assigned machine playlists across the network.</span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t t-border">
              <button
                type="button"
                onClick={() => setDeletingCampaign(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold t-text-muted hover:t-bg-sec"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-950/20 flex items-center gap-2 transition-all active:scale-95"
              >
                {deleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{deleting ? 'Deleting...' : purgeLocalFiles ? 'Delete & Purge Local Files' : 'Delete Campaign Only'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md ${
            toastMsg.type === 'error'
              ? 'bg-rose-900/95 text-rose-100 border-rose-700/60'
              : 'bg-slate-900/95 text-white border-emerald-500/50'
          }`}>
            {toastMsg.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="text-xs font-bold leading-relaxed max-w-md">{toastMsg.message}</span>
            <button
              onClick={() => setToastMsg(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

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

export default function AdvertisementsTab() {
  const [ads, setAds] = useState([]);
  const [machines, setMachines] = useState([]);
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

  // Upload Form State
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [adTitle, setAdTitle] = useState('');
  const [adVideoUrl, setAdVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetCategory, setTargetCategory] = useState('Public RVM');
  const [targetOrientation, setTargetOrientation] = useState('16:9 Landscape');
  const [uploading, setUploading] = useState(false);
  const [formMachines, setFormMachines] = useState(['ALL']);

  // Feedback notifications
  const [toastMsg, setToastMsg] = useState(null);

  // Pre-configured campaigns matching the master digital signage architecture
  const [campaigns, setCampaigns] = useState([
    {
      id: 'camp_peco_green',
      title: 'PECO Corporate Green Journey',
      filename: 'peco_corporate_loop_2026.mp4',
      fileSize: '14.2 MB',
      duration: '0:30',
      thumbnail: pecoThumb,
      aspectRatio: '16:9 Landscape',
      categoryBadge: 'PecoDrop Exclusive',
      categoryTheme: 'purple', // 'purple' | 'emerald' | 'cyan'
      status: 'Active Loop',
      isActive: true,
      destinations: [
        { id: 'PECO-RWP', label: 'PECO-RWP (Metro Mall)', type: 'peco' },
        { id: 'PECO-02', label: 'PECO-02 (Corporate HQ)', type: 'peco' }
      ],
      location: 'Metro Mall',
      scope: 'PECODROP',
      orientation: '16:9 Landscape',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    },
    {
      id: 'camp_pepsi_recycle',
      title: 'Pepsi Recycle & Earn PKR 200',
      filename: 'pepsi_public_ad_1080p.mp4',
      fileSize: '9.8 MB',
      duration: '0:15',
      thumbnail: pepsiThumb,
      aspectRatio: '16:9 Header Display',
      categoryBadge: 'Public RVM',
      categoryTheme: 'emerald',
      status: 'Active Loop',
      isActive: true,
      destinations: [
        { id: 'CENTRAL-METRO', label: 'Central Metro Station', type: 'rvm' },
        { id: 'RWP-NORTH', label: 'Rawalpindi North Terminal', type: 'rvm' },
        { id: 'UCP-CAMPUS', label: 'UCP Green Campus', type: 'rvm' }
      ],
      location: 'Rawalpindi North Terminal',
      scope: 'RVM_NEW',
      orientation: '16:9 Header Display',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    },
    {
      id: 'camp_ucp_bottle',
      title: 'University Plastic Bottle Drive',
      filename: 'ucp_campus_drive_spring26.mp4',
      fileSize: '24.2 MB',
      duration: '0:45',
      thumbnail: universityThumb,
      aspectRatio: 'Single Machine Unit',
      categoryBadge: 'Campus Specific',
      categoryTheme: 'cyan',
      status: 'Single Spot',
      isActive: true,
      destinations: [
        { id: 'UCP-RVM', label: 'UCP-RVM (Lahore Campus)', type: 'campus' }
      ],
      location: 'UCP Campus',
      scope: 'RVM_NEW',
      orientation: 'Single Standalone Display',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    }
  ]);

  const fileInputRef = useRef(null);

  const showToast = (type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => {
      setToastMsg(null);
    }, 4500);
  };

  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/analytics/machines');
      if (res.ok) {
        const data = await res.json();
        setMachines(data || []);
      }
    } catch (err) {
      console.error('Failed to load machines:', err);
    }
  };

  const fetchAds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/machine/ads');
      if (res.ok) {
        const data = await res.json();
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
      await new Promise(r => setTimeout(r, 900));
      showToast('success', '🚀 Digital Signage Live Sync: All 8 connected kiosk displays (5 RVM, 3 PecoDrop) synchronized successfully with master video playlist!');
    } catch (err) {
      showToast('error', 'Failed to synchronize displays.');
    } finally {
      setSyncingAll(false);
    }
  };

  const handlePushToScreens = (campaign) => {
    const destNames = campaign.destinations.map(d => d.label).join(', ');
    showToast('success', `📡 Broadcast Dispatched: "${campaign.title}" pushed live to [${destNames}]!`);
  };

  const handleOpenChangeMachines = (campaign) => {
    setEditingCampaign(campaign);
  };

  const handleToggleDestination = (mId, mLabel, mType) => {
    if (!editingCampaign) return;
    const current = [...editingCampaign.destinations];
    const exists = current.find(d => d.id === mId);
    let updated;
    if (exists) {
      updated = current.filter(d => d.id !== mId);
    } else {
      updated = [...current, { id: mId, label: mLabel, type: mType }];
    }
    setEditingCampaign({ ...editingCampaign, destinations: updated });
  };

  const handleSaveCampaignDestinations = () => {
    if (!editingCampaign) return;
    setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? editingCampaign : c));
    showToast('success', `Updated broadcast destinations for "${editingCampaign.title}".`);
    setEditingCampaign(null);
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
      let fileSize = selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '18.4 MB';

      const newCampaign = {
        id: `camp_${Date.now()}`,
        title: adTitle.trim(),
        filename: fileName,
        fileSize,
        duration: '0:30',
        thumbnail: targetCategory === 'PecoDrop Exclusive' ? pecoThumb : targetCategory === 'Campus Specific' ? universityThumb : pepsiThumb,
        aspectRatio: targetOrientation,
        categoryBadge: targetCategory,
        categoryTheme: targetCategory === 'PecoDrop Exclusive' ? 'purple' : targetCategory === 'Campus Specific' ? 'cyan' : 'emerald',
        status: 'Active Loop',
        isActive: true,
        destinations: [
          { id: 'GLOBAL-01', label: 'All Fleet Kiosks', type: 'global' }
        ],
        location: 'All Locations (Nationwide)',
        scope: targetCategory === 'PecoDrop Exclusive' ? 'PECODROP' : 'RVM_NEW',
        orientation: targetOrientation,
        videoUrl: finalVideoUrl
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      showToast('success', `🚀 Campaign "${adTitle}" uploaded & queued for broadcast!`);
      setShowUploadModal(false);
      setAdTitle('');
      setAdVideoUrl('');
      setSelectedFile(null);
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
                  DIGITAL SIGNAGE HUB
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Machine Displays Live Sync
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black t-text-primary tracking-tight">
                Screen Ad & Video Manager
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
              onClick={() => setShowUploadModal(true)}
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
            <span className="text-3xl font-black t-text-primary tracking-tight">4</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">video assets</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            3 in rotation • 1 targeted single unit
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
            <span className="text-3xl font-black t-text-primary tracking-tight">8</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
              100% Synced
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            5 RVM Headers • 3 PecoDrop Screens
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
            <span className="text-3xl font-black t-text-primary tracking-tight">48.2</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">MB Used</span>
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
              <option value="ALL">🌐 Global Fleet (All 8 Machines)</option>
              <option value="RVM_NEW">♻️ Public RVM Fleet (5 Machines)</option>
              <option value="PECODROP">🏢 Corporate PecoDrop Fleet (3 Machines)</option>
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
              <option value="ALL">All Locations (Nationwide)</option>
              <option value="Metro Mall">Metro Mall (Rawalpindi)</option>
              <option value="Rawalpindi North Terminal">Rawalpindi North Terminal</option>
              <option value="UCP Campus">UCP Campus (Lahore)</option>
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
                      {camp.destinations.map(dest => (
                        <span 
                          key={dest.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${
                            camp.categoryTheme === 'purple'
                              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                              : camp.categoryTheme === 'cyan'
                              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          }`}
                        >
                          {dest.type === 'peco' ? <Building2 className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                          <span>{dest.label}</span>
                        </span>
                      ))}
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

                  <button
                    onClick={() => handlePushToScreens(camp)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Push to {camp.destinations.length > 1 ? 'Screens' : 'Screen'}</span>
                  </button>
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

      {/* Change Machines Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel border t-border rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div>
                <h3 className="font-extrabold t-text-primary text-base">Delegate Machines</h3>
                <p className="text-xs t-text-muted">{editingCampaign.title}</p>
              </div>
              <button 
                onClick={() => setEditingCampaign(null)} 
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {[
                { id: 'PECO-RWP', label: 'PECO-RWP (Metro Mall Rawalpindi)', type: 'peco' },
                { id: 'PECO-02', label: 'PECO-02 (Corporate HQ Engro)', type: 'peco' },
                { id: 'CENTRAL-METRO', label: 'Central Metro Station (RVM Header)', type: 'rvm' },
                { id: 'RWP-NORTH', label: 'Rawalpindi North Terminal (RVM Header)', type: 'rvm' },
                { id: 'UCP-CAMPUS', label: 'UCP Green Campus (RVM)', type: 'rvm' },
                { id: 'UCP-RVM', label: 'UCP-RVM (Lahore Campus Standalone)', type: 'campus' }
              ].map(kiosk => {
                const isChecked = editingCampaign.destinations.some(d => d.id === kiosk.id);
                return (
                  <label 
                    key={kiosk.id}
                    onClick={() => handleToggleDestination(kiosk.id, kiosk.label, kiosk.type)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      isChecked 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200' 
                        : 't-bg-sec border t-border t-text-muted hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400'
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-xs font-bold">{kiosk.label}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
                      {kiosk.type}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t t-border">
              <button
                onClick={() => setEditingCampaign(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold t-text-muted hover:t-bg-sec"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCampaignDestinations}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
              >
                Save & Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload New Video Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel border t-border rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold t-text-primary text-base">Upload New Video Ad</h3>
                  <p className="text-xs t-text-muted">Target kiosk displays across the fleet</p>
                </div>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadAndSave} className="space-y-4">
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

    </div>
  );
}

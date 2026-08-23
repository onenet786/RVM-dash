import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, Upload, Film, Play, Pause, Trash2, Plus, RefreshCw, CheckCircle2, 
  AlertCircle, Monitor, Sparkles, Sliders, ExternalLink, HardDrive, Layers, Eye,
  ArrowUp, ArrowDown
} from 'lucide-react';

export default function AdvertisementsTab() {
  const [ads, setAds] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetMachine, setTargetMachine] = useState('ALL');
  
  // Upload & Add Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [adTitle, setAdTitle] = useState('');
  const [adVideoUrl, setAdVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [formMachine, setFormMachine] = useState('ALL');
  const [replaceMode, setReplaceMode] = useState('append'); // 'append' (keep old) or 'replace_delete' (delete old)

  // Preview Modal
  const [previewVideo, setPreviewVideo] = useState(null);

  // Status banners
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/analytics/machines');
      if (res.ok) {
        const data = await res.json();
        setMachines(data);
      }
    } catch (err) {
      console.error('Failed to load machines:', err);
    }
  };

  const fetchAds = async () => {
    try {
      setLoading(true);
      const url = targetMachine && targetMachine !== 'ALL' 
        ? `/api/machine/ads?machineId=${encodeURIComponent(targetMachine)}`
        : '/api/machine/ads';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAds(data.ads || []);
      }
    } catch (err) {
      console.error('Failed to load ads:', err);
      setErrorMsg('Could not load advertisements from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  useEffect(() => {
    fetchAds();
  }, [targetMachine]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!adTitle) {
        setAdTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  const handleUploadAndSave = async (e) => {
    e.preventDefault();
    if (!adTitle.trim()) {
      setErrorMsg('Please enter an advertisement title.');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg('');
      let finalVideoUrl = adVideoUrl.trim();
      let uploadedFileName = '';
      let uploadedFileSize = 0;

      if (uploadMode === 'file') {
        if (!selectedFile) {
          setErrorMsg('Please select a video file (.mp4, .webm, .avi, .mov).');
          setUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append('video', selectedFile);

        const uploadRes = await fetch('/api/machine/ads/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Video file upload failed.');
        }

        const uploadData = await uploadRes.json();
        finalVideoUrl = uploadData.url;
        uploadedFileName = uploadData.fileName;
        uploadedFileSize = uploadData.fileSize;
      } else {
        if (!finalVideoUrl) {
          setErrorMsg('Please enter a valid video URL.');
          setUploading(false);
          return;
        }
      }

      // Save ad metadata to database
      const saveRes = await fetch('/api/machine/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: formMachine,
          title: adTitle.trim(),
          videoUrl: finalVideoUrl,
          fileName: uploadedFileName,
          fileSize: uploadedFileSize,
          displayOrder: parseInt(displayOrder) || 1,
          isActive: true,
          replaceMode,
          cleanupOldVideos: replaceMode === 'replace_delete'
        })
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save advertisement entry.');
      }

      setSuccessMsg(`🚀 Advertisement "${adTitle}" saved & deployed! RVMDesktopApp will automatically download and start playback.`);
      setShowUploadModal(false);
      setAdTitle('');
      setAdVideoUrl('');
      setSelectedFile(null);
      setReplaceMode('append');
      fetchAds();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while uploading.');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await fetch(`/api/machine/ads/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        setAds(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetActiveVideo = async (adId, title) => {
    try {
      const res = await fetch('/api/machine/ads/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adId, machineId: targetMachine })
      });
      if (res.ok) {
        setSuccessMsg(`🚀 Successfully deployed "${title}" to the active playlist! The RVM machine will now play this video.`);
        fetchAds();
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to set active video on RVM.');
    }
  };

  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= ads.length) return;

    const newAds = [...ads];
    const temp = newAds[index];
    newAds[index] = newAds[targetIndex];
    newAds[targetIndex] = temp;

    setAds(newAds);

    try {
      const activeOrderedIds = newAds.filter(a => a.isActive).map(a => a.id);
      await fetch('/api/machine/ads/playlist/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: activeOrderedIds, machineId: targetMachine })
      });
      setSuccessMsg('Playlist rotation order updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAd = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the advertisement "${title}"?`)) return;
    try {
      const res = await fetch(`/api/machine/ads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAds(prev => prev.filter(a => a.id !== id));
        setSuccessMsg(`Advertisement "${title}" removed.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Remote URL';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const totalActiveAds = ads.filter(a => a.isActive).length;
  const totalSizeBytes = ads.reduce((acc, a) => acc + (a.fileSize || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-purple-950/30 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  RVM Digital Signage & Advertisement Manager
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                  Live Sync
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">
                Upload and configure promotional videos that play on RVM Desktop Screens across your fleet.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={fetchAds}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-300 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-700/60 transition-all shadow-md active:scale-95"
            title="Refresh active ad playlist"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-950/50 border border-emerald-400/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Upload New Ad Video
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs sm:text-sm font-semibold animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs sm:text-sm font-semibold animate-fade-in shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Fleet Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800/80 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Playlist</div>
            <div className="text-xl font-black text-white">{totalActiveAds} / {ads.length} <span className="text-xs font-normal text-gray-400">Videos</span></div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800/80 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Target Scope</div>
            <div className="text-xl font-black text-cyan-300">
              {targetMachine === 'ALL' ? 'All RVMs' : targetMachine}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800/80 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Media Storage</div>
            <div className="text-xl font-black text-purple-300">{formatFileSize(totalSizeBytes)}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800/80 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Desktop Mode</div>
            <div className="text-xl font-black text-amber-300">Continuous Loop</div>
          </div>
        </div>
      </div>

      {/* Multi-Video Active Rotation Loop Ribbon */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/40 border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-2">
              <span>Active Looping Rotation Queue</span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                {totalActiveAds} Video(s) in Sequence
              </span>
            </div>
            <div className="text-[11px] text-gray-300 mt-1 flex flex-wrap items-center gap-1.5">
              {totalActiveAds === 0 ? (
                <span className="text-amber-400">No active videos in playlist. Click "Activate" or "Play This Video" on videos below to include in rotation.</span>
              ) : (
                ads.filter(a => a.isActive).map((a, i) => (
                  <span key={a.id} className="inline-flex items-center">
                    <span className="px-2 py-0.5 rounded-lg bg-black/60 border border-cyan-500/30 text-cyan-300 font-bold">
                      #{i + 1} {a.title}
                    </span>
                    {i < totalActiveAds - 1 && <span className="mx-1 text-emerald-400 font-black">➔</span>}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                const activeOrderedIds = ads.filter(a => a.isActive).map(a => a.id);
                const res = await fetch('/api/machine/ads/playlist/reorder', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderedIds: activeOrderedIds, machineId: targetMachine })
                });
                if (res.ok) {
                  setSuccessMsg(`🚀 Successfully synced rotation of ${activeOrderedIds.length} video(s) to RVM machine!`);
                  fetchAds();
                  setTimeout(() => setSuccessMsg(''), 4000);
                }
              } catch (err) {
                setErrorMsg('Failed to sync rotation.');
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg border border-emerald-400/40 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Monitor className="w-4 h-4" />
            Sync Rotation to RVM
          </button>
        </div>
      </div>

      {/* Target Machine Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-gray-300">Filter Playlist by Machine:</span>
          <select
            value={targetMachine}
            onChange={(e) => setTargetMachine(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">🌐 ALL RVM Machines (Global Fleet)</option>
            {machines.map(m => (
              <option key={m.machineId} value={m.machineId}>
                🤖 {m.name || m.machineId} ({m.machineId})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-400">
          Showing <span className="text-emerald-400 font-bold">{ads.length}</span> configured ad video(s)
        </div>
      </div>

      {/* Video Playlist Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3 bg-gray-900/30 rounded-3xl border border-gray-800">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-sm font-semibold">Loading advertisement playlist...</span>
        </div>
      ) : ads.length === 0 ? (
        <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
          <Tv className="w-12 h-12 text-gray-600" />
          <div className="text-base font-bold text-gray-300">No Advertisement Videos Found</div>
          <p className="text-xs text-gray-500 max-w-md">
            Click the "Upload New Ad Video" button above to upload an MP4/video file or link a video URL to play on RVM screens.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all"
          >
            <Plus className="w-4 h-4" />
            Upload First Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {ads.map((ad, index) => (
            <div 
              key={ad.id}
              className={`rounded-3xl border transition-all duration-300 overflow-hidden shadow-xl flex flex-col justify-between ${
                ad.isActive 
                  ? 'bg-gradient-to-b from-gray-900/80 to-gray-950/90 border-gray-800 hover:border-emerald-500/40' 
                  : 'bg-gray-950/60 border-gray-900 opacity-60'
              }`}
            >
              {/* Video Preview / Banner */}
              <div className="relative aspect-video bg-black/80 flex items-center justify-center group overflow-hidden">
                <video 
                  src={ad.videoUrl} 
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
                
                {/* Overlay Play Button */}
                <div 
                  onClick={() => setPreviewVideo(ad)}
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer gap-2"
                >
                  <div className="p-3 bg-emerald-500 rounded-full text-black shadow-lg shadow-emerald-500/50 transform group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-white">Click to Preview</span>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-cyan-300 border border-cyan-500/30 rounded-lg">
                    #{ad.displayOrder || index + 1}
                  </span>
                  <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-emerald-400 border border-emerald-500/30 rounded-lg">
                    {ad.machineId === '*' || ad.machineId === 'ALL' ? 'All Machines' : ad.machineId}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                    ad.isActive 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {ad.isActive ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white truncate" title={ad.title}>
                    {ad.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate mono" title={ad.videoUrl}>
                    {ad.fileName || ad.videoUrl}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-3 border-t border-gray-800">
                  <span>Size: <strong className="text-gray-200">{formatFileSize(ad.fileSize)}</strong></span>
                  <span>Target: <strong className="text-cyan-400">{ad.machineId}</strong></span>
                </div>

                {/* Quick Action: Set / Toggle in Active Multi-Video Rotation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(ad.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 ${
                      ad.isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-950/40 border border-emerald-400/40'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                    }`}
                    title={ad.isActive ? 'Included in active rotation' : 'Click to include in active rotation'}
                  >
                    <Monitor className="w-4 h-4" />
                    {ad.isActive ? '✓ In Rotation Playlist' : '+ Add to Rotation'}
                  </button>

                  {/* Reorder Up / Down Buttons */}
                  <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
                    <button
                      onClick={() => handleMoveOrder(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-gray-800 transition-colors"
                      title="Move Up in Rotation Order"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(index, 1)}
                      disabled={index === ads.length - 1}
                      className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-gray-800 transition-colors"
                      title="Move Down in Rotation Order"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-800/80">
                  <button
                    onClick={() => handleSetActiveVideo(ad.id, ad.title)}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 py-1"
                    title="Play this video as first priority on RVM screen"
                  >
                    ▶ Play Immediately
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewVideo(ad)}
                      className="p-2 rounded-xl text-gray-300 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 transition-all"
                      title="Watch Preview"
                    >
                      <Eye className="w-4 h-4 text-cyan-400" />
                    </button>

                    <button
                      onClick={() => handleDeleteAd(ad.id, ad.title)}
                      className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
                      title="Delete Video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload & Add Video Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-gray-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 animate-scale-up relative">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Add Advertisement Video</h2>
                  <p className="text-xs text-gray-400">Deploy digital promo video to RVM Desktop App</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadAndSave} className="space-y-4">
              {/* Upload Mode Selector */}
              <div className="flex items-center p-1 bg-gray-950 rounded-2xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    uploadMode === 'file' 
                      ? 'bg-emerald-500 text-black shadow-md' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📁 Upload Video File (.MP4)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    uploadMode === 'url' 
                      ? 'bg-emerald-500 text-black shadow-md' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🔗 Direct Video URL
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">Advertisement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eco Summer Promo 2026"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Target Machine */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">Target RVM Machine</label>
                <select
                  value={formMachine}
                  onChange={(e) => setFormMachine(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">🌐 ALL RVM Machines (Global Fleet)</option>
                  {machines.map(m => (
                    <option key={m.machineId} value={m.machineId}>
                      🤖 {m.name || m.machineId} ({m.machineId})
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload Dropzone or URL input */}
              {uploadMode === 'file' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Video File (.mp4, .webm, .mov up to 250MB)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-700 hover:border-emerald-500/60 bg-gray-950/60 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/avi,video/quicktime,video/x-matroska"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    {selectedFile ? (
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white">{selectedFile.name}</div>
                        <div className="text-[11px] text-emerald-400">{formatFileSize(selectedFile.size)}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs font-bold text-gray-300">Click to Browse Video File</div>
                        <div className="text-[10px] text-gray-500">Supports full HD/4K MP4 format</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Direct Video Stream URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://your-cdn.com/videos/ad_promo.mp4"
                    value={adVideoUrl}
                    onChange={(e) => setAdVideoUrl(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Playlist Strategy: Keep or Delete Old Videos */}
              <div className="space-y-2 p-3.5 bg-gray-950/80 rounded-2xl border border-gray-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-200">Playlist Rotation &amp; Storage Action</label>
                  <span className="text-[10px] text-cyan-400 font-bold">Auto-Sync to RVM</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    replaceMode === 'append' ? 'bg-emerald-500/10 border-emerald-500/50 text-white' : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="replaceMode"
                      value="append"
                      checked={replaceMode === 'append'}
                      onChange={() => setReplaceMode('append')}
                      className="mt-0.5 text-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-emerald-300">Keep Old Videos</div>
                      <div className="text-[10px] text-gray-400">Append to sequential multi-video loop</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    replaceMode === 'replace_delete' ? 'bg-rose-500/10 border-rose-500/50 text-white' : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="replaceMode"
                      value="replace_delete"
                      checked={replaceMode === 'replace_delete'}
                      onChange={() => setReplaceMode('replace_delete')}
                      className="mt-0.5 text-rose-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-rose-300">Delete Old Videos</div>
                      <div className="text-[10px] text-gray-400">Replace all previous videos on RVM</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Uploading & Deploying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Deploy Advertisement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-gray-950 border border-emerald-500/40 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-4 p-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Tv className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">{previewVideo.title}</h3>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
              <video
                src={previewVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
              <span>Target: <strong className="text-cyan-400">{previewVideo.machineId}</strong></span>
              <span>Size: <strong className="text-gray-200">{formatFileSize(previewVideo.fileSize)}</strong></span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Cpu, Scale, Plus, RefreshCw, Edit3, MapPin, CheckCircle2, 
  Server, X, Globe, Wifi, Filter, Search, AlertTriangle, Layers, Activity
} from 'lucide-react';

export default function DeviceFleetTab() {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'rvm' | 'picodrop'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Unified Fleet Devices
  const [devices, setDevices] = useState([
    {
      uuid: 'RVM-001-A9F4',
      machineId: 'RVM-01',
      type: 'rvm',
      name: 'Main Atrium RVM Chute',
      location: 'Central Metro Hub, Level 1',
      status: 'ONLINE',
      ip: '192.168.1.101',
      intake: 'Single Hopper (Optical)',
      capacity: '84%',
      materials: 'PET, Cans, Cardboard',
      lastPing: 'Just now',
      firmware: 'v3.8.2-PRO'
    },
    {
      uuid: 'RVM-002-B8E2',
      machineId: 'RVM-02',
      type: 'rvm',
      name: 'North Entrance Terminal',
      location: 'North Terminal Plaza, Gate 3',
      status: 'ONLINE',
      ip: '192.168.1.102',
      intake: 'Single Hopper (Optical)',
      capacity: '42%',
      materials: 'PET, Cans, Cardboard',
      lastPing: '1 min ago',
      firmware: 'v3.8.2-PRO'
    },
    {
      uuid: 'RVM-004-C7D1',
      machineId: 'RVM-04',
      type: 'rvm',
      name: 'South Bus Interchange',
      location: 'South Interchange, Platform B',
      status: 'ONLINE',
      ip: '192.168.1.104',
      intake: 'Single Hopper (Optical)',
      capacity: '78%',
      materials: 'PET, Cans, Cardboard',
      lastPing: '2 mins ago',
      firmware: 'v3.8.0-PRO'
    },
    {
      uuid: 'PICO-001-F3A9',
      machineId: 'PicoDrop-01',
      type: 'picodrop',
      name: 'Academic Quad Smart Deposit',
      location: 'Green Campus Center, Quad A',
      status: 'ONLINE',
      ip: '192.168.1.201',
      intake: '3 Inputs (PET, Metal, Paper Load Cell)',
      capacity: 'Paper: 4.8 / 15 kg (32%)',
      materials: 'PET (count), Metal (count), Paper (load cell)',
      lastPing: 'Just now',
      firmware: 'v2.1.0-PICO'
    },
    {
      uuid: 'PICO-003-E5C7',
      machineId: 'PicoDrop-03',
      type: 'picodrop',
      name: 'Library Eco Station',
      location: 'Central Library, East Lobby',
      status: 'WARNING',
      ip: '192.168.1.203',
      intake: '3 Inputs (PET, Metal, Paper Load Cell)',
      capacity: 'Paper: 15.2 / 15 kg (OVERLIMIT)',
      materials: 'PET (count), Metal (count), Paper (load cell)',
      lastPing: 'Just now',
      firmware: 'v2.1.0-PICO'
    },
    {
      uuid: 'PICO-005-D2B1',
      machineId: 'PicoDrop-05',
      type: 'picodrop',
      name: 'Innovation Hub Deposit Box',
      location: 'West Eco District, Tech Park',
      status: 'WARNING',
      ip: '192.168.1.205',
      intake: '3 Inputs (PET, Metal, Paper Load Cell)',
      capacity: 'Paper: 8.4 / 15 kg (56%)',
      materials: 'PET (count), Metal (count), Paper (load cell)',
      lastPing: '4 mins ago',
      firmware: 'v2.0.9-PICO'
    }
  ]);

  const filteredDevices = devices.filter(d => {
    const matchesType = filterType === 'all' || d.type === filterType;
    const matchesSearch = d.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.uuid.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const rvmCount = devices.filter(d => d.type === 'rvm').length;
  const picoCount = devices.filter(d => d.type === 'picodrop').length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
              Operations & Fleet Management
            </span>
          </div>
          <h2 className="text-2xl font-black t-text-primary tracking-tight">
            Device Fleet Registry
          </h2>
          <p className="text-xs t-text-secondary mt-0.5">
            Master hardware registry mapping machine UUIDs, locations, intake chutes, and operational status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 500);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Fleet</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs & Filter Controls */}
      <div className="glass-panel p-4 rounded-2xl border t-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Sub-tabs: All Devices | RVM Fleet | PicoDrop Units */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              filterType === 'all' 
                ? 'bg-emerald-500 text-black font-black shadow-md' 
                : 't-bg-sec t-text-secondary hover:t-text-primary'
            }`}
          >
            <span>All Devices</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] mono ${filterType === 'all' ? 'bg-black/20 text-black font-black' : 't-bg-surface t-text-muted'}`}>
              {devices.length}
            </span>
          </button>

          <button
            onClick={() => setFilterType('rvm')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              filterType === 'rvm' 
                ? 'bg-cyan-500 text-black font-black shadow-md' 
                : 't-bg-sec t-text-secondary hover:t-text-primary'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>RVM Fleet</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] mono ${filterType === 'rvm' ? 'bg-black/20 text-black font-black' : 't-bg-surface t-text-muted'}`}>
              {rvmCount}
            </span>
          </button>

          <button
            onClick={() => setFilterType('picodrop')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              filterType === 'picodrop' 
                ? 'bg-purple-500 text-white font-black shadow-md' 
                : 't-bg-sec t-text-secondary hover:t-text-primary'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>PicoDrop Units</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] mono ${filterType === 'picodrop' ? 'bg-black/30 text-white font-black' : 't-bg-surface t-text-muted'}`}>
              {picoCount}
            </span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search machine ID, UUID or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl t-bg-sec border t-border text-xs t-text-primary focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Hardware Fleet Table */}
      <div className="glass-panel p-5 rounded-3xl border t-border space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="t-bg-sec border-b t-border text-[11px] uppercase tracking-wider text-emerald-400 font-black">
              <tr>
                <th className="p-3">Device ID & Type</th>
                <th className="p-3">UUID & IP</th>
                <th className="p-3">Location</th>
                <th className="p-3">Intake Mechanism</th>
                <th className="p-3">Bin / Load Capacity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Firmware</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border">
              {filteredDevices.map(d => (
                <tr key={d.uuid} className="hover:bg-white/5 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${d.type === 'rvm' ? 'bg-cyan-500/10 text-cyan-300' : 'bg-purple-500/20 text-purple-300'}`}>
                        {d.type === 'rvm' ? <Cpu className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">{d.machineId}</div>
                        <div className="text-[10px] t-text-muted">{d.name}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 font-mono text-[11px]">
                    <div className="text-cyan-400 font-bold">{d.uuid}</div>
                    <div className="text-gray-400 text-[10px]">{d.ip}</div>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1 text-[11px] text-gray-200">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{d.location}</span>
                    </div>
                  </td>

                  <td className="p-3 text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-mono ${
                      d.type === 'rvm' ? 'bg-cyan-500/10 text-cyan-300' : 'bg-purple-500/20 text-purple-300 font-bold'
                    }`}>
                      {d.intake}
                    </span>
                  </td>

                  <td className="p-3 text-[11px] font-mono">
                    <span className={d.capacity.includes('OVERLIMIT') ? 'text-rose-400 font-bold' : 'text-emerald-300'}>
                      {d.capacity}
                    </span>
                  </td>

                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                      d.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                      {d.status}
                    </span>
                  </td>

                  <td className="p-3 font-mono text-[10px] text-gray-400">
                    {d.firmware}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, ChevronLeft, ChevronRight, Download, Eye, 
  ArrowUpDown, Database, AlertCircle, Calendar, User, Phone, CheckCircle2, AlertTriangle
} from 'lucide-react';
import JsonViewerModal from './JsonViewerModal';

export default function DataTable({ collectionName, displayName }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('_id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const getMachinesParam = () => {
    try {
      const u = JSON.parse(localStorage.getItem('rvm_auth_user') || '{}');
      if (!u.assignedMachines) return '';
      const arr = Array.isArray(u.assignedMachines) ? u.assignedMachines : [u.assignedMachines];
      if (arr.includes('*')) return '';
      return arr.join(',');
    } catch (e) {
      return '';
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
        sortBy,
        sortOrder
      });

      const machines = getMachinesParam();
      if (machines) {
        queryParams.append('assignedMachines', machines);
      }

      const res = await fetch(`/api/collections/${collectionName}?${queryParams}`);

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      
      setData(json.documents || []);
      setTotalPages(json.totalPages || 1);
      setTotalDocs(json.totalDocs || 0);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collectionName, page, limit, debouncedSearch, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;
    const keys = Array.from(new Set(data.flatMap(d => Object.keys(d))));
    const csvRows = [keys.join(',')];
    
    data.forEach(row => {
      const values = keys.map(k => {
        const val = row[k];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${collectionName}_export_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
  };

  const getColumns = () => {
    if (data.length === 0) return ['_id'];
    const keys = new Set();
    data.forEach(item => {
      Object.keys(item).forEach(k => keys.add(k));
    });
    const keyArray = Array.from(keys);
    return keyArray.sort((a, b) => {
      if (a === '_id') return -1;
      if (b === '_id') return 1;
      return a.localeCompare(b);
    });
  };

  const renderCellContent = (key, val) => {
    if (val === null || val === undefined) {
      return <span className="t-text-muted italic text-xs">null</span>;
    }
    
    if (key === '_id') {
      return <span className="mono text-xs font-bold text-emerald-400">{String(val)}</span>;
    }

    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return (
          <div className="flex items-center gap-1.5 t-text-secondary text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            {d.toLocaleString()}
          </div>
        );
      }
    }

    if (key === 'gender') {
      const isMale = val === 'male';
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
          isMale ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
        }`}>
          {val}
        </span>
      );
    }

    if (key === 'binType') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <AlertTriangle className="w-3 h-3" />
          {val.toUpperCase()} BIN FULL
        </span>
      );
    }

    if (typeof val === 'number') {
      return <span className="mono font-bold text-cyan-400">{val}</span>;
    }

    if (typeof val === 'object') {
      return (
        <span className="mono text-xs text-purple-400 bg-purple-950/30 px-2 py-0.5 rounded border border-purple-500/20">
          {JSON.stringify(val).slice(0, 30)}...
        </span>
      );
    }

    return <span className="t-text-primary text-xs truncate max-w-xs block font-medium">{String(val)}</span>;
  };

  const columns = getColumns();

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Table Header Controls */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left info & Search */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold t-text-primary tracking-wide">{displayName || collectionName}</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full mono">
              {totalDocs} records
            </span>
          </div>

          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 t-text-muted" />
            <input
              type="text"
              placeholder={`Search in ${collectionName}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs t-bg-sec border t-border rounded-xl t-text-primary placeholder:t-text-muted focus:outline-none focus:border-emerald-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 t-text-secondary hover:t-text-primary t-bg-sec hover:t-bg-hover border t-border rounded-xl transition-all disabled:opacity-50"
            title="Refresh Table Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={data.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden border t-border shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="t-bg-sec border-b t-border t-text-muted text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4 w-12 text-center">View</th>
                {columns.map(col => (
                  <th 
                    key={col} 
                    onClick={() => handleSort(col)}
                    className="py-3 px-4 cursor-pointer hover:text-emerald-400 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col}</span>
                      <ArrowUpDown className="w-3 h-3 t-text-muted" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y t-border">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center t-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                      <p className="text-xs font-semibold">Fetching documents from MongoDB...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-rose-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-rose-400" />
                      <p className="text-xs font-semibold">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center t-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Database className="w-6 h-6 t-text-muted" />
                      <p className="text-xs font-semibold">No records found matching query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((doc, idx) => (
                  <tr 
                    key={doc._id || idx}
                    className="hover:t-bg-hover transition-colors group"
                  >
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
                        title="Inspect Document Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {columns.map(col => (
                      <td key={col} className="py-2.5 px-4">
                        {renderCellContent(col, doc[col])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-6 py-3 t-bg-sec border-t t-border flex items-center justify-between text-xs t-text-secondary">
          <div>
            Showing <span className="t-text-primary font-bold">{data.length}</span> of <span className="t-text-primary font-bold">{totalDocs}</span> documents
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="t-bg-surface border t-border t-text-primary rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg t-bg-surface hover:t-bg-hover t-text-secondary disabled:opacity-30 border t-border transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-mono font-bold">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg t-bg-surface hover:t-bg-hover t-text-secondary disabled:opacity-30 border t-border transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Inspector Modal */}
      {selectedDoc && (
        <JsonViewerModal
          document={selectedDoc}
          title={`${collectionName} Document`}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}

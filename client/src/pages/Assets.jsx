import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  ChevronRight, 
  Trash2, 
  X, 
  FileText, 
  Paperclip,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function Assets() {
  const { token, user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN' || user?.role?.name === 'ASSET_MANAGER';
  
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search/Filters states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Detail Drawer state
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetHistory, setAssetHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Add Asset modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    assetTag: '',
    assetName: '',
    categoryId: '',
    serialNumber: '',
    purchaseCost: '',
    purchaseDate: '',
    warrantyExpiry: '',
    location: '',
    condition: 'GOOD',
    isBookable: false,
    notes: ''
  });
  
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const query = `search=${search}&categoryId=${categoryFilter}&status=${statusFilter}&page=${page}&limit=8`;
      const res = await fetch(`/api/v1/assets?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        setAssets(body.data || []);
        setTotalPages(body.meta?.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [resCat, resDept] = await Promise.all([
        fetch('/api/v1/assets/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/v1/departments', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (resCat.ok) {
        const bodyCat = await resCat.json();
        setCategories(bodyCat.data || []);
      }
      if (resDept.ok) {
        const bodyDept = await resDept.json();
        setDepartments(bodyDept.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, categoryFilter, statusFilter, page, token]);

  useEffect(() => {
    fetchDropdowns();
  }, [token]);

  const handleSelectAsset = async (asset) => {
    setSelectedAsset(asset);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/v1/assets/${asset.id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        setAssetHistory(body.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    
    const payload = {
      ...newAsset,
      purchaseCost: parseFloat(newAsset.purchaseCost) || 0,
      purchaseDate: newAsset.purchaseDate ? new Date(newAsset.purchaseDate).toISOString() : undefined,
      warrantyExpiry: newAsset.warrantyExpiry ? new Date(newAsset.warrantyExpiry).toISOString() : undefined,
    };

    if (!payload.assetTag) delete payload.assetTag;

    try {
      const res = await fetch('/api/v1/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Failed to register asset');
      }
      setActionSuccess('Asset registered successfully!');
      setNewAsset({
        assetTag: '',
        assetName: '',
        categoryId: '',
        serialNumber: '',
        purchaseCost: '',
        purchaseDate: '',
        warrantyExpiry: '',
        location: '',
        condition: 'GOOD',
        isBookable: false,
        notes: ''
      });
      setTimeout(() => {
        setShowAddModal(false);
        setActionSuccess('');
        fetchAssets();
      }, 1000);
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col relative">
      <Navbar title="Asset Catalog" />
      
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 self-center" size={16} />
            <input
              type="text"
              placeholder="Search assets by tag, name or serial..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="UNDER_MAINTENANCE">Maintenance</option>
              <option value="RESERVED">Reserved</option>
              <option value="LOST">Lost</option>
              <option value="RETIRED">Retired</option>
            </select>

            {/* Add Asset Trigger */}
            {isAdmin && (
              <button 
                onClick={() => setShowAddModal(true)} 
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center space-x-1.5 transition ml-auto sm:ml-0"
              >
                <Plus size={16} />
                <span>Register Asset</span>
              </button>
            )}
          </div>
        </div>

        {/* Table & List Grid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-4">Asset Tag</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Condition</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Bookable</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">Loading catalog items...</td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">No assets found matching current criteria.</td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr 
                      key={asset.id} 
                      onClick={() => handleSelectAsset(asset)}
                      className="hover:bg-slate-50/50 cursor-pointer transition"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900">{asset.assetTag}</td>
                      <td className="px-6 py-4 text-slate-800 font-bold">{asset.assetName}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{asset.category?.name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs uppercase font-bold">
                          {asset.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          asset.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          asset.status === 'ALLOCATED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          asset.status === 'UNDER_MAINTENANCE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {asset.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {asset.isBookable ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Yes</span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 text-slate-400 hover:text-brand-600 rounded">
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-medium">Page {page} of {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Asset Detail Drawer (Sidebar Drawer) */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto border-l border-slate-200 animate-slide-in">
            {/* Drawer Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asset Details</span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedAsset.assetName}</h3>
                <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold mt-1 uppercase tracking-wider">
                  {selectedAsset.assetTag}
                </span>
              </div>
              <button 
                onClick={() => setSelectedAsset(null)} 
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* General Specs */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold border-b border-slate-100 pb-4 mb-4 text-slate-500">
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Serial Number</span>
                <span className="text-slate-800 text-sm font-bold">{selectedAsset.serialNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Purchase Cost</span>
                <span className="text-slate-800 text-sm font-bold">${selectedAsset.purchaseCost}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Condition</span>
                <span className="text-slate-800 text-sm font-bold uppercase">{selectedAsset.condition}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider">Department</span>
                <span className="text-slate-800 text-sm font-bold uppercase">{selectedAsset.department?.name || 'Central Stock'}</span>
              </div>
            </div>

            {/* Historical Lifecycle Timeline */}
            <div className="flex-1 flex flex-col">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Historical Timeline</h4>
              {historyLoading ? (
                <div className="text-center text-slate-400 py-6 text-xs">Loading timeline...</div>
              ) : assetHistory.length === 0 ? (
                <div className="text-center text-slate-400 py-6 text-xs">No historical entries found for this asset.</div>
              ) : (
                <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-5 flex-1">
                  {assetHistory.map((item, idx) => (
                    <div key={idx} className="relative text-xs">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[21px] top-1 bg-brand-600 w-2 h-2 rounded-full ring-4 ring-white"></span>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>{item.type?.toUpperCase()}</span>
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-700 font-medium mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Register New Asset</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {actionError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs flex items-center space-x-2">
                <AlertCircle size={14} />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-600 p-3 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle size={14} />
                <span>{actionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddAsset} className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Asset Name</label>
                  <input
                    type="text" required
                    value={newAsset.assetName}
                    onChange={(e) => setNewAsset({...newAsset, assetName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                    placeholder="MacBook Pro M3"
                  />
                </div>
                <div>
                  <label className="block mb-1">Category</label>
                  <select
                    required
                    value={newAsset.categoryId}
                    onChange={(e) => setNewAsset({...newAsset, categoryId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Asset Tag (Blank for auto-generation)</label>
                  <input
                    type="text"
                    value={newAsset.assetTag}
                    onChange={(e) => setNewAsset({...newAsset, assetTag: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                    placeholder="AF-001234"
                  />
                </div>
                <div>
                  <label className="block mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={newAsset.serialNumber}
                    onChange={(e) => setNewAsset({...newAsset, serialNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                    placeholder="S/N: C02F8..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1">Purchase Cost ($)</label>
                  <input
                    type="number" step="0.01" required
                    value={newAsset.purchaseCost}
                    onChange={(e) => setNewAsset({...newAsset, purchaseCost: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                    placeholder="1299.99"
                  />
                </div>
                <div>
                  <label className="block mb-1">Condition</label>
                  <select
                    value={newAsset.condition}
                    onChange={(e) => setNewAsset({...newAsset, condition: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  >
                    <option value="NEW">New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="isBookable"
                    checked={newAsset.isBookable}
                    onChange={(e) => setNewAsset({...newAsset, isBookable: e.target.checked})}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 border-slate-200"
                  />
                  <label htmlFor="isBookable" className="font-semibold text-slate-700 cursor-pointer">Bookable Resource</label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

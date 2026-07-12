import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  UserCheck, 
  RotateCcw, 
  Search, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';

export default function Allocations() {
  const { token, user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN' || user?.role?.name === 'ASSET_MANAGER';
  
  const [allocations, setAllocations] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedAllocId, setSelectedAllocId] = useState(null);

  // Form states
  const [newAlloc, setNewAlloc] = useState({
    assetId: '',
    employeeId: '',
    expectedReturnDate: ''
  });
  const [returnNotes, setReturnNotes] = useState('');

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const query = `search=${search}&status=${statusFilter}&page=${page}&limit=8`;
      const res = await fetch(`/api/v1/allocations?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        setAllocations(body.data || []);
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
      const [resAssets, resEmps] = await Promise.all([
        fetch('/api/v1/assets?status=AVAILABLE&limit=100', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/v1/employees?limit=100', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (resAssets.ok) {
        const body = await resAssets.json();
        setAvailableAssets(body.data || []);
      }
      if (resEmps.ok) {
        const body = await resEmps.json();
        setEmployees(body.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [search, statusFilter, page, token]);

  useEffect(() => {
    if (showAllocateModal) {
      fetchDropdowns();
    }
  }, [showAllocateModal, token]);

  const handleAllocate = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch('/api/v1/allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newAlloc,
          expectedReturnDate: newAlloc.expectedReturnDate ? new Date(newAlloc.expectedReturnDate).toISOString() : undefined
        })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to allocate asset');
      
      setActionSuccess('Asset allocated successfully!');
      setNewAlloc({ assetId: '', employeeId: '', expectedReturnDate: '' });
      setTimeout(() => {
        setShowAllocateModal(false);
        setActionSuccess('');
        fetchAllocations();
      }, 1000);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/v1/allocations/${selectedAllocId}/return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ returnNotes })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to process return');

      setActionSuccess('Asset return processed successfully!');
      setReturnNotes('');
      setTimeout(() => {
        setShowReturnModal(false);
        setActionSuccess('');
        fetchAllocations();
      }, 1000);
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col relative">
      <Navbar title="Asset Allocations" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 self-center" size={16} />
            <input
              type="text"
              placeholder="Search allocations by asset or employee..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="RETURNED">Returned</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            {isAdmin && (
              <button 
                onClick={() => setShowAllocateModal(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center space-x-1.5 transition ml-auto sm:ml-0"
              >
                <Plus size={16} />
                <span>New Allocation</span>
              </button>
            )}
          </div>
        </div>

        {/* Allocations Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Allocation Date</th>
                  <th className="px-6 py-4">Return Date</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">Loading allocations...</td>
                  </tr>
                ) : allocations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">No allocations found.</td>
                  </tr>
                ) : (
                  allocations.map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{alloc.asset?.assetName}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded self-start mt-0.5 uppercase tracking-wider">
                            {alloc.asset?.assetTag}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{alloc.employee?.firstName} {alloc.employee?.lastName}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{alloc.employee?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {new Date(alloc.allocatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {alloc.returnedAt ? (
                          <span className="text-slate-400 font-bold">Returned {new Date(alloc.returnedAt).toLocaleDateString()}</span>
                        ) : alloc.expectedReturnDate ? (
                          <span className="text-slate-600 font-bold">Expected {new Date(alloc.expectedReturnDate).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          alloc.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          alloc.status === 'RETURNED' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {alloc.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          {alloc.status === 'ACTIVE' && (
                            <button
                              onClick={() => { setSelectedAllocId(alloc.id); setShowReturnModal(true); }}
                              className="px-3 py-1 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg text-xs font-bold flex items-center space-x-1.5 ml-auto transition"
                            >
                              <RotateCcw size={12} />
                              <span>Process Return</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* New Allocation Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Allocate Physical Resource</h3>
              <button onClick={() => setShowAllocateModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
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

            <form onSubmit={handleAllocate} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1">Select Available Asset</label>
                <select
                  required
                  value={newAlloc.assetId}
                  onChange={(e) => setNewAlloc({...newAlloc, assetId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  <option value="">Select Asset</option>
                  {availableAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.assetName} [{asset.assetTag}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Select Target Employee</label>
                <select
                  required
                  value={newAlloc.employeeId}
                  onChange={(e) => setNewAlloc({...newAlloc, employeeId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} [{emp.email}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Expected Return Date (Optional)</label>
                <input
                  type="date"
                  value={newAlloc.expectedReturnDate}
                  onChange={(e) => setNewAlloc({...newAlloc, expectedReturnDate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold"
                >
                  Allocate Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Asset Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Return Resource Handoff</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
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

            <form onSubmit={handleReturn} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1">Return Notes / Comments</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs h-24"
                  placeholder="Returned in clean condition, normal wear and tear."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold"
                >
                  Process Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

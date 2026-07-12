import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  ClipboardCheck, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Check, 
  ShieldAlert, 
  LockOpen 
} from 'lucide-react';

export default function Audits() {
  const { token, user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN' || user?.role?.name === 'ASSET_MANAGER';

  const [cycles, setCycles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCycle, setSelectedCycle] = useState(null);
  const [cycleItems, setCycleItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);

  const [newCycle, setNewCycle] = useState({
    title: '',
    departmentId: '',
    startDate: '',
    endDate: ''
  });
  const [verificationStatus, setVerificationStatus] = useState('VERIFIED');
  const [remarks, setRemarks] = useState('');

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/audits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        setCycles(body.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const res = await fetch('/api/v1/departments', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const body = await res.json();
        setDepartments(body.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, [token]);

  useEffect(() => {
    if (showAddModal) {
      fetchDropdowns();
    }
  }, [showAddModal, token]);

  const handleSelectCycle = async (cycle) => {
    setSelectedCycle(cycle);
    setItemsLoading(true);
    try {
      const res = await fetch(`/api/v1/audits/${cycle.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        if (body.data) {
          const allItems = [
            ...(body.data.discrepancies?.missing || []),
            ...(body.data.discrepancies?.damaged || []),
            ...(body.data.pending || []),
          ];
          setCycleItems(allItems);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    const payload = {
      ...newCycle,
      departmentId: newCycle.departmentId || undefined,
      startDate: new Date(newCycle.startDate).toISOString(),
      endDate: new Date(newCycle.endDate).toISOString()
    };

    try {
      const res = await fetch('/api/v1/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to open audit cycle');

      setActionSuccess('Audit cycle created successfully!');
      setNewCycle({ title: '', departmentId: '', startDate: '', endDate: '' });
      setTimeout(() => {
        setShowAddModal(false);
        setActionSuccess('');
        fetchCycles();
      }, 1000);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleVerifyItem = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/v1/audits/${selectedCycle.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assetId: selectedAssetId, verificationStatus, remarks })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to submit verification');

      setActionSuccess('Item verification submitted!');
      setRemarks('');
      setTimeout(() => {
        setShowVerifyModal(false);
        setActionSuccess('');
        handleSelectCycle(selectedCycle);
      }, 1000);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleCloseCycle = async (id) => {
    if (!window.confirm('Are you sure you want to close this audit cycle officially?')) return;
    try {
      const res = await fetch(`/api/v1/audits/${id}/close`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCycles();
        setSelectedCycle(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col relative">
      <Navbar title="Inventory Audits" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header Controls */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Verify physical assets availability and condition states.</p>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center space-x-1.5 transition"
            >
              <Plus size={16} />
              <span>Create Cycle</span>
            </button>
          )}
        </div>

        {/* Dynamic Details View / Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Cycles List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 text-sm font-bold text-slate-700">Audit Cycles</div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="text-center py-10 text-slate-400 text-sm">Loading cycles...</div>
              ) : cycles.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No cycles opened.</div>
              ) : (
                cycles.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCycle(c)}
                    className={`p-4 cursor-pointer hover:bg-slate-50/50 transition flex flex-col space-y-1.5 ${
                      selectedCycle?.id === c.id ? 'bg-blue-50/20 border-r-4 border-brand-600' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm">{c.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        c.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                        c.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {c.auditNumber} • Scoped: {c.department?.name || 'All'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      End Date: {new Date(c.endDate).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Cycle Item Verification Grid */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
            {selectedCycle ? (
              <>
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{selectedCycle.title} ({selectedCycle.auditNumber})</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Audit Verification Table
                    </span>
                  </div>
                  {isAdmin && selectedCycle.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleCloseCycle(selectedCycle.id)}
                      className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition"
                    >
                      Close Cycle
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {itemsLoading ? (
                    <div className="text-center py-20 text-slate-400 text-sm">Loading items...</div>
                  ) : cycleItems.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 text-sm">No items inside this scope.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {cycleItems.map((item) => (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                          <div>
                            <span className="font-bold text-slate-800 text-sm">{item.asset?.assetName}</span>
                            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {item.asset?.assetTag} • Condition: {item.asset?.condition}
                            </span>
                            {item.remarks && (
                              <span className="block text-[10px] text-slate-500 italic mt-0.5">Remarks: {item.remarks}</span>
                            )}
                          </div>

                          <div className="flex items-center space-x-3">
                            {item.verificationStatus ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                item.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                                item.verificationStatus === 'MISSING' ? 'bg-red-100 text-red-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {item.verificationStatus}
                              </span>
                            ) : (
                              selectedCycle.status !== 'CLOSED' && (
                                <button
                                  onClick={() => { setSelectedAssetId(item.assetId); setShowVerifyModal(true); }}
                                  className="px-3 py-1 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded text-xs font-bold transition"
                                >
                                  Verify
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <ClipboardCheck size={48} className="text-slate-300 mb-2" />
                <span className="text-sm font-semibold">Select an audit cycle to perform verifications</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Cycle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Create Audit Cycle</h3>
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

            <form onSubmit={handleCreateCycle} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1">Audit Title</label>
                <input
                  type="text" required
                  value={newCycle.title}
                  onChange={(e) => setNewCycle({...newCycle, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  placeholder="2026 Q3 Hardware Audit"
                />
              </div>

              <div>
                <label className="block mb-1">Target Department (Optional)</label>
                <select
                  value={newCycle.departmentId}
                  onChange={(e) => setNewCycle({...newCycle, departmentId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Start Date</label>
                  <input
                    type="date" required
                    value={newCycle.startDate}
                    onChange={(e) => setNewCycle({...newCycle, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1">End Date</label>
                  <input
                    type="date" required
                    value={newCycle.endDate}
                    onChange={(e) => setNewCycle({...newCycle, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                  />
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
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold"
                >
                  Confirm Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Item Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Verify Asset</h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
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

            <form onSubmit={handleVerifyItem} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1">Verification Status</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  <option value="VERIFIED">Verified (Present)</option>
                  <option value="MISSING">Missing</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Remarks / Details</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs h-20"
                  placeholder="Located in Cabinet C, shelf 3."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

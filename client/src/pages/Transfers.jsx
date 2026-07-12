import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  ArrowLeftRight, 
  Check, 
  X, 
  Search, 
  Plus, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';

export default function Transfers() {
  const { token, user } = useAuth();
  
  const [transfers, setTransfers] = useState([]);
  const [myAllocations, setMyAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    assetId: '',
    toEmployeeId: '',
    reason: ''
  });

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/transfers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        setTransfers(body.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [resAlloc, resEmps] = await Promise.all([
        fetch('/api/v1/allocations?status=ACTIVE', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/v1/employees?limit=100', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (resAlloc.ok) {
        const body = await resAlloc.json();
        setMyAllocations(body.data || []);
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
    fetchTransfers();
  }, [token]);

  useEffect(() => {
    if (showRequestModal) {
      fetchDropdowns();
    }
  }, [showRequestModal, token]);

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch('/api/v1/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTransfer)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to submit transfer request');

      setActionSuccess('Transfer request submitted successfully!');
      setNewTransfer({ assetId: '', toEmployeeId: '', reason: '' });
      setTimeout(() => {
        setShowRequestModal(false);
        setActionSuccess('');
        fetchTransfers();
      }, 1000);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`/api/v1/transfers/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchTransfers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`/api/v1/transfers/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchTransfers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col relative">
      <Navbar title="Asset Transfers" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header Controls */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Coordinate physical equipment handovers between department employees.</p>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center space-x-1.5 transition"
          >
            <Plus size={16} />
            <span>Request Transfer</span>
          </button>
        </div>

        {/* Transfers Grid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">From Holder</th>
                  <th className="px-6 py-4">To Target</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">Loading transfers...</td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">No transfer requests logged.</td>
                  </tr>
                ) : (
                  transfers.map((xfer) => (
                    <tr key={xfer.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {xfer.asset?.assetName}
                        <span className="block text-[10px] text-slate-400 font-normal uppercase tracking-wider">{xfer.asset?.assetTag}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {xfer.fromEmployee ? `${xfer.fromEmployee.firstName} ${xfer.fromEmployee.lastName}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {xfer.toEmployee?.firstName} {xfer.toEmployee?.lastName}
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{xfer.reason}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          xfer.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          xfer.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {xfer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {xfer.status === 'PENDING' && (user?.id === xfer.toEmployeeId || user?.role?.name === 'ADMIN') && (
                          <div className="flex items-center space-x-2 justify-end">
                            <button
                              onClick={() => handleApprove(xfer.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(xfer.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Request Transfer Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Request Equipment Handoff</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
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

            <form onSubmit={handleRequestTransfer} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1">Select Asset to Transfer</label>
                <select
                  required
                  value={newTransfer.assetId}
                  onChange={(e) => setNewTransfer({...newTransfer, assetId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  <option value="">Select Asset</option>
                  {myAllocations.map((alloc) => (
                    <option key={alloc.assetId} value={alloc.assetId}>
                      {alloc.asset?.assetName} [{alloc.asset?.assetTag}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Select Recipient Employee</label>
                <select
                  required
                  value={newTransfer.toEmployeeId}
                  onChange={(e) => setNewTransfer({...newTransfer, toEmployeeId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  <option value="">Select Target Employee</option>
                  {employees.filter(e => e.id !== user?.id).map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} [{emp.email}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Reason for Transfer</label>
                <textarea
                  required
                  value={newTransfer.reason}
                  onChange={(e) => setNewTransfer({...newTransfer, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs h-24"
                  placeholder="Need to hand this device over for QA testing session."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

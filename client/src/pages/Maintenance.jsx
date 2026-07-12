import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  Wrench, 
  Search, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle, 
  MessageSquare, 
  UserPlus, 
  Check 
} from 'lucide-react';

export default function Maintenance() {
  const { token, user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN' || user?.role?.name === 'ASSET_MANAGER';

  const [requests, setRequests] = useState([]);
  const [myAllocatedAssets, setMyAllocatedAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState(null);

  // Form states
  const [newRequest, setNewRequest] = useState({
    assetId: '',
    priority: 'MEDIUM',
    issueDescription: ''
  });
  const [technicianId, setTechnicianId] = useState('');
  const [updateComment, setUpdateComment] = useState('');
  const [updateStatus, setUpdateStatus] = useState('IN_PROGRESS');

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/maintenance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        setRequests(body.data || []);
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
        setMyAllocatedAssets(body.data || []);
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
    fetchRequests();
  }, [token]);

  useEffect(() => {
    if (showAddModal || showAssignModal) {
      fetchDropdowns();
    }
  }, [showAddModal, showAssignModal, token]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch('/api/v1/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRequest)
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to submit request');

      setActionSuccess('Maintenance request submitted successfully!');
      setNewRequest({ assetId: '', priority: 'MEDIUM', issueDescription: '' });
      setTimeout(() => {
        setShowAddModal(false);
        setActionSuccess('');
        fetchRequests();
      }, 1000);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`/api/v1/maintenance/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/v1/maintenance/${selectedReqId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ technicianId })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to assign technician');

      setActionSuccess('Technician assigned successfully!');
      setTechnicianId('');
      setTimeout(() => {
        setShowAssignModal(false);
        setActionSuccess('');
        fetchRequests();
      }, 1000);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/v1/maintenance/${selectedReqId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: updateComment, status: updateStatus })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to add update');

      setActionSuccess('Comment update logged successfully!');
      setUpdateComment('');
      setTimeout(() => {
        setShowUpdateModal(false);
        setActionSuccess('');
        fetchRequests();
      }, 1000);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleResolve = async (id) => {
    if (!window.confirm('Mark this request as resolved and release asset?')) return;
    try {
      const res = await fetch(`/api/v1/maintenance/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col relative">
      <Navbar title="Maintenance Tickets" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header Controls */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Raise repair requests and monitor equipment status changes.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center space-x-1.5 transition"
          >
            <Plus size={16} />
            <span>Request Repair</span>
          </button>
        </div>

        {/* Requests Grid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-4">Asset</th>
                  <th className="px-6 py-4">Reported By</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Issue</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">Loading tickets...</td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">No active maintenance tickets found.</td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {req.asset?.assetName}
                        <span className="block text-[10px] text-slate-400 font-normal uppercase tracking-wider">{req.asset?.assetTag}</span>
                      </td>
                      <td className="px-6 py-4">
                        {req.requester?.firstName} {req.requester?.lastName}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          req.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          req.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          req.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{req.issueDescription}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          req.status === 'PENDING' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          req.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center space-x-2 justify-end">
                          {isAdmin && req.status === 'PENDING' && (
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-2.5 py-1 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded text-xs font-bold"
                            >
                              Approve
                            </button>
                          )}
                          {isAdmin && req.status === 'APPROVED' && (
                            <button
                              onClick={() => { setSelectedReqId(req.id); setShowAssignModal(true); }}
                              className="p-1.5 text-slate-400 hover:text-brand-600 rounded flex items-center space-x-1"
                              title="Assign Tech"
                            >
                              <UserPlus size={14} />
                            </button>
                          )}
                          {isAdmin && ['APPROVED', 'ASSIGNED', 'IN_PROGRESS'].includes(req.status) && (
                            <>
                              <button
                                onClick={() => { setSelectedReqId(req.id); setShowUpdateModal(true); }}
                                className="p-1.5 text-slate-400 hover:text-brand-600 rounded"
                                title="Add Update"
                              >
                                <MessageSquare size={14} />
                              </button>
                              <button
                                onClick={() => handleResolve(req.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Resolve"
                              >
                                <Check size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Request Repair Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Raise Repair Request</h3>
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

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1">Select Broken Asset</label>
                <select
                  required
                  value={newRequest.assetId}
                  onChange={(e) => setNewRequest({...newRequest, assetId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  <option value="">Select Asset</option>
                  {myAllocatedAssets.map((alloc) => (
                    <option key={alloc.assetId} value={alloc.assetId}>
                      {alloc.asset?.assetName} [{alloc.asset?.assetTag}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Priority</label>
                <select
                  value={newRequest.priority}
                  onChange={(e) => setNewRequest({...newRequest, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Issue Description</label>
                <textarea
                  required
                  value={newRequest.issueDescription}
                  onChange={(e) => setNewRequest({...newRequest, issueDescription: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs h-24"
                  placeholder="Battery is swelling and runs hot during standard usage."
                />
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
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Tech Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Assign Technician</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1">Select Technician</label>
                <select
                  required
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Log Repair Comment</h3>
              <button onClick={() => setShowUpdateModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddUpdate} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block mb-1">Status Update</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Comment / Notes</label>
                <textarea
                  required
                  value={updateComment}
                  onChange={(e) => setUpdateComment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs h-20"
                  placeholder="Waiting for replacement parts from vendor."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold"
                >
                  Add Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

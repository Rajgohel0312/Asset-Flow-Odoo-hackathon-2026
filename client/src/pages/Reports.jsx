import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  FileSpreadsheet, 
  Download, 
  Eye, 
  Table 
} from 'lucide-react';

export default function Reports() {
  const { token } = useAuth();
  
  const [reportType, setReportType] = useState('assets');
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/reports/${reportType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const body = await res.json();
        setPreviewData(body.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    const url = `/api/v1/reports/${reportType}?format=csv`;
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${reportType}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch(err => console.error(err));
  };

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col relative">
      <Navbar title="Operational Reports" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Selector Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">Select Export Specifications</h3>
            <p className="text-slate-400 text-xs font-semibold">Generate data logs and spreadsheets for regulatory audits.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={reportType}
              onChange={(e) => { setReportType(e.target.value); setPreviewData([]); }}
              className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-4 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
            >
              <option value="assets">Global Assets Directory</option>
              <option value="maintenance">Repairs & Maintenance Logs</option>
              <option value="bookings">Reservation Bookings Schedules</option>
              <option value="idle-assets">Idle Assets (Central Stock)</option>
              <option value="overdue">Overdue Handoff Allocations</option>
            </select>

            <button
              onClick={fetchPreview}
              className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-sm font-bold flex items-center space-x-1.5 transition ml-auto sm:ml-0"
            >
              <Eye size={16} />
              <span>Preview</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-bold flex items-center space-x-1.5 transition"
            >
              <Download size={16} />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Preview Data Grid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 text-slate-700 text-sm font-bold flex items-center space-x-2">
            <FileSpreadsheet size={16} />
            <span>Data Preview Grid ({previewData.length} records)</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="text-center py-20 text-slate-400 text-sm">Querying report database...</div>
            ) : previewData.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-sm">Click "Preview" to load data rows.</div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-sm text-left font-semibold">
                <thead>
                  <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="px-6 py-3">Reference/Tag</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                  {previewData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3 font-bold text-slate-900">
                        {row.assetTag || row.bookingNumber || row.assetName || row.name || 'N/A'}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-700">
                        {row.assetName || row.issueDescription || row.purpose || row.description || 'N/A'}
                      </td>
                      <td className="px-6 py-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                          {row.status || row.condition || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400">
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

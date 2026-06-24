import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import StatusBadge from '../components/StatusBadge';
import ContractUploader from '../components/ContractUploader';

export default function Dashboard({ onViewContract }) {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const socket = useSocket();

  // Dynamic Metrics Evaluation Engine
  const totalDocs = contracts.length;
  const pendingCount = contracts.filter(c => c.processingStatus === 'PROCESSING' || c.processingStatus === 'PENDING').length;
  const threatCount = contracts.filter(c => c.alertState).length;

  useEffect(() => {
    async function loadInitialData() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/contracts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setContracts(data);
        }
      } catch (err) {
        console.error("Initial fetch failure:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('contract-status-updated', (update) => {
      setContracts((prevContracts) => {
        const exists = prevContracts.some(c => c.id === update.contractId);
        if (!exists) return prevContracts;
        return prevContracts.map((c) =>
          c.id === update.contractId 
            ? { ...c, processingStatus: update.status, ...update.contract } 
            : c
        );
      });
    });
    return () => socket.off('contract-status-updated');
  }, [socket]);

  const handleNewUpload = (newContract) => {
    setContracts((prev) => [newContract, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="animate-spin h-8 w-8 text-indigo-600 border-2 border-indigo-600 border-t-transparent rounded-full" />
        <div className="text-sm font-medium text-slate-500 tracking-wide">Hydrating distributed layout arrays...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header Panel */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Repository Workspace</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor real-time asynchronous data background extractions and compliance markers.</p>
      </div>

      {/* 🚀 NEW: Executive Analytical Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Documents</span>
          <span className="text-4xl font-extrabold text-slate-900 mt-2">{totalDocs}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Processing</span>
          <span className={`text-4xl font-extrabold mt-2 ${pendingCount > 0 ? 'text-indigo-600' : 'text-slate-900'}`}>
            {pendingCount}
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Threat Blocks</span>
          <span className={`text-4xl font-extrabold mt-2 ${threatCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
            {threatCount}
          </span>
        </div>
      </div>

      {/* Interactive Storage Dropzone */}
      <div className="shadow-sm rounded-2xl overflow-hidden">
        <ContractUploader onUploadSuccess={handleNewUpload} />
      </div>

      {/* Data Layout Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {contracts.length === 0 ? (
          /* 🚀 NEW: Dynamic Polished Empty State Layout */
          <div className="text-center py-20 px-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 font-bold text-lg mb-4">📑</div>
            <h3 className="text-sm font-bold text-slate-900">No documents cataloged</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">Drag and drop your first commercial execution layout PDF up above to trigger the background analytics thread.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50/70 font-semibold text-slate-500 uppercase tracking-wider text-xs border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4.5">Document Path</th>
                  <th className="px-6 py-4.5">Pipeline Status</th>
                  <th className="px-6 py-4.5">Notice Deadline</th>
                  <th className="px-6 py-4.5">Threat Matrix</th>
                  <th className="px-6 py-4.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-indigo-50/20 transition-colors duration-150">
                    <td className="px-6 py-4 font-semibold text-slate-800">{contract.file_name || 'System Doc'}</td>
                    <td className="px-6 py-4"><StatusBadge status={contract.processingStatus} /></td>
                    <td className="px-6 py-4 text-slate-500">
                      {contract.noticeDeadline ? new Date(contract.noticeDeadline).toLocaleDateString() : <span className="text-slate-300 italic text-xs">Awaiting Extraction</span>}
                    </td>
                    <td className="px-6 py-4">
                      {contract.alertState ? (
                        <span className="text-xs px-2.5 py-0.5 font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-100 shadow-sm shadow-rose-50">
                          {contract.alertState}
                        </span>
                      ) : <span className="text-slate-400 text-xs flex items-center gap-1">✓ Clear</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onViewContract(contract.id)} 
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900 transition-all"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

export default function ContractDetail({ contractId, onBack }) {
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/contracts/${contractId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setContract(data);
        }
      } catch (err) {
        console.error("Failed to load contract details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetails();
  }, [contractId]);

  const handleDecision = async (decisionType) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/contracts/${contractId}/decision`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ renewalDecision: decisionType })
      });
      if (res.ok) {
        const updated = await res.json();
        setContract(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="animate-spin h-8 w-8 text-indigo-600 border-2 border-indigo-600 border-t-transparent rounded-full" />
        <div className="text-sm font-medium text-slate-500 tracking-wide">Loading contract details...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Contract not found.</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 font-semibold text-sm">&larr; Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start"
        >
          &larr; Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
          {contract.title || 'Document Review'}
        </h1>
        <p className="text-xs text-slate-400">ID: {contract.id}</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT — Raw Text */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-240px)] min-h-[500px]">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Extracted Text</span>
            <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 font-semibold text-indigo-700">
              {contract.rawText ? `${contract.rawText.split(/\s+/).length} words` : 'Empty'}
            </span>
          </div>
          <div className="p-6 overflow-y-auto flex-1 bg-slate-950 font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
            {contract.rawText || (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 font-sans italic text-center gap-2">
                <span>No text extracted yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Metadata + Actions */}
        <div className="space-y-6">

          {/* Extracted Fields */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Extracted Fields
            </h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Title', value: contract.title },
                { label: 'Vendor', value: contract.vendorName },
                { label: 'Type', value: contract.contractType },
                { label: 'Total Value', value: contract.totalValue ? `${contract.currency} ${contract.totalValue.toLocaleString()}` : null },
                { label: 'Start Date', value: contract.startDate ? new Date(contract.startDate).toLocaleDateString() : null },
                { label: 'End Date', value: contract.endDate ? new Date(contract.endDate).toLocaleDateString() : null },
                { label: 'Notice Required', value: contract.noticeRequiredDays ? `${contract.noticeRequiredDays} days` : null },
                { label: 'Notice Deadline', value: contract.noticeDeadline ? new Date(contract.noticeDeadline).toLocaleDateString() : null },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="block text-xs font-medium text-slate-400">{label}</span>
                  <span className="font-semibold text-slate-800">{value || 'Unresolved'}</span>
                </div>
              ))}
              <div>
                <span className="block text-xs font-medium text-slate-400">Auto Renews</span>
                <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded border ${
                  contract.autoRenews
                    ? 'bg-amber-50 border-amber-100 text-amber-700'
                    : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                  {contract.autoRenews ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded border ${
                  contract.alertState === 'ACKNOWLEDGED '? 'bg-emerald-50 border-emerald-100 text-emerald-700': contract.alertState !== 'MONITORING'? 'bg-rose-50 border-rose-100 text-rose-700': 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                  {contract.alertState || 'MONITORING'}
                </span>
              </div>
            </div>
          </div>

          {/* Lifecycle Actions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              Lifecycle Actions
            </h3>
            {contract.renewalDecision ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl text-xs leading-relaxed border ${
                  contract.renewalDecision === 'RENEW'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-amber-50 border-amber-100 text-amber-800'
                }`}>
                  <p className="font-semibold mb-1">Decision Made</p>
                  Flagged as <span className="font-bold uppercase">{contract.renewalDecision}</span>.
                </div>
                <button
                  disabled={isSaving}
                  onClick={() => handleDecision(null)}
                  className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Change Decision'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  disabled={isSaving}
                  onClick={() => handleDecision('RENEW')}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Renew Contract'}
                </button>
                <button
                  disabled={isSaving}
                  onClick={() => handleDecision('TERMINATE')}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Terminate Contract'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
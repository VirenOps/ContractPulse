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
        <div className="text-sm font-medium text-slate-500 tracking-wide">Loading extracted asset strings...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Document record could not be located.</p>
        <button onClick={onBack} className="mt-4 text-indigo-600 font-semibold text-sm">&larr; Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button and Header */}
      <div className="flex flex-col gap-2">
        <button 
          onClick={onBack} 
          className="text-slate-500 hover:text-slate-800 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors self-start"
        >
          &larr; Return to Workspace
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{contract.file_name || 'Document Review'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Database Asset Reference: #{contract.id}</p>
          </div>
        </div>
      </div>

      {/* Main Review Workspace Core */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Deep Document Text Content Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-240px)] min-h-[500px]">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parsed Extracted Text Stream</span>
            <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 font-semibold text-indigo-700">
              {contract.rawText ? `${contract.rawText.split(/\s+/).length} Words Parsed` : 'Empty Content'}
            </span>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 bg-slate-950 font-mono text-sm leading-relaxed text-slate-300 antialiased whitespace-pre-wrap selection:bg-indigo-500/30 select-all selection:text-white">
            {contract.rawText || (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 font-sans italic text-center gap-2">
                <span>⚠️ Document parsing cycle has not populated text fields yet.</span>
                <span className="text-xs not-italic">Verify your backend text-extraction or OCR worker threads are running.</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Structural Metadata & Insight Panels */}
        <div className="space-y-6">
          
          {/* Insights Metrics Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Analysis Extracted Fields</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-xs font-medium text-slate-400">Notice/Termination Deadline</span>
                <span className="font-semibold text-slate-800">
                  {contract.noticeDeadline ? new Date(contract.noticeDeadline).toLocaleDateString() : 'Unresolved'}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-400">Threat Evaluation State</span>
                <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded mt-0.5 border ${
                  contract.alertState 
                    ? 'bg-rose-50 border-rose-100 text-rose-700' 
                    : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                }`}>
                  {contract.alertState ? contract.alertState : '✓ Low Risk/Clear'}
                </span>
              </div>
            </div>
          </div>

          {/* Business Lifecycle Execution Action Box */}
<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Lifecycle Actions</h3>
  
  {contract.renewalDecision ? (
    /* 🚀 UPDATED: Interactive Resolution State with Change Support */
    <div className="space-y-4">
      <div className={`p-4 rounded-xl text-xs leading-relaxed border ${
        contract.renewalDecision === 'RENEW' 
          ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
          : 'bg-amber-50 border-amber-100 text-amber-800'
      }`}>
        <p className="font-semibold mb-1">Resolution Active</p>
        Document case is flagged as <span className="font-bold uppercase underline">{contract.renewalDecision}</span>. 
        Background escalation cron lines have been bypassed.
      </div>
      
      {/* Reopen Action Loop Trigger */}
      <button
        disabled={isSaving}
        onClick={() => handleDecision(null)} // 🚀 Sending 'null' clears the choice in the DB
        className="w-full text-center border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
      >
        {isSaving ? 'Reopening File...' : 'Modify Operational Choice'}
      </button>
    </div>
  ) : (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 leading-relaxed">
        No definitive operational choice has been committed yet. Select an option below to clear execution queues.
      </p>
      <div className="space-y-2">
        <button 
          disabled={isSaving} 
          onClick={() => handleDecision('RENEW')} 
          className="w-full bg-slate-950 hover:bg-slate-800 text-white py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
        >
          Confirm & Execute Renewal
        </button>
        <button 
          disabled={isSaving} 
          onClick={() => handleDecision('TERMINATE')} 
          className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
        >
          Send Intent to Terminate
        </button>
      </div>
    </div>
  )}
</div>
          </div>

        </div>
      </div>
    </div>
  );
}
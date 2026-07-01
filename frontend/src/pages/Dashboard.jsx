import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import ContractUploader from '../components/ContractUploader';

const STATUS_CONFIG = {
  PROCESSED:  { label: 'Processed',  dot: '#22c55e', bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  PROCESSING: { label: 'Processing', dot: '#f59e0b', bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  PENDING:    { label: 'Pending',    dot: '#94a3b8', bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
  FAILED:     { label: 'Failed',     dot: '#ef4444', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
}

const ALERT_CONFIG = {
  MONITORING:   { label: '✓ Clear',      bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  ALERT_L1:     { label: '⚠ L1 Warning', bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  ALERT_L2:     { label: '▲ L2 Urgent',  bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  ALERT_L3:     { label: '✕ L3 Critical',bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  ACKNOWLEDGED: { label: '✓ Resolved',   bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
}

const FILTERS = ['ALL', 'UNATTENDED', 'RENEWED', 'TERMINATED']

export default function Dashboard({ onViewContract }) {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const socket = useSocket();

  const total      = contracts.length
  const processing = contracts.filter(c => c.processingStatus === 'PENDING' || c.processingStatus === 'PROCESSING').length
  const expiringSoon = contracts.filter(c => {
    if (!c.noticeDeadline) return false
    const days = (new Date(c.noticeDeadline) - Date.now()) / 86400000
    return days <= 90 && days > 0
  }).length
  const resolved = contracts.filter(c => c.renewalDecision).length

  const filteredContracts = contracts.filter(c => {
    if (filter === 'ALL')        return true
    if (filter === 'UNATTENDED') return c.alertState === 'MONITORING' && !c.renewalDecision
    if (filter === 'RENEWED')    return c.renewalDecision === 'RENEW'
    if (filter === 'TERMINATED') return c.renewalDecision === 'TERMINATE'
    return true
  })

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/contracts', { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) setContracts(await res.json())
      } catch (e) { console.error(e) }
      finally { setIsLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    if (!socket) return
    socket.on('contract-status-updated', (update) => {
      setContracts(prev => prev.map(c =>
        c.id === update.contractId ? { ...c, processingStatus: update.status, ...update.contract } : c
      ))
    })
    return () => socket.off('contract-status-updated')
  }, [socket])

  const handleNewUpload = (c) => setContracts(prev => [c, ...prev])

  const daysUntil = (date) => {
    if (!date) return null
    return Math.ceil((new Date(date) - Date.now()) / 86400000)
  }

  if (isLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <span style={{ color:'#94a3b8', fontSize:13 }}>Loading contracts...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px', fontFamily:'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:28, fontWeight:700, color:'#0f172a', margin:0, letterSpacing:-0.5 }}>
          Contract Dashboard
        </h1>
        <p style={{ fontSize:14, color:'#64748b', marginTop:6 }}>
          Track renewals, deadlines, and escalation alerts across all vendor agreements.
        </p>
      </div>

      {/* Metric Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:32 }}>
        {[
          { label:'Total Contracts', value: total,       accent:'#6366f1', sub:'all documents' },
          { label:'Processing',      value: processing,  accent:'#f59e0b', sub:'in pipeline' },
          { label:'Expiring Soon',   value: expiringSoon,accent:'#ef4444', sub:'within 90 days' },
          { label:'Resolved',        value: resolved,    accent:'#22c55e', sub:'decision made' },
        ].map(({ label, value, accent, sub }) => (
          <div key={label} style={{
            background:'#fff', border:'1px solid #e2e8f0', borderRadius:16,
            padding:'20px 24px', position:'relative', overflow:'hidden'
          }}>
            <div style={{
              position:'absolute', top:0, left:0, right:0, height:3,
              background: accent, borderRadius:'16px 16px 0 0'
            }} />
            <div style={{ fontSize:12, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8 }}>
              {label}
            </div>
            <div style={{ fontSize:36, fontWeight:800, color:'#0f172a', margin:'8px 0 4px', lineHeight:1 }}>
              {value}
            </div>
            <div style={{ fontSize:12, color:'#cbd5e1' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Uploader */}
      <div style={{
        border:'2px dashed #e2e8f0', borderRadius:16, marginBottom:32,
        background:'#fafafa', transition:'border-color 0.2s'
      }}>
        <ContractUploader onUploadSuccess={handleNewUpload} />
      </div>

      {/* Filter Bar + Table */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, overflow:'hidden' }}>

        {/* Filter Tabs */}
        <div style={{
          display:'flex', alignItems:'center', gap:4, padding:'16px 20px',
          borderBottom:'1px solid #f1f5f9', background:'#fafafa'
        }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'6px 16px', borderRadius:8, border:'none', cursor:'pointer',
              fontSize:12, fontWeight:600, letterSpacing:0.3,
              background: filter === f ? '#0f172a' : 'transparent',
              color: filter === f ? '#fff' : '#64748b',
              transition:'all 0.15s'
            }}>
              {f}
            </button>
          ))}
          <div style={{ marginLeft:'auto', fontSize:12, color:'#94a3b8' }}>
            {filteredContracts.length} contract{filteredContracts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Table */}
        {filteredContracts.length === 0 ? (
          <div style={{ padding:'60px 20px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📄</div>
            <div style={{ fontSize:14, fontWeight:600, color:'#334155' }}>No contracts here</div>
            <div style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>
              {filter === 'ALL' ? 'Upload your first contract above.' : `No contracts match the "${filter}" filter.`}
            </div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #f1f5f9' }}>
                {['Contract', 'Vendor', 'Value', 'Notice Deadline', 'Status', 'Alert', 'Action'].map(h => (
                  <th key={h} style={{
                    padding:'12px 20px', textAlign:'left', fontSize:11,
                    fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.8
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((c, i) => {
                const days = daysUntil(c.noticeDeadline)
                const status = STATUS_CONFIG[c.processingStatus] || STATUS_CONFIG.PENDING
                const alert  = ALERT_CONFIG[c.alertState] || ALERT_CONFIG.MONITORING
                const isUrgent = days !== null && days <= 30

                return (
                  <tr key={c.id} style={{
                    borderBottom: i < filteredContracts.length - 1 ? '1px solid #f8fafc' : 'none',
                    background: isUrgent ? '#fff5f5' : '#fff',
                    transition:'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isUrgent ? '#fee2e2' : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = isUrgent ? '#fff5f5' : '#fff'}
                  >
                    {/* Contract Name */}
                    <td style={{ padding:'16px 20px' }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>
                        {c.title || 'Untitled Contract'}
                      </div>
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
                        {c.contractType || 'Unknown type'}
                      </div>
                    </td>

                    {/* Vendor */}
                    <td style={{ padding:'16px 20px' }}>
                      <div style={{ fontSize:13, color:'#334155' }}>{c.vendorName || '—'}</div>
                    </td>

                    {/* Value */}
                    <td style={{ padding:'16px 20px' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#334155' }}>
                        {c.totalValue ? `${c.currency || 'INR'} ${Number(c.totalValue).toLocaleString()}` : '—'}
                      </div>
                    </td>

                    {/* Notice Deadline */}
                    <td style={{ padding:'16px 20px' }}>
                      {c.noticeDeadline ? (
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color: isUrgent ? '#dc2626' : '#334155' }}>
                            {new Date(c.noticeDeadline).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize:11, color: isUrgent ? '#ef4444' : '#94a3b8', marginTop:2 }}>
                            {days === 0 ? 'Today' : days > 0 ? `${days} days left` : `${Math.abs(days)} days overdue`}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize:12, color:'#cbd5e1', fontStyle:'italic' }}>Not extracted</span>
                      )}
                    </td>

                    {/* Pipeline Status */}
                    <td style={{ padding:'16px 20px' }}>
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap:6,
                        padding:'4px 10px', borderRadius:20,
                        background: status.bg, border:`1px solid ${status.border}`,
                        fontSize:11, fontWeight:600, color: status.text
                      }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background: status.dot, flexShrink:0 }} />
                        {status.label}
                      </span>
                    </td>

                    {/* Alert State */}
                    <td style={{ padding:'16px 20px' }}>
                      <span style={{
                        display:'inline-block', padding:'4px 10px', borderRadius:6,
                        background: alert.bg, border:`1px solid ${alert.border}`,
                        fontSize:11, fontWeight:700, color: alert.text
                      }}>
                        {alert.label}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding:'16px 20px' }}>
                      <button
                        onClick={() => onViewContract(c.id)}
                        style={{
                          padding:'7px 16px', borderRadius:8, border:'1px solid #e2e8f0',
                          background:'#fff', color:'#334155', fontSize:12, fontWeight:600,
                          cursor:'pointer', transition:'all 0.15s'
                        }}
                        onMouseEnter={e => { e.target.style.background='#0f172a'; e.target.style.color='#fff'; e.target.style.borderColor='#0f172a' }}
                        onMouseLeave={e => { e.target.style.background='#fff'; e.target.style.color='#334155'; e.target.style.borderColor='#e2e8f0' }}
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
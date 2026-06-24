import React from 'react';

export default function StatusBadge({ status }) {
  const config = {
    PENDING: {
      bg: 'bg-gray-100 border-gray-200 text-gray-800',
      label: 'Queued',
      icon: <span className="h-2 w-2 rounded-full bg-gray-400" />
    },
    PROCESSING: {
      bg: 'bg-blue-50 border-blue-200 text-blue-700',
      label: 'Analyzing...',
      icon: (
        <svg className="animate-spin h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )
    },
    PROCESSED: {
      bg: 'bg-green-50 border-green-200 text-green-700',
      label: 'Success',
      icon: <span className="h-2 w-2 rounded-full bg-green-500" />
    },
    FAILED: {
      bg: 'bg-red-50 border-red-200 text-red-700',
      label: 'Pipeline Failed',
      icon: <span className="h-2 w-2 rounded-full bg-red-500" />
    }
  };

  const current = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg}`}>
      {current.icon}
      {current.label}
    </span>
  );
}
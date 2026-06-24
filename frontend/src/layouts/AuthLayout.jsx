import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <span className="inline-flex h-12 w-12 rounded-xl bg-indigo-600 items-center justify-center text-white font-bold text-xl mb-4">C</span>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">ContractPulse</h2>
        <p className="mt-2 text-sm text-slate-400">Continuous risk extraction and lifecycle automation.</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
          {children}
        </div>
      </div>
    </div>
  );
}
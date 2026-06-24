import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function MainLayout({ children }) {
  const { logout, user } = useAuth();
  const socket = useSocket();
  
  // Track if socket is actively connected to the server room
  const isConnected = socket?.connected ?? false;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Brand Flag */}
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-indigo-200">
              C
            </span>
            <span className="font-bold tracking-tight text-slate-900 text-lg">ContractPulse</span>
          </div>

          {/* Infrastructure Health & Session Matrix */}
          <div className="flex items-center gap-6 text-sm">
            
            {/* Live Socket Connection Monitor */}
            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-full border border-slate-200 text-xs text-slate-600 font-medium">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              {isConnected ? 'Engine Sync Active' : 'Connecting...'}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-slate-500">
              <span className="font-medium text-slate-700">{user?.name || 'Operator'}</span>
            </div>

            <span className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Practical Session Terminate Button */}
            <button 
              onClick={logout}
              className="text-slate-500 hover:text-rose-600 font-medium transition-colors text-xs uppercase tracking-wider"
            >
              Sign Out
            </button>
          </div>

        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-fadeIn">
        {children}
      </main>
    </div>
  );
}
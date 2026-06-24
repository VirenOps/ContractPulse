import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { login } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState(''); // 🚀 New tracking state for user's name
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/register';
    
    // 🚀 Include 'name' in the registration payload to satisfy your backend check!
    const payload = isLoginView 
      ? { email, password } 
      : { companyName, name, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Fallback to data.error if your backend sends { error: '...' } instead of { message: '...' }
        throw new Error(data.error || data.message || 'Authentication lifecycle error.');
      }

      if (data.token) {
        login(data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900 mb-2">
        {isLoginView ? 'Welcome Back' : 'Create Business Account'}
      </h3>
      
      {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg">{error}</div>}

      {/* 🚀 Render registration-only inputs */}
      {!isLoginView && (
        <>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Organization Name</label>
            <input required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-600" placeholder="Acme Corp" />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase">Full Name</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-600" placeholder="John Doe" />
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase">Work Email</label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-600" placeholder="you@company.com" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase">Password</label>
        <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-indigo-600" placeholder="••••••••" />
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium text-sm transition disabled:opacity-50">
        {isSubmitting ? 'Authenticating...' : isLoginView ? 'Sign In' : 'Register Workspace'}
      </button>

      <div className="text-center pt-2">
        <button type="button" onClick={() => setIsLoginView(!isLoginView)} className="text-xs text-indigo-600 hover:underline">
          {isLoginView ? "Don't have an account? Sign up" : 'Already configured? Log in'}
        </button>
      </div>
    </form>
  );
}
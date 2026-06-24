import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ContractDetail from './pages/ContractDetail';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [currentContractId, setCurrentContractId] = useState(null);

  // Unauthenticated user flow
  if (!isAuthenticated) {
    return (
      <AuthLayout>
        <Auth />
      </AuthLayout>
    );
  }

  // Authenticated workspace dashboard engine
  return (
    <SocketProvider companyId={user?.companyId}>
      <MainLayout>
        {currentContractId ? (
          <ContractDetail 
            contractId={currentContractId} 
            onBack={() => setCurrentContractId(null)} 
          />
        ) : (
          <Dashboard 
            onViewContract={(id) => setCurrentContractId(id)} 
          />
        )}
      </MainLayout>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
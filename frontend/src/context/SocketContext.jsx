import React, { createContext, useContext } from 'react';

// 1. Keep the context definition intact
const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  // 🚫 All connection logic (io, useEffect, setSocket) has been completely stripped out.
  // This provider now acts as a silent pass-through wrapper.
  return (
    <SocketContext.Provider value={null}>
      {children}
    </SocketContext.Provider>
  );
}

// 2. Safely return null so components calling useSocket() don't crash
export const useSocket = () => useContext(SocketContext);
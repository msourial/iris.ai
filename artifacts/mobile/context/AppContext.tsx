import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FlowUser {
  addr: string;
  loggedIn: boolean;
}

interface AppContextType {
  isAuthenticated: boolean;
  user: FlowUser | null;
  login: (user: FlowUser) => void;
  logout: () => void;
  aiResult: string | null;
  setAiResult: (text: string | null) => void;
  capturedImageBase64: string | null;
  setCapturedImageBase64: (b64: string | null) => void;
  blockchainStatus: 'idle' | 'uploading' | 'minting' | 'done' | 'error';
  setBlockchainStatus: (status: 'idle' | 'uploading' | 'minting' | 'done' | 'error') => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<FlowUser | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [blockchainStatus, setBlockchainStatus] = useState<'idle' | 'uploading' | 'minting' | 'done' | 'error'>('idle');

  const login = (flowUser: FlowUser) => {
    setUser(flowUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setAiResult(null);
    setCapturedImageBase64(null);
    setBlockchainStatus('idle');
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        aiResult,
        setAiResult,
        capturedImageBase64,
        setCapturedImageBase64,
        blockchainStatus,
        setBlockchainStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

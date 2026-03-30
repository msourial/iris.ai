import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FlowUser {
  addr: string;
  loggedIn: boolean;
}

export type UserRole = 'blind' | 'volunteer' | null;

interface AppContextType {
  isAuthenticated: boolean;
  user: FlowUser | null;
  login: (user: FlowUser) => void;
  logout: () => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  aiResult: string | null;
  setAiResult: (text: string | null) => void;
  aiDescriptionHash: string | null;
  setAiDescriptionHash: (hash: string | null) => void;
  imageCid: string | null;
  setImageCid: (cid: string | null) => void;
  currentRequestId: string | null;
  setCurrentRequestId: (id: string | null) => void;
  capturedImageBase64: string | null;
  setCapturedImageBase64: (b64: string | null) => void;
  blockchainStatus: 'idle' | 'uploading' | 'minting' | 'done' | 'error';
  setBlockchainStatus: (status: 'idle' | 'uploading' | 'minting' | 'done' | 'error') => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<FlowUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiDescriptionHash, setAiDescriptionHash] = useState<string | null>(null);
  const [imageCid, setImageCid] = useState<string | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [blockchainStatus, setBlockchainStatus] = useState<'idle' | 'uploading' | 'minting' | 'done' | 'error'>('idle');

  const login = (flowUser: FlowUser) => {
    setUser(flowUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setRole(null);
    setAiResult(null);
    setAiDescriptionHash(null);
    setImageCid(null);
    setCurrentRequestId(null);
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
        role,
        setRole,
        aiResult,
        setAiResult,
        aiDescriptionHash,
        setAiDescriptionHash,
        imageCid,
        setImageCid,
        currentRequestId,
        setCurrentRequestId,
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

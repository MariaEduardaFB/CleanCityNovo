import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LocalUser } from '@/services/local-auth.service';
import { onAuthStateChangeLocal } from '@/services/local-auth.service';

interface LocalAuthContextType {
  user: LocalUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const LocalAuthContext = createContext<LocalAuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
});

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener de mudanças no estado de autenticação
    const unsubscribe = onAuthStateChangeLocal((user) => {
      console.log('🔐 Auth state changed (local):', user ? user.email : 'No user');
      setUser(user);
      setLoading(false);
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <LocalAuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </LocalAuthContext.Provider>
  );
}

export function useLocalAuth() {
  const context = useContext(LocalAuthContext);
  if (context === undefined) {
    throw new Error('useLocalAuth must be used within a LocalAuthProvider');
  }
  return context;
}

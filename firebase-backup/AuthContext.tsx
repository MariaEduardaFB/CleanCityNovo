import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, getCurrentUser } from '@/services/auth.service';
import { setupConnectivityListener, fullSync } from '@/services/sync.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener de mudanças no estado de autenticação
    const unsubscribeAuth = onAuthStateChange((user) => {
      console.log('🔐 Auth state changed:', user ? user.email : 'No user');
      setUser(user);
      setLoading(false);

      // Se usuário logou, sincroniza dados
      if (user) {
        fullSync().catch(error => {
          console.error('Erro na sincronização inicial:', error);
        });
      }
    });

    // Listener de mudanças na conectividade
    const unsubscribeConnectivity = setupConnectivityListener();

    // Cleanup
    return () => {
      unsubscribeAuth();
      unsubscribeConnectivity();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

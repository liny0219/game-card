import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { useDataAdapter } from './DataContext';

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserContextProviderProps {
  children: ReactNode;
}

export function UserContextProvider({ children }: UserContextProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const dataAdapter = useDataAdapter();

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      let user = await dataAdapter.getCurrentUser();
      // For admin panel, we don't create a default user.
      // We might want to just show a login screen or a user selector in the future.
      if (!user) {
        console.warn("No current user found. Admin functions might be limited.");
      }
      setUser(user);
    } catch (err) {
      console.error("Failed to initialize user:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = (user: User) => {
    setUser(user);
  };

  const logout = async () => {
    try {
      await dataAdapter.logout();
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const updatedUser = await dataAdapter.getUser(user.id);
      if (updatedUser) {
        // 更新用户统计信息（从历史记录聚合）
        await dataAdapter.updateUserStatisticsFromHistory(updatedUser);
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserContextProvider');
  }
  return context;
} 
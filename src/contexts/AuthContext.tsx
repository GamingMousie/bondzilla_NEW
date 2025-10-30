
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type UserProfile = 'Warehouse' | 'Office' | 'TCB' | 'Cardinal';

interface User {
  profile: UserProfile;
  permissions: string[];
  companyFilter?: 'TCB' | 'Cardinal Maritime';
  startPage: string;
}

const ROLES: Record<UserProfile, User> = {
  Warehouse: {
    profile: 'Warehouse',
    permissions: ['/','/shipments', '/calendar', '/quiz/stock-check', '/quiz/reports'],
    startPage: '/calendar',
  },
  Office: {
    profile: 'Office',
    permissions: ['/','/shipments', '/calendar', '/reports', '/labels/generate-shipment-labels', '/quiz/stock-check', '/quiz/reports'],
    startPage: '/',
  },
  TCB: {
    profile: 'TCB',
    permissions: ['/', '/shipments', '/reports'],
    companyFilter: 'TCB',
    startPage: '/',
  },
  Cardinal: {
    profile: 'Cardinal',
    permissions: ['/', '/shipments', '/reports'],
    companyFilter: 'Cardinal Maritime',
    startPage: '/',
  },
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, pass: string) => User;
  logout: () => void;
  hasAccess: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const isLoginPage = pathname === '/login';
    const isAllowedPage = hasAccess(pathname);

    if (!user && !isLoginPage) {
      router.push('/login');
    } else if (user && (isLoginPage || !isAllowedPage)) {
      if (isLoginPage) {
        router.push(user.startPage);
      } else if (!isAllowedPage) {
        // Redirect to their start page if they try to access a forbidden page
        router.push(user.startPage);
      }
    }
  }, [user, pathname, router]);

  const login = (username: string, pass: string): User => {
    const profileKey = Object.keys(ROLES).find(
      (key) => key.toLowerCase() === username.toLowerCase()
    ) as UserProfile | undefined;

    if (profileKey && username.toLowerCase() === pass.toLowerCase()) {
      const userData = ROLES[profileKey];
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error('Invalid profile name or password.');
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const hasAccess = (path: string): boolean => {
    if (!user) return path === '/login';
    // Allow access to dynamic sub-paths if the base path is permitted
    // e.g., if '/trailers' is allowed, so is '/trailers/123'
    return user.permissions.some(p => path.startsWith(p));
  };


  const value = { user, isAuthenticated: !!user, login, logout, hasAccess };

  return (
    <AuthContext.Provider value={value}>
        {!user && pathname !== '/login' ? null : children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

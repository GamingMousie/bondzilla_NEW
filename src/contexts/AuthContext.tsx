
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

// Defines the roles and their specific permissions and configurations.
// Note: Customer roles (TCB, Cardinal) have a `companyFilter` which is used
// to restrict the data they can see.
const ROLES: Record<string, User> = {
  warehouse: {
    profile: 'Warehouse',
    permissions: ['/', '/shipments', '/calendar', '/quiz/stock-check'],
    startPage: '/calendar',
  },
  office: {
    profile: 'Office',
    permissions: ['/','/shipments', '/calendar', '/reports', '/labels/generate-shipment-labels', '/quiz/stock-check', '/quiz/reports'],
    startPage: '/',
  },
  tcb: {
    profile: 'TCB',
    permissions: ['/', '/shipments', '/reports'],
    companyFilter: 'TCB',
    startPage: '/',
  },
  cardinal: {
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

  const hasAccess = (path: string): boolean => {
    if (!user) return path === '/login';
    
    // Allow access to dynamic sub-routes.
    const allowedBasePathsWithDynamicChildren = ['/loads', '/shipments', '/quiz/reports', '/reports'];
    for (const basePath of allowedBasePathsWithDynamicChildren) {
      if (path.startsWith(`${basePath}/`) && user.permissions.includes(basePath)) {
        return true;
      }
    }
    
    // Exact match for base routes (e.g., '/reports', '/calendar')
    return user.permissions.includes(path);
  };

  useEffect(() => {
    const isLoginPage = pathname === '/login';
    
    if (!user && !isLoginPage) {
      router.push('/login');
    } else if (user) {
      const isAllowedPage = hasAccess(pathname);
      if (isLoginPage) {
        router.push(user.startPage);
      } else if (!isAllowedPage) {
        // Redirect to their start page if they try to access a forbidden page
        router.push(user.startPage);
      }
    }
  }, [user, pathname, router]);

  const login = (username: string, pass: string): User => {
    const profileKey = username.toLowerCase();

    // Password is the same as the profile name (case-insensitive)
    if (ROLES[profileKey] && profileKey === pass.toLowerCase()) {
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

  const value = { user, isAuthenticated: !!user, login, logout, hasAccess };

  // This prevents a flash of the login-required content while the app is booting
  // and checking for a stored user session.
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

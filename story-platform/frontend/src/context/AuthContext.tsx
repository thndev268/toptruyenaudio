import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { UserRole, UserTitle } from '../types';
import { supabase } from '../lib/supabase';
import { adminRepository } from '../services/repositories/AdminRepository';
import { apiRequest } from '../services/apiClient';

export { UserRole };

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  accountStatus?: string;
  isPremium?: boolean;
  membership?: {
    tier: 'FREE' | 'PREMIUM';
    subscriptionStatus: string;
    planId?: string;
    startedAt?: string;
    expiresAt?: string;
  };
  honoraryTitles?: UserTitle[];
}

interface AuthContextType {
  role: UserRole | 'GUEST';
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBanned: boolean;
  banReason: string;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password?: string, username?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  switchRole: (role: UserRole | 'GUEST') => void;
  updateUser: (updatedFields: Partial<UserProfile>) => void;
  devModeRoleOverride: boolean;
  setDevModeRoleOverride: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authData, setAuthData] = useState<{ role: UserRole | 'GUEST'; user: UserProfile | null }>({ role: 'GUEST', user: null });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [devModeRoleOverride, setDevModeRoleOverride] = useState<boolean>(false);
  const [isBanned, setIsBanned] = useState<boolean>(false);
  const [banReason, setBanReason] = useState<string>('');
  
  // Track last fetched session to prevent duplicate calls
  const lastFetchedSessionRef = useRef<string | null>(null);

  const checkBannedStatus = useCallback((profile: UserProfile | null) => {
    if (!profile) {
      setIsBanned(false);
      setBanReason('');
      return;
    }
    
    // Fallback to local admin check if needed, but optimally from profile.status
    if (profile.accountStatus === 'SUSPENDED' || profile.accountStatus === 'BANNED') {
      setIsBanned(true);
      setBanReason('Tài khoản của bạn đã bị tạm khóa do vi phạm điều khoản dịch vụ.');
      return;
    }
    setIsBanned(false);
    setBanReason('');
  }, []);

  const fetchProfile = async (userId: string, email: string): Promise<UserProfile | null> => {
    // Prevent duplicate calls for the same session
    const sessionKey = `${userId}-${email}`;
    if (lastFetchedSessionRef.current === sessionKey) {
      console.log('[AuthContext] Skipping duplicate profile fetch for:', sessionKey);
      return authData.user;
    }
    
    try {
      // Fetch from backend API only
      const data = await apiRequest('/users/me');
      
      if (data) {
        lastFetchedSessionRef.current = sessionKey;
        
        let mappedRole: UserRole = UserRole.USER;
        if (data.role === 'OWNER_ADMIN' || data.role === 'ADMIN') mappedRole = UserRole.ADMIN;
        else if (data.role === 'CREATOR') mappedRole = UserRole.CREATOR;
        else if (data.role === 'PARTNER') mappedRole = UserRole.PARTNER;
        else if (data.role === 'REVIEWER') mappedRole = UserRole.REVIEWER;

        const profile: UserProfile = {
          id: data.id,
          name: data.displayName || email.split('@')[0],
          email: data.email,
          role: mappedRole,
          avatarUrl: data.avatarUrl,
          accountStatus: data.accountStatus,
          isPremium: data.membership?.tier === 'PREMIUM',
          membership: {
            tier: data.membership?.tier || 'FREE',
            subscriptionStatus: data.membership?.subscriptionStatus || 'ACTIVE',
          }
        };
        return profile;
      }
    } catch (err) {
      console.error('Backend API profile fetch failed:', err);
      // If backend fails, still return basic profile from session data
      // This ensures user is considered authenticated even if backend is down
      const basicProfile: UserProfile = {
        id: userId,
        name: email.split('@')[0],
        email: email,
        role: UserRole.USER,
        isPremium: false,
        membership: {
          tier: 'FREE',
          subscriptionStatus: 'ACTIVE',
        }
      };
      return basicProfile;
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && session.user && isMounted) {
          const profile = await fetchProfile(session.user.id, session.user.email || '');
          if (profile) {
            setAuthData({ role: profile.role, user: profile });
            checkBannedStatus(profile);
          } else {
            setAuthData({ role: 'GUEST', user: null });
          }
        } else {
          setAuthData({ role: 'GUEST', user: null });
        }
      } catch (err) {
        console.error('Failed to initialize auth', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session && session.user) {
          const profile = await fetchProfile(session.user.id, session.user.email || '');
          if (profile) {
            setAuthData({ role: profile.role, user: profile });
            checkBannedStatus(profile);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthData({ role: 'GUEST', user: null });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkBannedStatus]);

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error('Vui lòng nhập mật khẩu để đăng nhập.');
    
    // Use Supabase auth directly
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email hoặc mật khẩu không chính xác.');
      }
      throw error;
    }

    // Profile will be loaded by onAuthStateChange
  };

  const register = async (name: string, email: string, password?: string, username?: string) => {
    if (!password) throw new Error('Vui lòng nhập mật khẩu để đăng ký.');
    
    // Use Supabase auth directly
    if (!username || username.length < 3 || username.length > 30) {
      throw new Error('Tên đăng nhập phải từ 3 đến 30 ký tự.');
    }

    // Check username uniqueness
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      throw new Error('Tên đăng nhập đã tồn tại, vui lòng chọn tên khác.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          username: username,
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('Email này đã được đăng ký.');
      }
      throw error;
    }
    
    if (data?.user && data?.session === null) {
      throw new Error('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
    }
  };

  const logout = async () => {
    lastFetchedSessionRef.current = null;
    await supabase.auth.signOut();
    setAuthData({ role: 'GUEST', user: null });
  };

  const refreshUser = async () => {
    // Reset the session ref to force a fresh fetch
    lastFetchedSessionRef.current = null;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id, session.user.email || '');
      if (profile) {
        setAuthData({ role: profile.role, user: profile });
        checkBannedStatus(profile);
      }
    }
  };

  const switchRole = (newRole: UserRole | 'GUEST') => {
    if (newRole === 'GUEST') {
      logout();
      return;
    }
    if (authData.user) {
      const updatedUser = { ...authData.user, role: newRole as UserRole };
      setAuthData({ role: newRole, user: updatedUser });
    }
  };

  const updateUser = (updatedFields: Partial<UserProfile>) => {
    if (!authData.user) return;
    const updatedUser = { ...authData.user, ...updatedFields };
    setAuthData({ ...authData, user: updatedUser });
  };

  const role = authData.role;
  const user = authData.user;
  const isAuthenticated = role !== 'GUEST' && !!user;

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        isAuthenticated,
        isLoading,
        isBanned,
        banReason,
        login,
        logout,
        register,
        refreshUser,
        switchRole,
        updateUser,
        devModeRoleOverride,
        setDevModeRoleOverride,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

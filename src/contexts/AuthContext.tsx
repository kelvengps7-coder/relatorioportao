import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isVisualizador: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canSave: boolean;
  canManageStock: boolean;
  canManageOrders: boolean;
  canAccessReports: boolean;
  signIn: (emailOrUsername: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, full_name: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const cleanupAuthState = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to prevent deadlocks
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      let email = emailOrUsername;
      
      // Check if the input is a username (not an email)
      if (!emailOrUsername.includes('@')) {
        // Find the user by username to get their email
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('username', emailOrUsername)
          .single();
        
        if (profileError || !profileData) {
          throw new Error('Usuário não encontrado');
        }
        
        // Get the user's email from auth.users table
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileData.user_id);
        
        if (userError || !userData.user) {
          throw new Error('Usuário não encontrado');
        }
        
        email = userData.user.email || '';
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Log successful login
        try {
          await supabase
            .from('audit_logs')
            .insert({
              user_id: data.user.id,
              action: 'login',
              table_name: 'auth',
              record_id: data.user.id,
              user_details: {
                user_id: data.user.id,
                email: data.user.email
              }
            });
        } catch (logError) {
          console.error('Error logging login action:', logError);
        }

        // Force page reload for clean state
        window.location.href = '/';
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, full_name: string, username: string) => {
    try {
      cleanupAuthState();

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name,
            username,
            role: 'user'
          }
        }
      });

      return { error };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Log logout action before signing out
      if (user && profile) {
        await supabase
          .from('audit_logs')
          .insert({
            user_id: user.id,
            action: 'logout',
            table_name: 'auth',
            record_id: user.id,
            user_details: {
              user_id: user.id,
              full_name: profile.full_name,
              username: profile.username,
              role: profile.role
            }
          });
      }

      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignore errors
      }
      
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isVisualizador = profile?.role === 'visualizador';
  const canEdit = profile?.role === 'admin' || profile?.role === 'servo de balcao';
  const canCreate = profile?.role === 'admin' || profile?.role === 'servo de balcao';
  const canDelete = profile?.role === 'admin';
  const canSave = !isVisualizador; // Visualizadores não podem salvar nada
  const canManageStock = !isVisualizador; // Visualizadores não podem gerenciar estoque
  const canManageOrders = !isVisualizador; // Visualizadores não podem gerenciar pedidos
  const canAccessReports = profile?.role === 'admin' || profile?.role === 'servo de balcao'; // Admin e servo de balcão podem acessar relatórios

  const value = {
    user,
    session,
    profile,
    loading,
    isAdmin,
    isVisualizador,
    canEdit,
    canCreate,
    canDelete,
    canSave,
    canManageStock,
    canManageOrders,
    canAccessReports,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
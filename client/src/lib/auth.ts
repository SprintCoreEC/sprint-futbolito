import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';

// Helper function to auto-load institution context
const autoLoadInstitutionContext = async (user: AuthUser) => {
  console.log('Checking auto-load for user:', { 
    institutionId: user.institutionId, 
    role: user.role 
  });
  
  if (user.institutionId && user.role && !['super_admin'].includes(user.role)) {
    try {
      // Fetch institution data
      const response = await fetch(`/api/institutions/${user.institutionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const { data: institution } = await response.json();
        if (institution) {
          // Set institution context automatically
          localStorage.setItem('selectedInstitution', JSON.stringify(institution));
          console.log('Auto-loaded institution context:', institution.name);
        }
      }
    } catch (error) {
      console.error('Error auto-loading institution context:', error);
    }
  }
};
import { User, Session } from '@supabase/supabase-js';

export interface AuthUser extends User {
  role?: string;
  institutionId?: string;
  venueIds?: string[];
  groupIds?: string[];
}

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, userData?: { firstName: string; lastName: string }) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuth = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    
    // Sign in with email and password
    login: async (email: string, password: string) => {
      try {
        set({ loading: true });
        console.log('Attempting login with:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        console.log('Login response:', { data, error });
        
        if (error) {
          console.error('Login error:', error);
          throw error;
        }
        
        if (data.user && data.session) {
          // Store token for API requests
          localStorage.setItem('token', data.session.access_token);
          
          // Extract role from user_metadata
          const authUser: AuthUser = {
            ...data.user,
            role: data.user.user_metadata?.role || 'deportista',
            institutionId: data.user.user_metadata?.institution_id,
            venueIds: data.user.user_metadata?.venue_ids || [],
            groupIds: data.user.user_metadata?.group_ids || []
          };
          
          console.log('Login successful, setting user state with role:', authUser.role);
          set({ 
            user: authUser, 
            session: data.session, 
            isAuthenticated: true, 
            loading: false 
          });
        } else {
          set({ loading: false });
          throw new Error('No user data received');
        }
      } catch (error) {
        console.error('Login catch block:', error);
        set({ loading: false });
        throw error;
      }
    },
    
    // Sign in with Google
    loginWithGoogle: async () => {
      try {
        set({ loading: true });
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        if (error) throw error;
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },
    
    // Sign up new user
    signUp: async (email: string, password: string, userData?: { firstName: string; lastName: string }) => {
      try {
        set({ loading: true });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData
          }
        });
        
        if (error) throw error;
        set({ loading: false });
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },
    
    // Logout
    logout: async () => {
      try {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, session: null, isAuthenticated: false });
      } catch (error) {
        console.error('Logout error:', error);
      }
    },
    
    // Initialize auth state
    initialize: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          localStorage.setItem('token', session.access_token);
          
          // Extract role from user_metadata during initialization
          const authUser: AuthUser = {
            ...session.user,
            role: session.user.user_metadata?.role || 'deportista',
            institutionId: session.user.user_metadata?.institution_id,
            venueIds: session.user.user_metadata?.venue_ids || [],
            groupIds: session.user.user_metadata?.group_ids || []
          };
          
          console.log('Initialize: setting user state with role:', authUser.role);
          set({ 
            user: authUser, 
            session, 
            isAuthenticated: true, 
            loading: false 
          });
          
          // Auto-load institution context for users with institution
          await autoLoadInstitutionContext(authUser);
        } else {
          set({ loading: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        set({ loading: false });
      }
    }
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({ 
      user: state.user, 
      session: state.session, 
      isAuthenticated: state.isAuthenticated 
    }),
  }
));

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  try {
    const store = useAuth.getState();
    
    if (event === 'SIGNED_IN' && session) {
      localStorage.setItem('token', session.access_token);
      
      // Extract role from user_metadata in auth state change
      const authUser: AuthUser = {
        ...session.user,
        role: session.user.user_metadata?.role || 'deportista',
        institutionId: session.user.user_metadata?.institution_id,
        venueIds: session.user.user_metadata?.venue_ids || [],
        groupIds: session.user.user_metadata?.group_ids || []
      };
      
      console.log('Auth state change: setting user with role:', authUser.role);
      useAuth.setState({ 
        user: authUser, 
        session, 
        isAuthenticated: true, 
        loading: false 
      });
      
      // Auto-load institution context for users with institution
      autoLoadInstitutionContext(authUser);
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      useAuth.setState({ 
        user: null, 
        session: null, 
        isAuthenticated: false, 
        loading: false 
      });
    }
  } catch (error) {
    console.error('Auth state change error:', error);
  }
});
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  role: 'doctor' | 'nurse' | 'finance' | 'admin' | 'pharmacy' | 'laboratory';
  hospital_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, role: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [presenceChannel, setPresenceChannel] = useState<any>(null);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    setLastActivity(Date.now());
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    if (user) {
      const timer = setTimeout(() => {
        console.log('User inactive for 30 minutes, logging out...');
        signOut();
      }, INACTIVITY_TIMEOUT);
      
      setInactivityTimer(timer);
    }
  };

  // Check for concurrent sessions
  const checkConcurrentSessions = (presenceState: any) => {
    if (!user) return;
    
    const userSessions = Object.keys(presenceState).filter(key => {
      const presence = presenceState[key];
      return presence?.[0]?.user_id === user.id;
    });
    
    // If more than one session detected, force logout
    if (userSessions.length > 1) {
      console.log('Multiple sessions detected, forcing logout for security...');
      setTimeout(() => {
        signOut();
      }, 1000);
    }
  };

  // Setup activity tracking
  useEffect(() => {
    if (user) {
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const handleActivity = () => {
        resetInactivityTimer();
      };
      
      // Add event listeners
      activityEvents.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });
      
      // Set initial timer
      resetInactivityTimer();
      
      return () => {
        // Remove event listeners
        activityEvents.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
      };
    } else {
      // Clear timer when user logs out
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        setInactivityTimer(null);
      }
    }
  }, [user]);

  // Setup presence tracking for logged in users with session enforcement
  useEffect(() => {
    if (user && profile) {
      const sessionId = `${user.id}_${Date.now()}_${Math.random()}`;
      
      const channel = supabase.channel('user_presence', {
        config: {
          presence: {
            key: sessionId,
          },
        },
      });

      channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        checkConcurrentSessions(presenceState);
      });

      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Check if another session of the same user joined
        const presenceState = channel.presenceState();
        checkConcurrentSessions(presenceState);
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            session_id: sessionId,
            username: profile.username,
            role: profile.role,
            hospital_id: profile.hospital_id,
            online_at: new Date().toISOString(),
          });
        }
      });

      setPresenceChannel(channel);

      return () => {
        channel.untrack();
        channel.unsubscribe();
      };
    } else {
      // User logged out, clean up presence
      if (presenceChannel) {
        presenceChannel.untrack();
        presenceChannel.unsubscribe();
        setPresenceChannel(null);
      }
    }
  }, [user, profile]);

  // Periodic session validation
  useEffect(() => {
    if (user && session) {
      const validateSession = async () => {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession) {
            console.log('Session expired, logging out...');
            signOut();
          }
        } catch (error) {
          console.error('Session validation error:', error);
          signOut();
        }
      };

      const interval = setInterval(validateSession, SESSION_CHECK_INTERVAL);
      
      return () => clearInterval(interval);
    }
  }, [user, session]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string, role: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          username,
          role,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        // Even if there's an error, we should clear the local state
      }
      // Clear local state regardless of API response
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even on error
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
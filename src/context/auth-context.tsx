
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  auth, 
  googleProvider, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  createQRCodeAssignment,
  type User,
  type UserProfile 
} from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUserProfile = async (user: User) => {
    try {
      let profile = await getUserProfile(user.uid);
      
      if (!profile) {
        // Create new user profile if it doesn't exist
        console.log('Creating new user profile for:', user.email);
        profile = await createUserProfile(user);
        
        // Create QR code assignment
        await createQRCodeAssignment(profile.qrCodeId, user.uid);
      } else {
        // Check if user is blocked
        if (profile.blocked) {
          console.log('User is blocked, redirecting to blocked page:', user.email);
          await signOut(auth);
          // Redirect to blocked page instead of showing alert
          window.location.href = '/blocked';
          return;
        }
        
        // Update last login time
        await updateUserProfile(user.uid, { lastLoginAt: new Date() });
        profile.lastLoginAt = new Date();
      }
      
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  useEffect(() => {
    console.log('Auth provider initialized - setting up Firebase auth');
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Auth loading timeout - setting loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      setUser(user);
      
      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
      clearTimeout(timeout);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
      clearTimeout(timeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log('Attempting Google sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful:', result.user.email);
      
      // User profile will be loaded automatically by the auth state change listener
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      // Handle specific Firebase auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('User closed the popup');
      } else if (error.code === 'auth/popup-blocked') {
        console.log('Popup blocked by browser');
      }
        setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log('Attempting to sign out...');
      await signOut(auth);
      console.log('Sign out successful');
      
      // Clear user profile data
      setUserProfile(null);
      router.push('/');
    } catch (error) {
        console.error("Error signing out", error);
        setLoading(false);
    }
  };

  const value = { user, userProfile, loading, signInWithGoogle, logout, refreshUserProfile };

  return (
    <AuthContext.Provider value={value}>
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

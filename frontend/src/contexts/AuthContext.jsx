import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// OWNER EMAIL WHITELIST - These emails have FULL ADMIN privileges
const OWNER_EMAILS = [
  'elliottcarter101@gmail.com',
  'playboyp@gmail.com'
];

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper to check if email is an owner
const isOwnerEmail = (email) => {
  return OWNER_EMAILS.includes(email?.toLowerCase());
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('legalconverter_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('legalconverter_user');
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email, password) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if OWNER email - give full admin privileges
      if (isOwnerEmail(email)) {
        const userData = {
          id: 'owner-' + Date.now(),
          email: email,
          name: 'Site Owner',
          subscription: 'owner', // Special owner tier
          role: 'admin',
          uploadsRemaining: -1, // unlimited
          analysesRemaining: -1, // unlimited
          createdAt: new Date().toISOString()
        };
        
        setUser(userData);
        localStorage.setItem('legalconverter_user', JSON.stringify(userData));
        setIsSignInOpen(false);
        return { success: true, message: 'Welcome back, Owner!' };
      }
      
      // Demo user authentication
      if (email === 'demo@legaldocconverter.com' && password === 'password') {
        const userData = {
          id: '1',
          email: 'demo@legaldocconverter.com',
          name: 'Demo User',
          subscription: 'free',
          role: 'user',
          uploadsRemaining: 5,
          analysesRemaining: 2,
          createdAt: new Date().toISOString()
        };
        
        setUser(userData);
        localStorage.setItem('legalconverter_user', JSON.stringify(userData));
        setIsSignInOpen(false);
        return { success: true };
      } else if (email === 'pro@legaldocconverter.com' && password === 'password') {
        const userData = {
          id: '2',
          email: 'pro@legaldocconverter.com',
          name: 'Pro User',
          subscription: 'professional',
          role: 'user',
          uploadsRemaining: -1, // unlimited
          analysesRemaining: -1, // unlimited
          createdAt: new Date().toISOString()
        };
        
        setUser(userData);
        localStorage.setItem('legalconverter_user', JSON.stringify(userData));
        setIsSignInOpen(false);
        return { success: true };
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email, password, name) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if OWNER email - give full admin privileges
      if (isOwnerEmail(email)) {
        const userData = {
          id: 'owner-' + Date.now(),
          email: email,
          name: name || 'Site Owner',
          subscription: 'owner',
          role: 'admin',
          uploadsRemaining: -1,
          analysesRemaining: -1,
          createdAt: new Date().toISOString()
        };
        
        setUser(userData);
        localStorage.setItem('legalconverter_user', JSON.stringify(userData));
        setIsSignUpOpen(false);
        return { success: true, message: 'Owner account activated!' };
      }
      
      // Regular user signup - free tier
      const userData = {
        id: 'user-' + Date.now(),
        email: email,
        name: name || email.split('@')[0],
        subscription: 'free',
        role: 'user',
        uploadsRemaining: 5,
        analysesRemaining: 2,
        createdAt: new Date().toISOString()
      };
      
      setUser(userData);
      localStorage.setItem('legalconverter_user', JSON.stringify(userData));
      setIsSignUpOpen(false);
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('legalconverter_user');
  };

  const updateUserUsage = (uploadsUsed = 0, analysesUsed = 0) => {
    if (user) {
      // Owners never lose usage
      if (user.subscription === 'owner' || user.role === 'admin') {
        return;
      }
      
      // Professional users have unlimited
      if (user.subscription === 'professional') {
        return;
      }
      
      const updatedUser = {
        ...user,
        uploadsRemaining: Math.max(0, user.uploadsRemaining - uploadsUsed),
        analysesRemaining: Math.max(0, user.analysesRemaining - analysesUsed)
      };
      setUser(updatedUser);
      localStorage.setItem('legalconverter_user', JSON.stringify(updatedUser));
    }
  };

  const canUpload = () => {
    if (!user) return false;
    // Owners and admins always can
    if (user.subscription === 'owner' || user.role === 'admin') return true;
    // Professional users always can
    if (user.subscription === 'professional') return true;
    // Free users check remaining
    return user.uploadsRemaining > 0;
  };

  const canAnalyze = () => {
    if (!user) return false;
    // Owners and admins always can
    if (user.subscription === 'owner' || user.role === 'admin') return true;
    // Professional users always can
    if (user.subscription === 'professional') return true;
    // Free users check remaining
    return user.analysesRemaining > 0;
  };

  const isOwner = () => {
    return user && (user.subscription === 'owner' || user.role === 'admin');
  };

  const value = {
    user,
    isLoading,
    isSignInOpen,
    setIsSignInOpen,
    isSignUpOpen,
    setIsSignUpOpen,
    signIn,
    signUp,
    signOut,
    updateUserUsage,
    canUpload,
    canAnalyze,
    isOwner,
    OWNER_EMAILS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

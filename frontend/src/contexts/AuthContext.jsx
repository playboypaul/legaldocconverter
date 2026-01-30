import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
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
      // TODO: Replace with real API call
      // For now, simulate API call with demo users
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo user authentication
      if (email === 'demo@legaldocconverter.com' && password === 'password') {
        const userData = {
          id: '1',
          email: 'demo@legaldocconverter.com',
          name: 'Demo User',
          subscription: 'free',
          uploadsRemaining: 3,
          analysesRemaining: 1,
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

  const signUp = async (name, email, password) => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate user creation
      const userData = {
        id: Date.now().toString(),
        email,
        name,
        subscription: 'free',
        uploadsRemaining: 3,
        analysesRemaining: 1,
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
    if (user && user.subscription === 'free') {
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
    // Allow all users to upload - site owner testing mode
    // In production, you can restrict this based on subscription
    return true;
  };

  const canAnalyze = () => {
    // Allow all users to analyze - site owner testing mode
    // In production, you can restrict this based on subscription
    return true;
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
    canAnalyze
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Eye, EyeOff, User, Lock, Scale, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SignInModal = () => {
  const { isSignInOpen, setIsSignInOpen, setIsSignUpOpen, signIn, isLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  
  // Reset password state
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await signIn(email, password);
    
    if (result.success) {
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in to LegalDocConverter.",
      });
      setEmail('');
      setPassword('');
    } else {
      toast({
        title: "Sign in failed",
        description: result.error || "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    // Use window.location.origin to dynamically get the current domain
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotEmail) {
      toast({ title: "Error", description: "Please enter your email address", variant: "destructive" });
      return;
    }
    
    setIsSendingReset(true);
    
    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { email: forgotEmail });
      
      setResetSent(true);
      
      // For demo mode, show the reset token
      if (response.data.reset_token) {
        setResetToken(response.data.reset_token);
        toast({
          title: "Reset Link Generated",
          description: "In demo mode, use the provided token to reset your password.",
        });
      } else {
        toast({
          title: "Check Your Email",
          description: "If an account exists, a password reset link has been sent.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to send reset link",
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    setIsResetting(true);
    
    try {
      await axios.post(`${API}/auth/reset-password`, {
        token: resetToken,
        new_password: newPassword
      });
      
      toast({
        title: "Password Reset",
        description: "Your password has been reset successfully. You can now sign in.",
      });
      
      // Reset all states and go back to sign in
      setShowResetForm(false);
      setShowForgotPassword(false);
      setResetSent(false);
      setResetToken('');
      setNewPassword('');
      setConfirmNewPassword('');
      setForgotEmail('');
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const switchToSignUp = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(true);
    resetAllStates();
  };

  const resetAllStates = () => {
    setEmail('');
    setPassword('');
    setErrors({});
    setShowForgotPassword(false);
    setForgotEmail('');
    setResetSent(false);
    setResetToken('');
    setShowResetForm(false);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleClose = () => {
    setIsSignInOpen(false);
    resetAllStates();
  };

  // Render Forgot Password Form
  if (showForgotPassword && !showResetForm) {
    return (
      <Dialog open={isSignInOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Mail className="h-8 w-8 text-blue-600" />
                <span>Reset Password</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-center">
              Enter your email to receive a password reset link
            </DialogDescription>
          </DialogHeader>

          {!resetSent ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pl-10"
                    placeholder="your@email.com"
                    disabled={isSendingReset}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                disabled={isSendingReset}
              >
                {isSendingReset ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h4 className="font-semibold text-green-900">Reset Link Sent!</h4>
                <p className="text-sm text-green-700 mt-1">
                  Check your email for the password reset link.
                </p>
              </div>
              
              {/* Demo mode: show reset token */}
              {resetToken && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-amber-900 mb-2">Demo Mode</h4>
                  <p className="text-xs text-amber-700 mb-2">
                    In production, this token would be emailed. For demo, click below:
                  </p>
                  <Button
                    onClick={() => setShowResetForm(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600"
                  >
                    Reset Password Now
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="text-center pt-4 border-t">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetSent(false);
                setResetToken('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render Reset Password Form
  if (showResetForm) {
    return (
      <Dialog open={isSignInOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Lock className="h-8 w-8 text-blue-600" />
                <span>New Password</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-center">
              Enter your new password below
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Enter new password"
                  disabled={isResetting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Confirm new password"
                  disabled={isResetting}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t">
            <button
              onClick={() => {
                setShowResetForm(false);
                setShowForgotPassword(false);
                setResetSent(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render Main Sign In Form
  return (
    <Dialog open={isSignInOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Scale className="h-8 w-8 text-blue-600" />
              <span>Sign In</span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to your LegalDocConverter account
          </DialogDescription>
        </DialogHeader>

        {/* Google Sign In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full border-2 hover:bg-slate-50"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Continue with Google
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                placeholder="your@email.com"
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="text-center space-y-2 pt-4 border-t">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <button
              onClick={switchToSignUp}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading}
            >
              Sign up for free
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal;

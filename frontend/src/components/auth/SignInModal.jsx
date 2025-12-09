import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Eye, EyeOff, User, Lock, Scale } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';

const SignInModal = () => {
  const { isSignInOpen, setIsSignInOpen, setIsSignUpOpen, signIn, isLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
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

  const switchToSignUp = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(true);
    setEmail('');
    setPassword('');
    setErrors({});
  };

  const handleClose = () => {
    setIsSignInOpen(false);
    setEmail('');
    setPassword('');
    setErrors({});
  };

  return (
    <Dialog open={isSignInOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Welcome Back</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to your LegalDocConverter account
          </DialogDescription>
        </DialogHeader>
        
        {/* Demo Credentials Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <h4 className="font-semibold text-blue-900 mb-2">Demo Accounts:</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Free:</strong> demo@legaldocconverter.com / password</p>
            <p><strong>Pro:</strong> pro@legaldocconverter.com / password</p>
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
            <Label htmlFor="password">Password</Label>
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
          <p className="text-xs text-slate-500">
            By signing in, you agree to our{' '}
            <button 
              onClick={() => window.openTermsOfService && window.openTermsOfService()}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Terms of Service
            </button>
            {' '}and{' '}
            <button 
              onClick={() => window.openPrivacyPolicy && window.openPrivacyPolicy()}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal;
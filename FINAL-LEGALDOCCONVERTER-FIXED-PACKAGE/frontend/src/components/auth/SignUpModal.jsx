import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';

const SignUpModal = () => {
  const { isSignUpOpen, setIsSignUpOpen, setIsSignInOpen, signUp, isLoading } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const result = await signUp(name.trim(), email, password);
    
    if (result.success) {
      toast({
        title: "Welcome to LegalDocConverter!",
        description: "Your account has been created successfully. You get 3 free uploads and 1 free analysis.",
      });
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } else {
      toast({
        title: "Sign up failed",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const switchToSignIn = () => {
    setIsSignUpOpen(false);
    setIsSignInOpen(true);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const handleClose = () => {
    setIsSignUpOpen(false);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  return (
    <Dialog open={isSignUpOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Join LegalDocConverter</DialogTitle>
          <DialogDescription className="text-center">
            Create your free account and get started
          </DialogDescription>
        </DialogHeader>
        
        {/* Free Plan Benefits */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
          <h4 className="font-semibold text-green-900 mb-2">Free Account Includes:</h4>
          <div className="text-sm text-green-800 space-y-1">
            <p>✓ 3 document uploads</p>
            <p>✓ 1 AI legal analysis</p>
            <p>✓ All format conversions</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
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
                placeholder="Create a password"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Free Account'
            )}
          </Button>
        </form>

        <div className="text-center space-y-2 pt-4 border-t">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <button
              onClick={switchToSignIn}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading}
            >
              Sign in
            </button>
          </p>
          <p className="text-xs text-slate-500">
            By signing up, you agree to our{' '}
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

export default SignUpModal;
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Scale } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './auth/UserMenu';

const Header = () => {
  const { user, setIsSignInOpen } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">LegalDocConverter</h1>
              <p className="text-xs text-slate-600">legaldocconverter.com</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium">
              Features
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium">
              Pricing
            </a>
            <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium">
              How it Works
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => setIsSignInOpen(true)}
                >
                  Sign In
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
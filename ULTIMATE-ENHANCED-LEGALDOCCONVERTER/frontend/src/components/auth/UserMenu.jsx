import React from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { User, Settings, CreditCard, LogOut, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const UserMenu = () => {
  const { user, signOut } = useAuth();

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleUpgrade = () => {
    // Open Stripe payment link
    window.open('https://buy.stripe.com/5kQfZh7EU65I6Q61i65AQ0V', '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold">
              {getInitials(user?.name || 'User')}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              {user?.subscription === 'professional' && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Usage Stats for Free Users */}
        {user?.subscription === 'free' && (
          <>
            <div className="px-2 py-2">
              <div className="text-xs text-muted-foreground mb-2">Your Usage:</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Uploads</span>
                  <span className={user.uploadsRemaining > 0 ? 'text-green-600' : 'text-red-500'}>
                    {user.uploadsRemaining > 0 ? `${user.uploadsRemaining} left` : 'None left'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>AI Analyses</span>
                  <span className={user.analysesRemaining > 0 ? 'text-green-600' : 'text-red-500'}>
                    {user.analysesRemaining > 0 ? `${user.analysesRemaining} left` : 'None left'}
                  </span>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        {user?.subscription === 'free' ? (
          <DropdownMenuItem onClick={handleUpgrade} className="text-yellow-600">
            <Crown className="mr-2 h-4 w-4" />
            <span>Upgrade to Pro</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={signOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
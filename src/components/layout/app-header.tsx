// Note: This component remains largely unchanged as it already uses mock data
// which wasn't directly tied to the profile page's simulated auth state.
// However, we adjust the Avatar component usage slightly for consistency
// with the profile card, ensuring it handles null avatarUrl gracefully.

'use client'; // Needs to be client component to potentially access auth state later

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Award, UserCircle2, LogIn } from "lucide-react";
import { getUserById } from "@/lib/mock-data"; // Import function to potentially get user data
import type { User } from '@/types';

// This header now attempts to reflect the simulated auth state.
// It will show login/signup if not "authenticated" and user info if "authenticated".

export function AppHeader() {
  // Simulate checking auth state (could be from context, session, etc.)
  // For now, we link it loosely to the profile page's simulation via localStorage
  // THIS IS NOT SECURE FOR REAL APPS - use proper auth providers.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for a simulated logged-in state
    // In a real app, verify the session/token with a backend or auth provider.
    const simulatedAuth = localStorage.getItem('simulatedAuth');
    const userId = localStorage.getItem('simulatedUserId');

    if (simulatedAuth === 'true' && userId) {
      setIsAuthenticated(true);
      // Fetch user data based on stored ID
      const user = getUserById(userId);
      setCurrentUser(user || null); // Handle case where user might not be found
    } else {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
    setIsLoading(false);

    // Add event listener to react to storage changes (simulating login/logout events)
    const handleStorageChange = () => {
        const updatedAuth = localStorage.getItem('simulatedAuth');
        const updatedUserId = localStorage.getItem('simulatedUserId');
        if (updatedAuth === 'true' && updatedUserId) {
            setIsAuthenticated(true);
            setCurrentUser(getUserById(updatedUserId) || null);
        } else {
            setIsAuthenticated(false);
            setCurrentUser(null);
        }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, []); // Run only on mount

  // Show loading state or basic header if still loading auth status
  if (isLoading) {
    return (
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="flex items-center gap-2">
            <Award className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Snaggy</h1>
          </Link>
        </div>
        <div className="h-9 w-9 animate-pulse rounded-full bg-muted"></div> {/* Skeleton Avatar */}
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <Link href="/" className="flex items-center gap-2">
          <Award className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Snaggy</h1>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {isAuthenticated && currentUser ? (
          <>
            {/* Show Tokens only when logged in */}
            <div className="flex items-center gap-1 text-sm font-medium text-accent">
              <Award className="h-5 w-5" />
              {/* Display the token balance from the current user data */}
              <span>{currentUser.tokenBalance.toLocaleString()} Tokens</span>
            </div>
            <Link href="/profile">
              <Avatar className="h-9 w-9 cursor-pointer">
                {/* Conditionally render AvatarImage */}
                {currentUser.avatarUrl ? (
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name || 'User avatar'} data-ai-hint="profile avatar" />
                ) : null }
                <AvatarFallback>
                  {currentUser.name?.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
            </Link>
          </>
        ) : (
          // Show Login button if not authenticated
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">
               <LogIn className="mr-2 h-4 w-4" /> Log In / Sign Up
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}

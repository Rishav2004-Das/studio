'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserProfileCard } from '@/components/profile/user-profile-card';
import { SubmissionHistoryItem } from '@/components/profile/submission-history-item';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { getSubmissionsByUserId, getTaskById, getUserById } from '@/lib/mock-data';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { User, Submission } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

// Note: This component uses local state (`isAuthenticated`, `currentUser`) to simulate
// authentication. A real application would typically use a dedicated auth provider/context
// (like Firebase Auth, NextAuth.js) and manage global state.
// Implementing a real database connection is beyond the scope of this simulation.

export default function ProfilePage() {
  // Simulate authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Simulate loading state while fetching user data
  const [isLoading, setIsLoading] = useState(false);
  // Store the current user data once authenticated
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Store user's submissions
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  // Control whether to show Login or Signup form
  const [showLogin, setShowLogin] = useState(true);

  // Simulate fetching user data after successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        // In a real app, you'd fetch the logged-in user's ID from your auth system
        const loggedInUserId = "user123"; // Using mock user ID for simulation
        const user = getUserById(loggedInUserId);
        if (user) {
          setCurrentUser(user);
          const userSubmissions = getSubmissionsByUserId(user.id);
          setSubmissions(userSubmissions);
        } else {
          // Handle case where user data couldn't be fetched (shouldn't happen with mock)
          console.error("Failed to fetch user data after login.");
          setIsAuthenticated(false); // Log out if data fetch fails
        }
        setIsLoading(false);
      }, 500); // Simulate network delay
    } else {
      setCurrentUser(null); // Clear user data on logout/initial state
      setSubmissions([]);
    }
  }, [isAuthenticated]);


  // Function to call upon successful login/signup simulation
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    // User data fetching is handled by the useEffect hook now
  };

  // --- Render Logic ---

  // 1. Show Loading Skeletons if authenticating/fetching data
  if (isLoading) {
    return (
      <div className="container mx-auto">
        {/* Skeleton for UserProfileCard */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
            <Skeleton className="h-24 w-24 rounded-full sm:h-28 sm:w-28" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-64" />
            </div>
          </CardHeader>
        </Card>
        <Separator className="my-8" />
        <Skeleton className="mb-6 h-8 w-1/3" />
        {/* Skeleton for Submission History */}
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }


  // 2. Show Login/Signup Forms if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {showLogin ? 'Welcome Back!' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {showLogin
                ? 'Log in to access your profile.'
                : 'Sign up to start earning tokens.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showLogin ? (
              <LoginForm
                onLoginSuccess={handleAuthSuccess}
                switchToSignup={() => setShowLogin(false)}
              />
            ) : (
              <SignupForm
                onSignupSuccess={handleAuthSuccess}
                switchToLogin={() => setShowLogin(true)}
              />
            )}
            {/* DEVELOPMENT ONLY: Button to bypass login */}
            {/* <Button onClick={handleAuthSuccess} variant="outline" className="mt-4 w-full">
              [Dev] Simulate Login
            </Button> */}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Show Profile if authenticated and user data is loaded
  if (currentUser) {
    return (
      <div className="container mx-auto">
        {/* Pass the fetched user data */}
        <UserProfileCard user={currentUser} />

        <Separator className="my-8" />

        <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Submission History
        </h2>
        {submissions.length > 0 ? (
          <div className="space-y-6">
            {submissions.map((submission) => {
              const task = getTaskById(submission.taskId);
              // Task title is needed for the submission item display
              if (!task) return null; // Should ideally not happen

              return (
                <SubmissionHistoryItem
                  key={submission.id}
                  submission={submission}
                  taskTitle={task.title}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center rounded-lg border border-dashed p-8">
            <p className="text-muted-foreground">
              You haven't made any submissions yet.
            </p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/">Browse available tasks</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              and complete them to see your history here!
            </p>
          </div>
        )}
      </div>
    );
  }

  // Fallback (should ideally not be reached if logic is correct)
  return (
     <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <p className="text-muted-foreground">Something went wrong. Please refresh.</p>
     </div>
  );
}

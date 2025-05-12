'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { UserProfileCard } from '@/components/profile/user-profile-card';
import { SubmissionHistoryItem } from '@/components/profile/submission-history-item';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { getSubmissionsByUserId, getTaskById, getUserById, updateUserAvatar } from '@/lib/mock-data';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { User, Submission } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Note: This component uses local state (`isAuthenticated`, `currentUser`) to simulate
// authentication. A real application would typically use a dedicated auth provider/context
// (like Firebase Auth, NextAuth.js) and manage global state.
// Implementing a real database connection is beyond the scope of this simulation.

export default function ProfilePage() {
  const { toast } = useToast();
  // Simulate authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Simulate loading state while fetching user data
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  // Store the current user data once authenticated
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Store user's submissions
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  // Control whether to show Login or Signup form
  const [showLogin, setShowLogin] = useState(true);
  // Ref for hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate checking auth status on mount
  useEffect(() => {
    // In a real app, check if the user is already logged in (e.g., from localStorage, session, auth context)
    // For simulation, we assume not logged in initially.
    setIsLoading(false); // Finished initial check
  }, []);

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
          toast({
            title: "Error",
            description: "Could not load user data. Please try logging in again.",
            variant: "destructive",
          });
          setIsAuthenticated(false); // Log out if data fetch fails
        }
        setIsLoading(false);
      }, 500); // Simulate network delay
    } else {
      setCurrentUser(null); // Clear user data on logout/initial state
      setSubmissions([]);
    }
  }, [isAuthenticated, toast]);


  // Function to call upon successful login/signup simulation
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    // User data fetching is handled by the useEffect hook now
  };

  // Function to simulate logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
    });
  };

  // Trigger hidden file input when avatar is clicked
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Handle avatar file selection and update
  const handleAvatarUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUser) {
      // Simulate upload and get URL (replace with actual upload logic)
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatarUrl = reader.result as string; // Use Data URL for simulation

        // Update mock data (replace with backend call)
        updateUserAvatar(currentUser.id, newAvatarUrl);

        // Update local state immediately
        setCurrentUser((prevUser) => {
            if (!prevUser) return null;
            return { ...prevUser, avatarUrl: newAvatarUrl };
        });

        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been changed.",
        });
      };
      reader.readAsDataURL(file); // Read file as Data URL for display simulation
    }
     // Reset file input value to allow re-uploading the same file
     if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
  };


  // --- Render Logic ---

  // 1. Show Loading Skeletons if fetching data
  if (isLoading) {
    return (
      <div className="container mx-auto animate-pulse">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Show Profile if authenticated and user data is loaded
  if (currentUser) {
    return (
      <div className="container mx-auto">
         {/* Hidden file input for avatar upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarUpdate}
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* Pass the fetched user data and update handler */}
        <UserProfileCard
          user={currentUser}
          onAvatarClick={handleAvatarClick}
          isOwnProfile={true} // Assuming this page always shows the logged-in user's profile
         />

         {/* Logout Button */}
         <div className="mt-4 text-center sm:text-right">
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
         </div>


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

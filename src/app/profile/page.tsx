'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next'; // Keep for potential future static metadata
import { UserProfileCard } from '@/components/profile/user-profile-card';
import { SubmissionHistoryItem } from '@/components/profile/submission-history-item';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { mockUser, getSubmissionsByUserId, getTaskById } from '@/lib/mock-data'; // Keep mock data for logged-in state
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { User } from '@/types';

// Note: We'll manage auth state locally for now.
// A real app would use context or a state management library.

// export const metadata: Metadata = {
//   title: "My Profile | Snaggy", // Metadata can't be dynamic in 'use client' easily, handle dynamically if needed
//   description: "View your Snaggy profile, token balance, and submission history, or log in/sign up.",
// };

export default function ProfilePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);

  // Function to simulate successful login/signup
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  // Placeholder for the logged-in user data
  const user: User | null = isAuthenticated ? mockUser : null;

  if (!isAuthenticated || !user) {
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

  // If authenticated, show the profile
  const submissions = getSubmissionsByUserId(user.id);

  return (
    <div className="container mx-auto">
      <UserProfileCard user={user} />

      <Separator className="my-8" />

      <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Submission History
      </h2>
      {submissions.length > 0 ? (
        <div className="space-y-6">
          {submissions.map((submission) => {
            const task = getTaskById(submission.taskId);
            if (!task) return null; // Should not happen with mock data

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
        <div className="text-center">
          <p className="text-muted-foreground">
            You haven't made any submissions yet.
          </p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/">Complete some tasks</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
             to see them here!
          </p>
        </div>
      )}
    </div>
  );
}

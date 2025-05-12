
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { UserProfileCard } from '@/components/profile/user-profile-card';
import { SubmissionHistoryItem } from '@/components/profile/submission-history-item';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { getSubmissionsByUserId, getTaskById } from '@/lib/mock-data'; // Keep for submissions
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { User as AppUser, Submission } from '@/types'; // Renamed User to AppUser
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { auth, db, storage } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser, firebaseUser, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [localCurrentUser, setLocalCurrentUser] = useState<AppUser | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showLogin, setShowLogin] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);


  useEffect(() => {
    if (!authLoading) {
      setPageLoading(false);
      if (currentUser) {
        setLocalCurrentUser(currentUser);
        // Fetch submissions (still mock for now)
        const userSubmissions = getSubmissionsByUserId(currentUser.id);
        setSubmissions(userSubmissions);
      } else {
        setLocalCurrentUser(null);
        setSubmissions([]);
      }
    }
  }, [authLoading, currentUser]);

  const handleAuthSuccess = async (userId: string) => {
    // This function might not be directly needed if AuthProvider handles user fetching
    // However, we can re-fetch user data here if needed or rely on AuthContext update
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      setLocalCurrentUser(userDocSnap.data() as AppUser);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      // AuthContext will handle clearing currentUser
    } catch (error) {
      console.error("Error logging out: ", error);
      toast({
        title: 'Logout Failed',
        description: 'Could not log you out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAvatarClick = () => {
    if (!isUpdatingAvatar) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && localCurrentUser && firebaseUser) {
      setIsUpdatingAvatar(true);
      toast({ title: 'Uploading Avatar...', description: 'Please wait.' });
      try {
        const storageRef = ref(storage, `avatars/${firebaseUser.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        const newAvatarUrl = await getDownloadURL(storageRef);

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userDocRef, { avatarUrl: newAvatarUrl });

        setLocalCurrentUser((prevUser) => {
          if (!prevUser) return null;
          return { ...prevUser, avatarUrl: newAvatarUrl };
        });

        toast({
          title: 'Avatar Updated',
          description: 'Your profile picture has been changed.',
        });
      } catch (error) {
        console.error('Error updating avatar:', error);
        toast({
          title: 'Avatar Update Failed',
          description: 'Could not update your avatar. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsUpdatingAvatar(false);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto animate-pulse">
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
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !localCurrentUser) {
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
                onLoginSuccess={handleAuthSuccess} // AuthContext will also update
                switchToSignup={() => setShowLogin(false)}
              />
            ) : (
              <SignupForm
                onSignupSuccess={handleAuthSuccess} // AuthContext will also update
                switchToLogin={() => setShowLogin(true)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarUpdate}
        accept="image/*"
        style={{ display: 'none' }}
        disabled={isUpdatingAvatar}
      />

      <UserProfileCard
        user={localCurrentUser}
        onAvatarClick={handleAvatarClick}
        isOwnProfile={true}
        isUpdatingAvatar={isUpdatingAvatar}
      />

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
            if (!task) return null;
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

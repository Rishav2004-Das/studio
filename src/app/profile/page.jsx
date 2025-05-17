
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { UserProfileCard } from '@/components/profile/user-profile-card.jsx';
import { SubmissionHistoryItem } from '@/components/profile/submission-history-item.jsx';
import { LoginForm } from '@/components/auth/login-form.jsx';
import { SignupForm } from '@/components/auth/signup-form.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { useToast } from '@/hooks/use-toast.js';
import { useAuth } from '@/contexts/auth-context.jsx';
import { auth, db, storage } from '@/lib/firebase/config.js';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser, firebaseUser, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [localCurrentUser, setLocalCurrentUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const fileInputRef = useRef(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);


  useEffect(() => {
    if (!authLoading) {
      setPageLoading(false);
      if (currentUser && currentUser.id) {
        setLocalCurrentUser(currentUser);
        const fetchSubmissions = async () => {
          try {
            const submissionsCol = collection(db, 'submissions');
            const q = query(
              submissionsCol,
              where('userId', '==', currentUser.id),
              orderBy('submittedAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const fetchedSubmissions = querySnapshot.docs.map(docSnapshot => {
              const data = docSnapshot.data();
              return {
                id: docSnapshot.id,
                ...data,
                submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(data.submittedAt || Date.now())
              };
            });
            setSubmissions(fetchedSubmissions);
          } catch (error) {
            console.error("Error fetching submissions: ", error);
            toast({
              title: 'Error Fetching History',
              description: 'Could not load your submission history.',
              variant: 'destructive',
            });
            setSubmissions([]);
          }
        };
        fetchSubmissions();
      } else {
        setLocalCurrentUser(null);
        setSubmissions([]);
      }
    }
  }, [authLoading, currentUser, toast]);

  const handleAuthSuccess = async (userId) => {
    // AuthContext will update currentUser, which triggers the useEffect above
    // to fetch user data and submissions.
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
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

  const handleAvatarUpdate = async (event) => {
    const file = event.target.files?.[0];
    if (file && localCurrentUser && firebaseUser) {
      setIsUpdatingAvatar(true);
      toast({ title: 'Uploading Avatar...', description: 'Please wait.' });
      console.log('[handleAvatarUpdate] Starting avatar upload. File:', file.name, 'Size:', file.size);
      try {
        console.log('[handleAvatarUpdate] Entered try block.');
        
        const storageRef = ref(storage, `avatars/${firebaseUser.uid}/${file.name}`);
        console.log('[handleAvatarUpdate] Attempting to upload to Firebase Storage...');
        await uploadBytes(storageRef, file);
        console.log('[handleAvatarUpdate] Firebase Storage upload COMPLETE.');

        console.log('[handleAvatarUpdate] Attempting to get download URL...');
        const newAvatarUrl = await getDownloadURL(storageRef);
        console.log('[handleAvatarUpdate] Download URL obtained:', newAvatarUrl);

        console.log('[handleAvatarUpdate] Attempting to update Firestore document...');
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await updateDoc(userDocRef, { avatarUrl: newAvatarUrl });
        console.log('[handleAvatarUpdate] Firestore document update COMPLETE.');

        setLocalCurrentUser((prevUser) => {
          if (!prevUser) return null;
          const updatedUser = { ...prevUser, avatarUrl: newAvatarUrl };
          console.log('[handleAvatarUpdate] localCurrentUser state updated with new avatarUrl.');
          return updatedUser;
        });
        
        toast({
          title: 'Avatar Updated',
          description: 'Your profile picture has been changed.',
        });
        console.log('[handleAvatarUpdate] Avatar update successful, success toast shown.');
      } catch (error) {
        console.error('[handleAvatarUpdate] Error during avatar update process:', error);
        console.error('[handleAvatarUpdate] Firebase error code (if available):', error.code);
        console.error('[handleAvatarUpdate] Firebase error message (if available):', error.message);
        toast({
          title: 'Avatar Update Failed',
          description: `Could not update your avatar. ${error.message || 'Please try again.'}`,
          variant: 'destructive',
        });
      } finally {
        console.log('[handleAvatarUpdate] Entered finally block.');
        setIsUpdatingAvatar(false);
        console.log('[handleAvatarUpdate] setIsUpdatingAvatar(false) CALLED.');
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; 
        }
        console.log('[handleAvatarUpdate] Exiting finally block.');
      }
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
          {submissions.map((submission) => (
            <SubmissionHistoryItem
              key={submission.id}
              submission={submission}
              taskTitle={submission.taskTitle || "Task details unavailable"}
            />
          ))}
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

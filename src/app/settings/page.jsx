
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme.js';
import { Button, buttonVariants } from '@/components/ui/button.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog.jsx';
import { Input } from '@/components/ui/input.jsx';
import { useToast } from '@/hooks/use-toast.js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.jsx';
import { Sun, Moon, LogOut, Trash2, LockKeyhole } from 'lucide-react';
import { Separator } from '@/components/ui/separator.jsx';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context.jsx';
import { auth, db } from '@/lib/firebase/config.js';
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser as deleteFirebaseUser } from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { cn } from '@/lib/utils.js';

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'New passwords do not match.',
  path: ['confirmPassword'],
});


export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { firebaseUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [isPasswordUpdateLoading, setIsPasswordUpdateLoading] = useState(false);
  const [isDeleteAccountLoading, setIsDeleteAccountLoading] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [passwordForDelete, setPasswordForDelete] = useState('');
  const [isDeleteDialogPasswordEmpty, setIsDeleteDialogPasswordEmpty] = useState(false);


  const passwordForm = useForm({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!authLoading) {
      setPageLoading(false);
    }
  }, [authLoading]);

  const handleLogout = async () => {
    setIsLogoutLoading(true);
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      // AuthContext handles UI update
    } catch (error) {
      console.error("Error logging out: ", error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout.',
        variant: 'destructive',
      });
    } finally {
        setIsLogoutLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!passwordForDelete) {
        toast({
            title: 'Password Required',
            description: 'Please enter your current password to confirm deletion.',
            variant: 'destructive',
        });
        setIsDeleteDialogPasswordEmpty(true);
        return;
    }
    setIsDeleteDialogPasswordEmpty(false);

    if (!firebaseUser || !firebaseUser.email) {
        toast({ title: "Error", description: "User not found or email missing for re-authentication.", variant: "destructive" });
        return;
    }
    setIsDeleteAccountLoading(true);
    
    try {
        const credential = EmailAuthProvider.credential(firebaseUser.email, passwordForDelete);
        await reauthenticateWithCredential(firebaseUser, credential);

        // Step 1: Delete user's submissions from Firestore
        try {
          console.log('[SettingsPage] Attempting to delete submissions for user:', firebaseUser.uid);
          const submissionsQuery = query(collection(db, 'submissions'), where('userId', '==', firebaseUser.uid));
          const submissionsSnapshot = await getDocs(submissionsQuery);
          const batch = writeBatch(db);
          let submissionsCount = 0;
          submissionsSnapshot.forEach((docSnapshot) => {
            batch.delete(docSnapshot.ref);
            submissionsCount++;
          });
          if (submissionsCount > 0) {
            await batch.commit();
            console.log(`[SettingsPage] Successfully deleted ${submissionsCount} submissions for user ${firebaseUser.uid}.`);
          } else {
            console.log(`[SettingsPage] No submissions found to delete for user ${firebaseUser.uid}.`);
          }
        } catch (submissionsError) {
          console.error("Error deleting user submissions from Firestore: ", submissionsError);
          // Do not stop the account deletion process if submissions deletion fails, but notify user.
          toast({
            title: 'Submissions Deletion Issue',
            description: "Could not delete all user submissions. Some data might remain. Please contact support if needed.",
            variant: 'destructive',
            duration: 9000,
          });
        }

        // Step 2: Delete user data from 'users' collection in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          await deleteDoc(userDocRef);
          console.log('[SettingsPage] User document deleted from Firestore.');
        } catch (firestoreError) {
          console.error("Error deleting user document from Firestore: ", firestoreError);
          let firestoreErrorDesc = "Could not delete your user data from our records.";
          if (firestoreError.code === 'permission-denied') {
            firestoreErrorDesc = "Could not delete user data: Permission denied by Firestore rules. Ensure users can delete their own document in the 'users' collection.";
          }
          toast({
            title: 'Data Deletion Failed',
            description: firestoreErrorDesc,
            variant: 'destructive',
            duration: 9000,
          });
          // We might still proceed to delete the auth user, or stop here.
          // For now, let's stop if Firestore user document deletion fails, as it's part of the process.
          setIsDeleteAccountLoading(false);
          return;
        }
        
        // Step 3: Delete user from Firebase Auth
        await deleteFirebaseUser(firebaseUser);
        console.log('[SettingsPage] Firebase Auth user deleted.');
        
        toast({
            title: 'Account Deleted',
            description: 'Your account and associated data have been permanently deleted.',
        });
        setPasswordForDelete(''); 
        // AuthContext will handle UI update (user becomes null)
    } catch (error) {
        let desc = "Could not delete your account. Please try again.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            desc = "Incorrect password. Account deletion failed.";
            setPasswordForDelete(''); // Clear password if it was wrong
        } else if (error.code === 'auth/requires-recent-login') {
            desc = "This operation is sensitive and requires recent authentication. Please log out and log back in before trying again.";
        } else if (error.code === 'permission-denied' && error.message.includes('firestore')) {
             desc = "Could not delete user data due to Firestore permissions. Please check security rules.";
        }
        else {
            console.error("[SettingsPage] Error deleting account: ", error);
        }
        toast({
            title: 'Account Deletion Failed',
            description: desc,
            variant: 'destructive',
        });
    } finally {
        setIsDeleteAccountLoading(false);
    }
  };

  const onPasswordUpdateSubmit = async (data) => {
    if (!firebaseUser || !firebaseUser.email) {
      toast({ title: 'Error', description: 'User not found.', variant: 'destructive' });
      return;
    }
    setIsPasswordUpdateLoading(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, data.currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, data.newPassword);
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully changed.',
      });
      passwordForm.reset();
    } catch (error) {
       let desc = "Could not update your password. Please try again.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            desc = "Incorrect current password.";
        } else if (error.code === 'auth/weak-password') {
            desc = "The new password is too weak.";
        } else if (error.code === 'auth/requires-recent-login') {
             desc = "This operation is sensitive and requires recent authentication. Please log out and log back in before trying again.";
        } else {
            console.error('[SettingsPage] Password update error:', error);
        }
      toast({
        title: 'Password Update Failed',
        description: desc,
        variant: 'destructive',
      });
    } finally {
      setIsPasswordUpdateLoading(false);
    }
  };

  if (pageLoading || authLoading) {
    return (
        <div className="container mx-auto space-y-8 p-4">
            <Skeleton className="h-10 w-1/3 mb-8" />
            <Card className="shadow-md">
                <CardHeader>
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
             <Card className="shadow-md">
                <CardHeader>
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full mb-4" />
                     <Skeleton className="h-10 w-full mb-4" />
                      <Skeleton className="h-10 w-full mb-4" />
                    <Skeleton className="h-10 w-1/4" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Settings
      </h1>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
             {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
             Display Theme
          </CardTitle>
          <CardDescription>Choose your preferred display mode.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 rounded-md border p-4">
             <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Appearance
                </p>
                <p className="text-sm text-muted-foreground">
                  Select Light or Dark theme. Changes are saved automatically.
                </p>
              </div>
            <div className="flex items-center space-x-2">
              <Sun className="h-5 w-5 text-yellow-500" />
              <Switch
                id="theme-switch"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                aria-label="Toggle dark mode"
              />
              <Moon className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {isAuthenticated && (
        <>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <LockKeyhole className="h-5 w-5"/>
                Update Password
              </CardTitle>
              <CardDescription>Change your account password.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordUpdateSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your current password" {...field} disabled={isPasswordUpdateLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter new password (min 8 chars)" {...field} disabled={isPasswordUpdateLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm new password" {...field} disabled={isPasswordUpdateLoading}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPasswordUpdateLoading}>
                    {isPasswordUpdateLoading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <Card className="shadow-md border-destructive/50">
            <CardHeader>
              <CardTitle className="text-xl text-destructive">Account Actions</CardTitle>
              <CardDescription>Manage your account session and data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center justify-between rounded-lg border border-border p-4">
                 <div>
                   <p className="font-medium">Log Out</p>
                   <p className="text-sm text-muted-foreground">End your current session.</p>
                 </div>
                <Button variant="outline" onClick={handleLogout} disabled={isLogoutLoading}>
                  {isLogoutLoading ? "Logging out..." : <><LogOut className="mr-2 h-4 w-4" /> Log Out</>}
                </Button>
              </div>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center justify-between rounded-lg border border-destructive p-4">
                <div>
                   <p className="font-medium text-destructive">Delete Account</p>
                   <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
                 </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleteAccountLoading}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data, including all task submissions. Please enter your current password to confirm.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                      <Label htmlFor="delete-password-input" className="sr-only">Current Password</Label>
                      <Input
                        id="delete-password-input"
                        type="password"
                        placeholder="Enter your current password"
                        value={passwordForDelete}
                        onChange={(e) => {
                            setPasswordForDelete(e.target.value);
                            if (isDeleteDialogPasswordEmpty && e.target.value) {
                                setIsDeleteDialogPasswordEmpty(false);
                            }
                        }}
                        className={cn(isDeleteDialogPasswordEmpty && "border-destructive ring-destructive focus-visible:ring-destructive")}
                      />
                      {isDeleteDialogPasswordEmpty && <p className="text-xs text-destructive mt-1">Password is required to delete account.</p>}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => {
                          setPasswordForDelete('');
                          setIsDeleteDialogPasswordEmpty(false);
                        }}
                        disabled={isDeleteAccountLoading}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className={buttonVariants({ variant: "destructive" })}
                        disabled={isDeleteAccountLoading}
                      >
                        {isDeleteAccountLoading ? "Deleting..." : "Yes, delete account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </>
      )}

       {!isAuthenticated && !pageLoading && (
         <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-xl">Account Settings</CardTitle>
                <CardDescription>Log in or sign up to manage your account.</CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-muted-foreground">Please log in to access account management features like updating your password or deleting your account.</p>
            </CardContent>
             <CardFooter>
                 <Button asChild variant="default">
                    <Link href="/profile">Log In / Sign Up</Link>
                 </Button>
            </CardFooter>
         </Card>
       )}
    </div>
  );
}

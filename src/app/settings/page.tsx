
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme'; 
import { Button, buttonVariants } from '@/components/ui/button'; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Sun, Moon, LogOut, Trash2, LockKeyhole } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { auth, db } from '@/lib/firebase/config';
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser as deleteFirebaseUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'New passwords do not match.',
  path: ['confirmPassword'],
});

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { firebaseUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [isPasswordUpdateLoading, setIsPasswordUpdateLoading] = useState(false);
  const [isDeleteAccountLoading, setIsDeleteAccountLoading] = useState(false);
   const [isLogoutLoading, setIsLogoutLoading] = useState(false);


  const passwordForm = useForm<UpdatePasswordFormValues>({
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
    if (!firebaseUser || !firebaseUser.email) {
        toast({ title: "Error", description: "User not found or email missing for re-authentication.", variant: "destructive" });
        return;
    }
    setIsDeleteAccountLoading(true);

    const currentPassword = prompt("Please enter your current password to confirm account deletion:");
    if (!currentPassword) {
        toast({ title: "Cancelled", description: "Account deletion cancelled." });
        setIsDeleteAccountLoading(false);
        return;
    }
    
    try {
        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);

        // Delete user data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await deleteDoc(userDocRef);

        // Delete user from Firebase Auth
        await deleteFirebaseUser(firebaseUser);
        
        toast({
            title: 'Account Deleted',
            description: 'Your account has been permanently deleted.',
        });
        // AuthContext will handle UI update
    } catch (error: any) {
        console.error("Error deleting account: ", error);
        let desc = "Could not delete your account. Please try again.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            desc = "Incorrect password. Account deletion failed.";
        } else if (error.code === 'auth/requires-recent-login') {
            desc = "This operation is sensitive and requires recent authentication. Please log out and log back in before trying again.";
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

  const onPasswordUpdateSubmit = async (data: UpdatePasswordFormValues) => {
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
    } catch (error: any) {
      console.error('Password update error:', error);
       let desc = "Could not update your password. Please try again.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            desc = "Incorrect current password.";
        } else if (error.code === 'auth/weak-password') {
            desc = "The new password is too weak.";
        } else if (error.code === 'auth/requires-recent-login') {
             desc = "This operation is sensitive and requires recent authentication. Please log out and log back in before trying again.";
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

          <Separator />

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
                        account and remove your data. You will be asked for your current password.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleteAccountLoading}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className={buttonVariants({ variant: "destructive" })} disabled={isDeleteAccountLoading}>
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

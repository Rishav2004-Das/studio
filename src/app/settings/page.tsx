
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/use-theme'; // Use the imported hook
import { Button, buttonVariants } from '@/components/ui/button'; // Import buttonVariants
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
import Link from 'next/link'; // Import Link

// No static metadata for client components

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const passwordForm = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Simulate checking auth status on mount
    const authStatus = localStorage.getItem('simulatedAuth') === 'true';
    setIsAuthenticated(authStatus);
    setIsLoading(false);

    // Listen for storage changes (login/logout events from other components)
        const handleStorageChange = () => {
            const updatedAuth = localStorage.getItem('simulatedAuth') === 'true';
             setIsAuthenticated(updatedAuth);
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
          window.removeEventListener('storage', handleStorageChange);
        };
  }, []);

  const handleLogout = () => {
    // Simulate logout
    localStorage.removeItem('simulatedAuth');
    localStorage.removeItem('simulatedUserId');
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('storage')); // Notify other components like header
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    // Optionally redirect to home or login page
    // window.location.href = '/';
  };

  const handleDeleteAccount = () => {
    // Simulate account deletion
    localStorage.removeItem('simulatedAuth');
    localStorage.removeItem('simulatedUserId');
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('storage')); // Notify other components
    toast({
      title: 'Account Deleted',
      description: 'Your account has been permanently deleted.',
      variant: 'destructive',
    });
     // Optionally redirect
    // window.location.href = '/';
  };

  const onPasswordUpdateSubmit = (data: UpdatePasswordFormValues) => {
    // Simulate password update API call
    console.log('Updating password for user:', localStorage.getItem('simulatedUserId'));
    console.log('Current Password:', data.currentPassword); // In real app, verify this
    console.log('New Password:', data.newPassword); // In real app, send this to backend

    toast({
      title: 'Password Updated',
      description: 'Your password has been successfully changed.',
    });
    passwordForm.reset();
  };

  if (isLoading) {
    // Optional: Add loading skeletons if needed
    return <div className="container mx-auto p-4">Loading settings...</div>;
  }

  return (
    <div className="container mx-auto space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Settings
      </h1>

      {/* Theme Settings Card - Always Visible */}
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

      {/* Account Settings Section - Visible Only When Logged In */}
      {isAuthenticated && (
        <>
          {/* Update Password Card */}
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
                          <Input type="password" placeholder="Enter your current password" {...field} />
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
                          <Input type="password" placeholder="Enter new password (min 8 chars)" {...field} />
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
                          <Input type="password" placeholder="Confirm new password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Update Password
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Separator />

          {/* Account Actions Card */}
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
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </Button>
              </div>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center justify-between rounded-lg border border-destructive p-4">
                <div>
                   <p className="font-medium text-destructive">Delete Account</p>
                   <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
                 </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      {/* Ensure buttonVariants is imported for this usage */}
                      <AlertDialogAction onClick={handleDeleteAccount} className={buttonVariants({ variant: "destructive" })}>
                        Yes, delete account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </>
      )}

       {/* Prompt to log in if not authenticated */}
       {!isAuthenticated && !isLoading && (
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
                    {/* Use Link component for navigation */}
                    <Link href="/profile">Log In / Sign Up</Link>
                 </Button>
            </CardFooter>
         </Card>
       )}
    </div>
  );
}

// REMOVED the duplicate useTheme hook definition from here.
// It should exist only in src/hooks/use-theme.ts

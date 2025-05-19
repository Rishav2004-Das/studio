
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button.jsx';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.jsx';
import { Input } from '@/components/ui/input.jsx';
import { useToast } from '@/hooks/use-toast.js';
import { UserPlus } from 'lucide-react';
import { auth, db } from '@/lib/firebase/config.js';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';

const signupFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});


export function SignupForm({ onSignupSuccess, switchToLogin }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data) {
    setIsLoading(true);
    try {
      console.log('[SignupForm] Attempting to create user in Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      console.log('[SignupForm] Firebase Auth user created successfully:', firebaseUser.uid);

      console.log('[SignupForm] Attempting to update Firebase Auth profile...');
      await updateProfile(firebaseUser, { displayName: data.name });
      console.log('[SignupForm] Firebase Auth profile updated.');

      const newUserDoc = {
        id: firebaseUser.uid,
        name: data.name,
        email: data.email,
        avatarUrl: null,
        tokenBalance: 0,
        createdAt: serverTimestamp(),
        isAdmin: false, 
      };
      console.log('[SignupForm] Attempting to create Firestore document for new user with data:', newUserDoc);
      await setDoc(doc(db, 'users', firebaseUser.uid), newUserDoc);
      console.log('[SignupForm] Firestore document created successfully.');

      toast({
        title: 'Signup Successful!',
        description: `Welcome, ${data.name}!`,
      });
      
      if (onSignupSuccess) {
        onSignupSuccess(firebaseUser.uid);
      }
      form.reset();

    } catch (error) {
      console.error('[SignupForm] Full signup error object:', error); 
      let errorMessage = 'Signup failed. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please log in or use a different email.';
        if (switchToLogin) {
            switchToLogin();
        }
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.name === 'FirebaseError' && error.message && error.message.includes('Missing or insufficient permissions')) {
        errorMessage = 'Signup partially failed: Could not create user profile data due to database permissions. Please contact support or check Firestore rules.';
         console.error('[SignupForm] Firestore permission error during setDoc:', error.code, error.message);
      } else if (error.name === 'FirebaseError') { // Catch more generic Firebase errors, including potential API key issues
        errorMessage = `Signup failed: ${error.message} (Code: ${error.code || 'N/A'}). Please check your API key and Firebase project setup. See console for details.`;
      }
      
      toast({
        title: 'Signup Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} disabled={isLoading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} disabled={isLoading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Create a password (min 8 chars)" {...field} disabled={isLoading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm your password" {...field} disabled={isLoading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
          {isLoading ? 'Signing Up...' : <><UserPlus className="mr-2 h-4 w-4" /> Sign Up</> }
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Button variant="link" type="button" onClick={switchToLogin} className="p-0 h-auto" disabled={isLoading}>
            Log In
          </Button>
        </div>
      </form>
    </Form>
  );
}

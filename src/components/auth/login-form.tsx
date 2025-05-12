'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

interface LoginFormProps {
  onLoginSuccess: () => void;
  switchToSignup: () => void;
}

export function LoginForm({ onLoginSuccess, switchToSignup }: LoginFormProps) {
  const { toast } = useToast();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Simulate login API call
  function onSubmit(data: LoginFormValues) {
    console.log('Login attempt:', data);
    // In a real app, you would make an API call here and verify credentials
    // For simulation, assume login is successful for the mock user
    const mockUserId = "user123"; // Hardcoded for simulation

    // Simulate successful login
    toast({
      title: 'Login Successful!',
      description: 'Welcome back!',
      variant: 'default',
    });

    // --- Simulation for Header ---
    // THIS IS NOT SECURE FOR REAL APPS. Use proper session management.
    try {
        localStorage.setItem('simulatedAuth', 'true');
        localStorage.setItem('simulatedUserId', mockUserId);
        // Dispatch a storage event so the header might update if listening
        window.dispatchEvent(new Event('storage'));
    } catch (e) {
        console.error("Could not set localStorage for simulation:", e)
    }
    // ---------------------------

    onLoginSuccess(); // Update parent component state (ProfilePage)
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
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
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <LogIn className="mr-2 h-4 w-4" /> Log In
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Button variant="link" type="button" onClick={switchToSignup} className="p-0 h-auto">
            Sign Up
          </Button>
        </div>
      </form>
    </Form>
  );
}

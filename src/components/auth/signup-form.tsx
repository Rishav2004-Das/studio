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
import { UserPlus } from 'lucide-react';

const signupFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'], // Set error on confirmPassword field
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

interface SignupFormProps {
  onSignupSuccess: () => void;
  switchToLogin: () => void;
}

export function SignupForm({ onSignupSuccess, switchToLogin }: SignupFormProps) {
  const { toast } = useToast();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Simulate signup API call
  function onSubmit(data: SignupFormValues) {
    console.log('Signup attempt:', { name: data.name, email: data.email }); // Don't log password
    // In a real app, you would make an API call here to create the user
    // For now, we simulate success
    toast({
      title: 'Signup Successful!',
      description: `Welcome, ${data.name}! You can now log in.`,
      variant: 'default',
    });
    onSignupSuccess(); // Update parent component state (or redirect to login)
    form.reset();
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
                <Input placeholder="Your Name" {...field} />
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
                <Input type="password" placeholder="Create a password" {...field} />
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
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <UserPlus className="mr-2 h-4 w-4" /> Sign Up
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Button variant="link" type="button" onClick={switchToLogin} className="p-0 h-auto">
            Log In
          </Button>
        </div>
      </form>
    </Form>
  );
}


'use client';

import { useAuth } from '@/contexts/auth-context.jsx';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser || !currentUser.isAdmin) {
        // Redirect to home page if user is not an admin or not logged in
        router.replace('/'); 
      }
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-4">
        <div className="w-full max-w-xs space-y-4 text-center">
          <Skeleton className="mx-auto h-16 w-16 rounded-full" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !currentUser.isAdmin) {
    // This state might be briefly visible before redirection, or if redirection fails.
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // If user is an admin, render the children (the admin page)
  return <>{children}</>;
}

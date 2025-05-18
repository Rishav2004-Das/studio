
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
    if (!isLoading) { // Only proceed if auth state is resolved
      // If currentUser is explicitly null (not loaded yet or logged out)
      // OR if currentUser is loaded but is not an admin
      if (currentUser === null || (currentUser && !currentUser.isAdmin)) {
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

  // This check covers the case where useEffect might not have run yet or if redirection is pending
  // It also ensures that if currentUser becomes null after initial load (e.g. manual logout in another tab, token expiry if handled this way), access is revoked.
  if (!currentUser || !currentUser.isAdmin) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // If user is an admin and auth is not loading, render the children
  return <>{children}</>;
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Award, UserCircle2 } from "lucide-react";
import { mockUser } from "@/lib/mock-data"; // For demo purposes, using static mock user

// Note: This header currently uses static mock data for the user avatar and initial token balance.
// In a real application, this would fetch the authenticated user's data, likely via a
// context provider or server session, and conditionally render based on auth state.
// The profile page simulates auth, but this header doesn't reflect that state change directly.

export function AppHeader() {
  // Using the static mockUser which now has tokenBalance: 0 initially.
  // The balance displayed here won't update automatically based on simulated submissions
  // unless the page causing the header re-render fetches updated user data.
  const displayUser = mockUser; // In real app: fetch authenticated user or use context

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <Link href="/" className="flex items-center gap-2">
          <Award className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Snaggy</h1>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {/* Conditionally render tokens if user is "logged in" (always true in this mock setup) */}
        {displayUser && (
          <>
            <div className="flex items-center gap-1 text-sm font-medium text-accent">
              <Award className="h-5 w-5" />
              {/* Display the token balance from the (mock) user data */}
              <span>{displayUser.tokenBalance.toLocaleString()} Tokens</span>
            </div>
            <Link href="/profile">
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={displayUser.avatarUrl} alt={displayUser.name} data-ai-hint="profile avatar" />
                <AvatarFallback>
                  {displayUser.name?.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
            </Link>
          </>
        )}
        {/* Placeholder if no user is "logged in" (not currently possible with this setup) */}
         {/* {!displayUser && (
           <Button asChild variant="outline" size="sm">
             <Link href="/profile">Log In</Link>
           </Button>
         )} */}
      </div>
    </header>
  );
}

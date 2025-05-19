
'use client'; 

import Link from "next/link";
import { Button } from "@/components/ui/button.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { SidebarTrigger } from "@/components/ui/sidebar.jsx";
import { Award, UserCircle2, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/auth-context.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";


export function AppHeader() {
  const { currentUser, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="flex items-center gap-2">
            <Award className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Telebounties</h1>
          </Link>
        </div>
        <Skeleton className="h-9 w-9 rounded-full bg-muted" /> {/* Skeleton Avatar */}
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <Link href="/" className="flex items-center gap-2">
          <Award className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Telebounties</h1>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {isAuthenticated && currentUser ? (
          <>
            <div className="flex items-center gap-1 text-sm font-medium text-accent">
              <Award className="h-5 w-5" />
              <span>{currentUser.tokenBalance.toLocaleString()} HTR</span>
            </div>
            <Link href="/profile">
              <Avatar className="h-9 w-9 cursor-pointer">
                {currentUser.avatarUrl ? (
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name || 'User avatar'} data-ai-hint="profile avatar" />
                ) : null }
                <AvatarFallback>
                  {currentUser.name?.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
            </Link>
          </>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">
               <LogIn className="mr-2 h-4 w-4" /> Log In / Sign Up
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}

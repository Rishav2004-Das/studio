import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Award, UserCircle2 } from "lucide-react";
import { mockUser } from "@/lib/mock-data"; // For demo purposes

export function AppHeader() {
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
        <div className="flex items-center gap-1 text-sm font-medium text-accent">
          <Award className="h-5 w-5" />
          <span>{mockUser.tokenBalance} Tokens</span>
        </div>
        <Link href="/profile">
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} data-ai-hint="profile avatar" />
            <AvatarFallback>
              <UserCircle2 className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}

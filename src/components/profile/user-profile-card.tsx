import type { User } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, UserCircle2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserProfileCardProps {
  user: User;
  onAvatarClick?: () => void; // Optional callback for when avatar is clicked
  isOwnProfile?: boolean; // Flag to indicate if this is the logged-in user's profile
}

export function UserProfileCard({ user, onAvatarClick, isOwnProfile = false }: UserProfileCardProps) {
  const fallbackInitials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 />;

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="relative">
          <Avatar
            className={cn(
              "h-24 w-24 border-4 border-primary sm:h-28 sm:w-28",
              isOwnProfile && "cursor-pointer hover:opacity-80 transition-opacity"
            )}
            onClick={isOwnProfile ? onAvatarClick : undefined}
            title={isOwnProfile ? "Click to change photo" : ""}
          >
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name || 'User avatar'} data-ai-hint="user avatar" />
            ) : null }
            <AvatarFallback className="text-3xl">
              {fallbackInitials}
            </AvatarFallback>
          </Avatar>
          {isOwnProfile && (
            <div className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-90 transition-opacity group-hover:opacity-100 pointer-events-none">
              <Camera className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <CardTitle className="text-3xl font-bold">{user.name}</CardTitle>
          <CardDescription className="mt-2 flex items-center justify-center text-lg text-accent sm:justify-start">
            <Award className="mr-2 h-6 w-6" />
            <span className="font-semibold">{user.tokenBalance.toLocaleString()} Tokens Earned</span>
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

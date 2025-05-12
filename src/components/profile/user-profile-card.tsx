
import type { User } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, UserCircle2, Camera, Loader2 } from "lucide-react"; // Added Loader2
import { cn } from "@/lib/utils";

interface UserProfileCardProps {
  user: User;
  onAvatarClick?: () => void; 
  isOwnProfile?: boolean; 
  isUpdatingAvatar?: boolean; // New prop
}

export function UserProfileCard({ user, onAvatarClick, isOwnProfile = false, isUpdatingAvatar = false }: UserProfileCardProps) {
  const fallbackInitials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 />;

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="relative group"> {/* Added group for hover effect on camera icon */}
          <Avatar
            className={cn(
              "h-24 w-24 border-4 border-primary sm:h-28 sm:w-28",
              isOwnProfile && !isUpdatingAvatar && "cursor-pointer hover:opacity-80 transition-opacity",
              isUpdatingAvatar && "opacity-50" // Dim avatar during update
            )}
            onClick={isOwnProfile && !isUpdatingAvatar ? onAvatarClick : undefined}
            title={isOwnProfile && !isUpdatingAvatar ? "Click to change photo" : (isUpdatingAvatar ? "Updating..." : "")}
          >
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name || 'User avatar'} data-ai-hint="user avatar" />
            ) : null }
            <AvatarFallback className="text-3xl">
              {fallbackInitials}
            </AvatarFallback>
          </Avatar>
          {isOwnProfile && (
            <div className={cn(
                "absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity",
                !isUpdatingAvatar && "opacity-70 group-hover:opacity-100",
                isUpdatingAvatar ? "opacity-100" : "pointer-events-none group-hover:pointer-events-auto"
              )}>
              {isUpdatingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </div>
          )}
        </div>
        <div className="flex-1">
          <CardTitle className="text-3xl font-bold">{user.name}</CardTitle>
          <CardDescription className="mt-2 flex items-center justify-center text-lg text-accent sm:justify-start">
            <Award className="mr-2 h-6 w-6" />
            <span className="font-semibold">{user.tokenBalance.toLocaleString()} Tokens Earned</span>
          </CardDescription>
          {user.email && (
            <p className="mt-1 text-sm text-muted-foreground text-center sm:text-left">{user.email}</p>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

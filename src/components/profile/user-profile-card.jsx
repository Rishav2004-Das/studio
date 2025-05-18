
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { Award, UserCircle2 } from "lucide-react"; // Removed Camera, Loader2
import { cn } from "@/lib/utils.js";


export function UserProfileCard({ user, isOwnProfile = false }) { // Removed onAvatarClick, isUpdatingAvatar
  const fallbackInitials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 />;

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="relative group"> 
          <Avatar
            className={cn(
              "h-24 w-24 border-4 border-primary sm:h-28 sm:w-28"
              // Removed cursor-pointer and opacity classes as click is disabled
            )}
            // onClick removed
            // title removed
          >
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name || 'User avatar'} data-ai-hint="user avatar" />
            ) : null }
            <AvatarFallback className="text-3xl">
              {fallbackInitials}
            </AvatarFallback>
          </Avatar>
          {/* Removed camera icon overlay as uploads are disabled */}
          {/* {isOwnProfile && ( ... )} */}
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

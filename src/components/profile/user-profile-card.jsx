
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { Award, UserCircle2, DollarSign } from "lucide-react"; 
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.jsx";


export function UserProfileCard({ user, isOwnProfile = false, onRedeemClick }) { 
  const fallbackInitials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 />;

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <div className="relative group"> 
          <Avatar
            className={cn(
              "h-24 w-24 border-4 border-primary sm:h-28 sm:w-28"
            )}
          >
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name || 'User avatar'} data-ai-hint="user avatar" />
            ) : null }
            <AvatarFallback className="text-3xl">
              {fallbackInitials}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <CardTitle className="text-3xl font-bold">{user.name}</CardTitle>
          <CardDescription className="mt-2 flex items-center justify-center text-lg text-accent sm:justify-start">
            <Award className="mr-2 h-6 w-6" />
            <span className="font-semibold">{user.tokenBalance.toLocaleString()} HTR Earned</span>
          </CardDescription>
          {user.email && (
            <p className="mt-1 text-sm text-muted-foreground text-center sm:text-left">{user.email}</p>
          )}
        </div>
        {isOwnProfile && (
          <div className="self-center sm:self-end">
            <Button onClick={onRedeemClick}>
              <DollarSign className="mr-2 h-4 w-4" />
              Redeem HTR
            </Button>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

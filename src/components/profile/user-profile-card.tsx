import type { User } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, UserCircle2 } from "lucide-react";

interface UserProfileCardProps {
  user: User;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <Avatar className="h-24 w-24 border-4 border-primary sm:h-28 sm:w-28">
          <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" />
          <AvatarFallback className="text-3xl">
             {user.name.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 />}
          </AvatarFallback>
        </Avatar>
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

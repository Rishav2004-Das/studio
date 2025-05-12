import type { LeaderboardEntry } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Award, UserCircle2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardItemProps {
  entry: LeaderboardEntry;
}

export function LeaderboardItem({ entry }: LeaderboardItemProps) {
  const isTopThree = entry.rank <= 3;
  let rankIndicatorColor = "text-muted-foreground";
  if (entry.rank === 1) rankIndicatorColor = "text-yellow-400"; // Gold
  else if (entry.rank === 2) rankIndicatorColor = "text-slate-400"; // Silver
  else if (entry.rank === 3) rankIndicatorColor = "text-amber-600"; // Bronze

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border p-4 shadow-sm transition-all",
        isTopThree ? "bg-card hover:bg-muted/60 border-primary/30" : "bg-card hover:bg-muted/50"
      )}
    >
      <div className="flex w-10 flex-col items-center">
        {isTopThree ? (
           <Trophy className={cn("h-6 w-6", rankIndicatorColor)} />
        ) : (
          <span className="text-lg font-bold text-muted-foreground">{entry.rank}</span>
        )}
      </div>

      <Avatar className="h-12 w-12 border-2 border-primary/50">
        <AvatarImage src={entry.userAvatarUrl} alt={entry.userName} data-ai-hint="leaderboard avatar" />
        <AvatarFallback>
          {entry.userName.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 />}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <p className={cn("font-semibold", isTopThree ? "text-lg text-primary" : "text-md text-foreground")}>
          {entry.userName}
        </p>
      </div>

      <div className="flex items-center text-lg font-bold text-accent">
        <Award className="mr-1.5 h-5 w-5" />
        <span>{entry.totalTokens.toLocaleString()}</span>
      </div>
    </div>
  );
}

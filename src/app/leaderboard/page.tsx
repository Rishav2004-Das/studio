import { LeaderboardItem } from "@/components/leaderboard/leaderboard-item";
import { mockLeaderboard } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Leaderboard | Snaggy",
  description: "See who's at the top of the Snaggy leaderboard by token earnings.",
};

export default function LeaderboardPage() {
  const leaderboardEntries = mockLeaderboard.sort((a, b) => a.rank - b.rank);

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex flex-col items-center text-center sm:flex-row sm:items-end sm:text-left">
        <Trophy className="mb-4 h-16 w-16 text-primary sm:mb-0 sm:mr-6" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Leaderboard
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Check out the top earners in the Snaggy community!
          </p>
        </div>
      </div>

      {leaderboardEntries.length > 0 ? (
        <Card className="shadow-xl">
          <CardContent className="p-0">
            <div className="space-y-0"> {/* Removed space-y-4 for direct item borders */}
              {leaderboardEntries.map((entry, index) => (
                <div key={entry.userId} className={index !== 0 ? "border-t" : ""}>
                  <LeaderboardItem entry={entry} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              The leaderboard is currently empty. Start completing tasks to climb the ranks!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

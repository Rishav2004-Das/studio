import { UserProfileCard } from "@/components/profile/user-profile-card";
import { SubmissionHistoryItem } from "@/components/profile/submission-history-item";
import { mockUser, getSubmissionsByUserId, getTaskById } from "@/lib/mock-data";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | Snaggy",
  description: "View your Snaggy profile, token balance, and submission history.",
};

export default function ProfilePage() {
  const user = mockUser; // In a real app, this would be fetched based on auth
  const submissions = getSubmissionsByUserId(user.id);

  return (
    <div className="container mx-auto">
      <UserProfileCard user={user} />

      <Separator className="my-8" />

      <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Submission History
      </h2>
      {submissions.length > 0 ? (
        <div className="space-y-6">
          {submissions.map((submission) => {
            const task = getTaskById(submission.taskId);
            if (!task) return null; // Should not happen with mock data
            return (
              <SubmissionHistoryItem
                key={submission.id}
                submission={submission}
                task={task}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          You haven't made any submissions yet. Complete some tasks to see them here!
        </p>
      )}
    </div>
  );
}

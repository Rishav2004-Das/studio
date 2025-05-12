import { UserProfileCard } from "@/components/profile/user-profile-card";
import { SubmissionHistoryItem } from "@/components/profile/submission-history-item";
import { mockUser, getSubmissionsByUserId, getTaskById } from "@/lib/mock-data";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";
import type { User } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";


export const metadata: Metadata = {
  title: "My Profile | Snaggy",
  description: "View your Snaggy profile, token balance, and submission history.",
};

// Simulates fetching the current user. In a real app, this would involve auth.
// Returns mockUser for now, so the profile will always be displayed.
// To test the "not logged in" state, this function could be made to return null.
function getCurrentUser(): User | null {
  return mockUser;
}

export default function ProfilePage() {
  const user = getCurrentUser();

  if (!user) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <Alert className="max-w-md shadow-md">
          <InfoIcon className="h-5 w-5" />
          <AlertTitle>Profile Unavailable</AlertTitle>
          <AlertDescription>
            You need to be logged in to view your profile and submission history.
            <Button asChild className="mt-4 w-full sm:w-auto">
              <Link href="/">Explore Tasks</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
                taskTitle={task.title} // Pass only the task title
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground">
            You haven't made any submissions yet.
          </p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/">Complete some tasks</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
             to see them here!
          </p>
        </div>
      )}
    </div>
  );
}

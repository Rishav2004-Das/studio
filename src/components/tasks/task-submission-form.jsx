
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button.jsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useToast } from "@/hooks/use-toast.js";
import { Send, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/auth-context.jsx";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { useState } from "react";
import { db } from '@/lib/firebase/config.js'; // Removed 'storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// Removed storage-related imports: ref, uploadBytes, getDownloadURL


const submissionFormSchema = z.object({
  caption: z.string().min(10, {
    message: "Caption must be at least 10 characters.",
  }).max(500, {
    message: "Caption must not exceed 500 characters.",
  }),
  // File field is no longer part of the form
});


export function TaskSubmissionForm({ taskId, taskTitle, taskTokens }) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed fileToUpload state

  const form = useForm({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      caption: "",
      // file: undefined, // File field removed
    },
  });

  async function onSubmit(data) {
    if (!currentUser || !currentUser.id) {
      toast({ title: "Error", description: "User not found. Please log in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    // let fileUrl = null; // File URL will always be null now

    try {
      // File upload logic removed
      // if (fileToUpload) { ... }

      const submissionData = {
        userId: currentUser.id,
        submitterName: currentUser.name || "Unknown User",
        taskId: taskId,
        taskTitle: taskTitle,
        originalTaskTokens: taskTokens || 0,
        caption: data.caption,
        fileUrl: null, // Explicitly set to null as uploads are disabled
        submittedAt: serverTimestamp(),
        status: "Pending",
        tokensAwarded: 0,
      };

      await addDoc(collection(db, "submissions"), submissionData);

      toast({
        title: "Submission Successful!",
        description: `Your submission for "${taskTitle}" has been received and saved to the database for review. File uploads are currently disabled.`,
        variant: "default",
        duration: 7000,
      });
      form.reset();
      // setFileToUpload(null); // No longer needed
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="border-primary/50 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-primary">
            <LogIn className="h-5 w-5" />
            Login Required
          </CardTitle>
          <CardDescription>
            You need to be logged in to submit tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Please log in or create an account to participate and earn tokens.
          </p>
          <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/profile">
              <LogIn className="mr-2 h-4 w-4" /> Log In / Sign Up
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caption / Details</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide details about your submission, links, or any relevant information."
                  className="min-h-[120px] resize-y"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Input FormField removed */}
        <div className="p-4 border border-dashed rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
                File uploads are currently disabled for task submissions.
            </p>
        </div>


        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : <><Send className="mr-2 h-4 w-4" /> Submit Task</>}
        </Button>
      </form>
    </Form>
  );
}

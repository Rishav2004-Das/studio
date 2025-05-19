
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
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useToast } from "@/hooks/use-toast.js";
import { Send, LogIn, Link as LinkIcon } from "lucide-react"; // Changed Paperclip to LinkIcon
import { useAuth } from "@/contexts/auth-context.jsx";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { useState } from "react";
import { db } from '@/lib/firebase/config.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Schema for task submission, fileLink is now optional
const submissionFormSchema = z.object({
  caption: z.string().min(10, {
    message: "Caption must be at least 10 characters.",
  }).max(500, {
    message: "Caption must not exceed 500 characters.",
  }),
  fileLink: z.string().url({ message: "Please enter a valid URL for the file link." }).optional().or(z.literal('')),
});


export function TaskSubmissionForm({ taskId, taskTitle, taskTokens }) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      caption: "",
      fileLink: "",
    },
  });

  async function onSubmit(data) {
    if (!currentUser || !currentUser.id) {
      toast({ title: "Error", description: "User not found. Please log in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    console.log("[TaskSubmission] Form data submitted:", data);

    try {
      const submissionData = {
        userId: currentUser.id,
        submitterName: currentUser.name || "Unknown User",
        taskId: taskId,
        taskTitle: taskTitle,
        originalTaskTokens: Number(taskTokens) || 0,
        caption: data.caption,
        fileLink: data.fileLink || null, // Store the link or null
        submittedAt: serverTimestamp(),
        status: "Pending", // Submissions are now pending admin review
        tokensAwarded: 0,   // HTR awarded by admin
      };

      console.log("[TaskSubmission] Attempting to add submission to Firestore:", submissionData);
      await addDoc(collection(db, "submissions"), submissionData);
      console.log("[TaskSubmission] Firestore document added successfully.");

      toast({
        title: "Submission Successful!",
        description: `Your submission for "${taskTitle}" has been received for review.`,
        variant: "default",
        duration: 7000,
      });
      form.reset();
    } catch (error) {
      console.error("[TaskSubmission] Full submission error object:", error);
      let description = "Could not submit your task. Please try again.";
      
      if (error.name === 'FirebaseError') {
        description = `Submission failed: ${error.message} (Code: ${error.code || 'N/A'}).`;
        if (error.code === 'permission-denied') { 
            description = `Submission to database failed: Permission denied. Please check your Firestore security rules for the 'submissions' collection. (Code: ${error.code})`;
        }
      } else if (error instanceof z.ZodError) {
        description = "Invalid submission data. Please check the form fields.";
      }
      
      toast({
        title: "Submission Failed",
        description: description,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      console.log("[TaskSubmission] Reached finally block. Setting isSubmitting to false.");
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
            Please log in or create an account to participate and earn HTR.
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
                  placeholder="Provide details about your submission, or any relevant information."
                  className="min-h-[120px] resize-y"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fileLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="file-link-input" className="flex items-center">
                <LinkIcon className="mr-2 h-4 w-4" />
                Link to your submission file (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  id="file-link-input"
                  type="url"
                  placeholder="https://your-file-host.com/your-file"
                  {...field}
                  className="block w-full text-sm text-muted-foreground"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
               <p className="text-xs text-muted-foreground mt-1">
                Upload your file to a service like Google Drive, Dropbox, Imgur, etc., and paste the shareable link here.
              </p>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : <><Send className="mr-2 h-4 w-4" /> Submit Task for Review</>}
        </Button>
      </form>
    </Form>
  );
}

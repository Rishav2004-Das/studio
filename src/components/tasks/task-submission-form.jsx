
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
import { Send, LogIn, Info } from "lucide-react"; // Removed Paperclip
import { useAuth } from "@/contexts/auth-context.jsx";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { useState } from "react"; // Removed useRef
import { db } from '@/lib/firebase/config.js'; // Removed storage
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// Removed storage-related imports: ref, uploadBytes, getDownloadURL

// Updated schema to remove file input
const submissionFormSchema = z.object({
  caption: z.string().min(10, {
    message: "Caption must be at least 10 characters.",
  }).max(500, {
    message: "Caption must not exceed 500 characters.",
  }),
});


export function TaskSubmissionForm({ taskId, taskTitle, taskTokens }) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed fileToUpload and fileInputRef

  const form = useForm({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      caption: "",
      // file: undefined, // Removed file default value
    },
  });

  async function onSubmit(data) {
    if (!currentUser || !currentUser.id) {
      toast({ title: "Error", description: "User not found. Please log in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    // Removed fileUrl and uploadedFileName logic

    try {
      console.log("[TaskSubmission] Form data submitted (no file):", data);
      // Removed file upload logic

      const submissionData = {
        userId: currentUser.id,
        submitterName: currentUser.name || "Unknown User",
        taskId: taskId,
        taskTitle: taskTitle,
        originalTaskTokens: taskTokens || 0,
        caption: data.caption,
        fileUrl: null, // No file URL as uploads are disabled
        submittedAt: serverTimestamp(),
        status: "Pending",
        tokensAwarded: 0,
      };

      console.log("[TaskSubmission] Attempting to add submission to Firestore:", submissionData);
      await addDoc(collection(db, "submissions"), submissionData);
      console.log("[TaskSubmission] Firestore document added successfully.");

      toast({
        title: "Submission Successful!",
        description: `Your submission for "${taskTitle}" has been received for review. File uploads are currently disabled.`,
        variant: "default",
        duration: 7000,
      });
      form.reset();
      // Removed fileToUpload and fileInputRef reset
    } catch (error) {
      console.error("[TaskSubmission] Full submission error object:", error);
      let description = "Could not submit your task. Please try again.";
      
      if (error.name === 'FirebaseError') {
        description = `Submission failed: ${error.message} (Code: ${error.code || 'N/A'}).`;
         if (error.code === 'permission-denied') { // Firestore permission denied
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

        {/* File input section removed */}
        <div className="p-4 border border-dashed rounded-md bg-muted/50 text-center">
            <Info className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
                File uploads are currently disabled for task submissions.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                Your submission will be based on the caption/details provided above.
            </p>
        </div>

        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : <><Send className="mr-2 h-4 w-4" /> Submit Task</>}
        </Button>
      </form>
    </Form>
  );
}

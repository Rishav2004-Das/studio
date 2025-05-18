
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
import { Send, LogIn, Paperclip, Info } from "lucide-react";
import { useAuth } from "@/contexts/auth-context.jsx";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { useState, useRef } from "react";
import { db, storage } from '@/lib/firebase/config.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Schema for task submission, file is now optional client-side
const submissionFormSchema = z.object({
  caption: z.string().min(10, {
    message: "Caption must be at least 10 characters.",
  }).max(500, {
    message: "Caption must not exceed 500 characters.",
  }),
  file: z.instanceof(File).optional().nullable(), // Allow File, undefined, or null
});


export function TaskSubmissionForm({ taskId, taskTitle, taskTokens }) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const fileInputRef = useRef(null); // To reset file input

  const form = useForm({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      caption: "",
      file: null,
    },
  });

  async function onSubmit(data) {
    if (!currentUser || !currentUser.id) {
      toast({ title: "Error", description: "User not found. Please log in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    console.log("[TaskSubmission] Form data submitted:", data);
    console.log("[TaskSubmission] File to upload state:", fileToUpload);

    let fileUrl = null;
    let uploadedFileName = null;

    try {
      console.log("[TaskSubmission] Entered try block.");
      if (fileToUpload) {
        console.log(`[TaskSubmission] File selected: ${fileToUpload.name}, Size: ${fileToUpload.size}`);
        const storageRef = ref(storage, `submissions/${currentUser.id}/${taskId}/${fileToUpload.name}`);
        
        console.log("[TaskSubmission] Attempting to upload to Firebase Storage...");
        await uploadBytes(storageRef, fileToUpload);
        console.log("[TaskSubmission] Firebase Storage upload COMPLETE.");

        console.log("[TaskSubmission] Attempting to get download URL...");
        fileUrl = await getDownloadURL(storageRef);
        console.log("[TaskSubmission] Download URL obtained:", fileUrl);
        uploadedFileName = fileToUpload.name;
      } else {
        console.log("[TaskSubmission] No file selected for upload.");
      }

      const submissionData = {
        userId: currentUser.id,
        submitterName: currentUser.name || "Unknown User",
        taskId: taskId,
        taskTitle: taskTitle,
        originalTaskTokens: taskTokens || 0,
        caption: data.caption,
        fileUrl: fileUrl,
        fileName: uploadedFileName, // Store the file name if uploaded
        submittedAt: serverTimestamp(),
        status: "Pending",
        tokensAwarded: 0,
      };

      console.log("[TaskSubmission] Attempting to add submission to Firestore:", submissionData);
      await addDoc(collection(db, "submissions"), submissionData);
      console.log("[TaskSubmission] Firestore document added successfully.");

      toast({
        title: "Submission Successful!",
        description: `Your submission for "${taskTitle}" has been received. ${fileToUpload ? 'File uploaded.' : 'No file was uploaded.'}`,
        variant: "default",
        duration: 7000,
      });
      form.reset();
      setFileToUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input visually
      }
    } catch (error) {
      console.error("[TaskSubmission] Full submission error object:", error);
      let description = "Could not submit your task. Please try again.";
      
      if (error.name === 'FirebaseError') {
        description = `Submission failed: ${error.message} (Code: ${error.code || 'N/A'}).`;
        if (error.code === 'storage/unauthorized') {
            description = `File upload failed: You do not have permission to upload to this location. Please check Firebase Storage rules. (Code: ${error.code})`;
        } else if (error.code === 'storage/object-not-found' || error.code === 'storage/bucket-not-found') {
            description = `File upload failed: Storage path or bucket not found. Please check your Firebase Storage setup. (Code: ${error.code})`;
        } else if (error.code === 'permission-denied') { // Firestore permission denied
            description = `Submission to database failed: Permission denied. Please check your Firestore security rules for the 'submissions' collection. (Code: ${error.code})`;
        } else if (error.code && error.code.includes('cors')) {
            description = "File upload failed due to a CORS (Cross-Origin Resource Sharing) issue. This often requires configuration on your Firebase Storage bucket. Check browser console for more details.";
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

        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange, value, ...restField } }) => (
            <FormItem>
              <FormLabel htmlFor="file-input" className="flex items-center">
                <Paperclip className="mr-2 h-4 w-4" />
                Attach File (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  id="file-input"
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    onChange(file || null); // Pass file or null to react-hook-form
                    setFileToUpload(file || null);
                  }}
                  {...restField}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting ? (fileToUpload ? "Uploading & Submitting..." : "Submitting...") : <><Send className="mr-2 h-4 w-4" /> Submit Task</>}
        </Button>
      </form>
    </Form>
  );
}

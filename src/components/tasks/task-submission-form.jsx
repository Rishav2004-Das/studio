
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
import { Send, LogIn, Paperclip } from "lucide-react";
import { useAuth } from "@/contexts/auth-context.jsx";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { useState, useRef } from "react";
import { db, storage } from '@/lib/firebase/config.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const submissionFormSchema = z.object({
  caption: z.string().min(10, {
    message: "Caption must be at least 10 characters.",
  }).max(500, {
    message: "Caption must not exceed 500 characters.",
  }),
  file: z.instanceof(FileList).optional()
    .refine(files => !files || files.length === 0 || files[0].size <= 5 * 1024 * 1024, { // 5MB limit
      message: "File size must be 5MB or less."
    })
    .refine(files => !files || files.length === 0 || ["image/jpeg", "image/png", "image/gif", "application/pdf", "video/mp4"].includes(files[0].type), {
      message: "Only JPG, PNG, GIF, PDF, or MP4 files are allowed."
    }),
});


export function TaskSubmissionForm({ taskId, taskTitle, taskTokens }) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const fileInputRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      caption: "",
      file: undefined,
    },
  });

  async function onSubmit(data) {
    if (!currentUser || !currentUser.id) {
      toast({ title: "Error", description: "User not found. Please log in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    let fileUrl = null;
    let uploadedFileName = null;

    try {
      console.log("[TaskSubmission] Form data submitted:", data);
      if (fileToUpload) {
        uploadedFileName = fileToUpload.name;
        console.log(`[TaskSubmission] Attempting to upload file: ${uploadedFileName} (Size: ${fileToUpload.size} bytes, Type: ${fileToUpload.type}) to Firebase Storage...`);
        const storageRef = ref(storage, `submissions/${currentUser.id}/${taskId}/${fileToUpload.name}`);
        
        await uploadBytes(storageRef, fileToUpload);
        console.log("[TaskSubmission] Firebase Storage upload COMPLETE.");
        
        fileUrl = await getDownloadURL(storageRef);
        console.log("[TaskSubmission] Got download URL:", fileUrl);
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
        submittedAt: serverTimestamp(),
        status: "Pending",
        tokensAwarded: 0,
      };

      console.log("[TaskSubmission] Attempting to add submission to Firestore:", submissionData);
      await addDoc(collection(db, "submissions"), submissionData);
      console.log("[TaskSubmission] Firestore document added successfully.");

      toast({
        title: "Submission Successful!",
        description: `Your submission for "${taskTitle}" ${uploadedFileName ? `with file "${uploadedFileName}" ` : ''}has been received for review.`,
        variant: "default",
        duration: 7000,
      });
      form.reset();
      setFileToUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("[TaskSubmission] Full submission error object:", error);
      let description = "Could not submit your task. Please try again.";
      
      if (error.name === 'FirebaseError') {
        description = `Submission failed: ${error.message} (Code: ${error.code || 'N/A'}).`;
        if (error.code && error.code.startsWith('storage/')) {
          description = `File upload failed: ${error.message}. This could be a CORS issue on your Firebase Storage bucket or a Storage security rule. Please check your browser's developer console for more details (Network tab, CORS errors).`;
          if (error.code === 'storage/unauthorized') {
            description += " Ensure your Firebase Storage rules allow uploads to the 'submissions/' path for authenticated users.";
          }
           if (error.code === 'storage/object-not-found' && error.message.includes('does not have HTTP ok status')) {
             description = "File upload failed: CORS policy might be blocking the request. Please ensure CORS is configured correctly on your Firebase Storage bucket for your application's origin."
           }
        } else if (error.code === 'permission-denied') { // Firestore permission denied
            description = `Submission to database failed: Permission denied. Please check your Firestore security rules for the 'submissions' collection. (Code: ${error.code})`;
        }
      } else if (error instanceof z.ZodError) {
        description = "Invalid submission data. Please check the form fields.";
        // Zod errors are usually handled by FormMessage, but good to have a general catch.
      }
      
      toast({
        title: "Submission Failed",
        description: description,
        variant: "destructive",
        duration: 10000, // Longer duration for error messages
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
          render={({ field: { onChange, onBlur, name, ref: formHookRef } }) => (
            <FormItem>
              <FormLabel htmlFor="file-upload" className="flex items-center">
                <Paperclip className="mr-2 h-4 w-4" /> Attach File (Optional, Max 5MB: JPG, PNG, GIF, PDF, MP4)
              </FormLabel>
              <FormControl>
                <Input
                  id="file-upload" // Keep id for label's htmlFor association
                  type="file"
                  onBlur={onBlur}
                  name={name}
                  ref={node => {
                      formHookRef(node);
                      fileInputRef.current = node; 
                  }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFileToUpload(file);
                      onChange(e.target.files); 
                    } else {
                      setFileToUpload(null);
                      onChange(null);
                    }
                  }}
                  disabled={isSubmitting}
                  className="file:text-primary file:font-medium"
                />
              </FormControl>
              {fileToUpload && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {fileToUpload.name} ({(fileToUpload.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
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

    
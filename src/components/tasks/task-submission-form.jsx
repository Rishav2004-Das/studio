
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
import { Send, LogIn, Paperclip } from "lucide-react"; // Added Paperclip
import { useAuth } from "@/contexts/auth-context.jsx";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { useState, useRef } from "react"; // Added useRef
import { db, storage } from '@/lib/firebase/config.js'; // Added storage
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Added storage functions

// Updated schema to include an optional file
const submissionFormSchema = z.object({
  caption: z.string().min(10, {
    message: "Caption must be at least 10 characters.",
  }).max(500, {
    message: "Caption must not exceed 500 characters.",
  }),
  file: z.instanceof(FileList).optional() // File is optional
    .refine(files => !files || files.length === 0 || files[0].size <= 5 * 1024 * 1024, {
      message: "File size must be 5MB or less." // Example size limit
    })
    .refine(files => !files || files.length === 0 || ["image/jpeg", "image/png", "image/gif", "application/pdf", "video/mp4"].includes(files[0].type), {
      message: "Only JPG, PNG, GIF, PDF, or MP4 files are allowed." // Example type limit
    }),
});


export function TaskSubmissionForm({ taskId, taskTitle, taskTokens }) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null); // State for the selected file
  const fileInputRef = useRef(null); // Ref for the file input

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

    try {
      if (fileToUpload) {
        const storageRef = ref(storage, `submissions/${currentUser.id}/${taskId}/${fileToUpload.name}`);
        await uploadBytes(storageRef, fileToUpload);
        fileUrl = await getDownloadURL(storageRef);
      }

      const submissionData = {
        userId: currentUser.id,
        submitterName: currentUser.name || "Unknown User",
        taskId: taskId,
        taskTitle: taskTitle,
        originalTaskTokens: taskTokens || 0,
        caption: data.caption,
        fileUrl: fileUrl, // Save the file URL
        submittedAt: serverTimestamp(),
        status: "Pending",
        tokensAwarded: 0,
      };

      await addDoc(collection(db, "submissions"), submissionData);

      toast({
        title: "Submission Successful!",
        description: `Your submission for "${taskTitle}" ${fileToUpload ? 'with the attached file ' : ''}has been received for review.`,
        variant: "default",
        duration: 7000,
      });
      form.reset();
      setFileToUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input visually
      }
    } catch (error) {
      console.error("Submission error:", error);
      let description = "Could not submit your task. Please try again.";
      if (error.code && error.code.startsWith('storage/')) {
        description = `File upload failed: ${error.message}. Please check file size/type or network.`;
      }
      toast({
        title: "Submission Failed",
        description: description,
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

        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange, onBlur, name, ref: formRef } }) => ( // Use react-hook-form's ref
            <FormItem>
              <FormLabel htmlFor="file-upload" className="flex items-center">
                <Paperclip className="mr-2 h-4 w-4" /> Attach File (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  id="file-upload"
                  type="file"
                  onBlur={onBlur}
                  name={name}
                  ref={node => { // Combine refs
                      formRef(node); // react-hook-form's ref
                      fileInputRef.current = node; // Your local ref
                  }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFileToUpload(file);
                      onChange(e.target.files); // Pass FileList to react-hook-form
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


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
import { UploadCloud, Send, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/auth-context.jsx";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { useState } from "react";
import { db, storage } from '@/lib/firebase/config.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const submissionFormSchema = z.object({
  caption: z.string().min(10, {
    message: "Caption must be at least 10 characters.",
  }).max(500, {
    message: "Caption must not exceed 500 characters.",
  }),
  file: z.any().optional(),
});


export function TaskSubmissionForm({ taskId, taskTitle, taskTokens }) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);

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
        toast({ title: "Uploading file...", description: "Please wait." });
        const fileRef = ref(storage, `submissions/${currentUser.id}/${taskId}/${fileToUpload.name}`);
        await uploadBytes(fileRef, fileToUpload);
        fileUrl = await getDownloadURL(fileRef);
        toast({ title: "File Uploaded", description: "Your file has been uploaded successfully." });
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

      await addDoc(collection(db, "submissions"), submissionData);

      toast({
        title: "Submission Successful!",
        description: `Your submission for "${taskTitle}" has been received and saved for review.`,
        variant: "default",
      });
      form.reset();
      setFileToUpload(null);
      if (document.getElementById('file-input')) {
        document.getElementById('file-input').value = '';
      }
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

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      form.setValue("file", file); 
    } else {
      setFileToUpload(null);
      form.setValue("file", undefined);
    }
  };


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
          render={({ field }) => ( 
            <FormItem>
              <FormLabel>Upload File (Optional)</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <UploadCloud className="h-5 w-5 text-muted-foreground" />
                  <Input
                    id="file-input"
                    type="file"
                    onChange={handleFileChange} 
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary/10 file:text-primary
                      hover:file:bg-primary/20"
                    disabled={isSubmitting}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : <><Send className="mr-2 h-4 w-4" /> Submit Task</>}
        </Button>
      </form>
    </Form>
  );
}

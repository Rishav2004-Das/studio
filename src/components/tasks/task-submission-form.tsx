"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { SerializableTask } from "@/types"; // Changed from Task to SerializableTask
import { UploadCloud, Send } from "lucide-react";

const submissionFormSchema = z.object({
  caption: z.string().min(10, {
    message: "Caption must be at least 10 characters.",
  }).max(500, {
    message: "Caption must not exceed 500 characters.",
  }),
  file: z.any().optional(), // Making file optional for now, can be refined based on task requirements
});

type SubmissionFormValues = z.infer<typeof submissionFormSchema>;

interface TaskSubmissionFormProps {
  task: SerializableTask; // Changed from Task to SerializableTask
}

export function TaskSubmissionForm({ task }: TaskSubmissionFormProps) {
  const { toast } = useToast();
  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      caption: "",
      file: undefined,
    },
  });

  function onSubmit(data: SubmissionFormValues) {
    // Simulate API call
    console.log("Form submitted:", data);
    toast({
      title: "Submission Successful!",
      description: `Your submission for "${task.title}" has been received.`,
      variant: "default", // 'default' will use primary color, can also be 'destructive' or custom.
    });
    form.reset();
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditionally render file input based on task requirements if needed. For now, always show. */}
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
                    type="file"
                    onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary/10 file:text-primary
                      hover:file:bg-primary/20"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
          <Send className="mr-2 h-4 w-4" /> Submit Task
        </Button>
      </form>
    </Form>
  );
}

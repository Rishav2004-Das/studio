import { getTaskById, mockTasks } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TaskSubmissionForm } from "@/components/tasks/task-submission-form";
import { Award } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface TaskDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: TaskDetailPageProps): Promise<Metadata> {
  const task = getTaskById(params.id);
  if (!task) {
    return {
      title: "Task Not Found | Snaggy"
    }
  }
  return {
    title: `${task.title} | Snaggy`,
    description: task.description,
  };
}

export async function generateStaticParams() {
  return mockTasks.map((task) => ({
    id: task.id,
  }));
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const task = getTaskById(params.id);

  if (!task) {
    notFound();
  }

  const IconComponent = task.icon;

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden shadow-lg">
            <CardHeader className="bg-muted/30 p-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 rounded-lg bg-primary/10 p-3 text-primary">
                  <IconComponent className="h-10 w-10" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold">{task.title}</CardTitle>
                  <CardDescription className="mt-1 text-base text-muted-foreground">
                    {task.category}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6 flex items-center text-lg font-semibold text-accent">
                <Award className="mr-2 h-6 w-6" />
                <span>Earn {task.tokens} Tokens</span>
              </div>
              <h2 className="mb-3 text-xl font-semibold text-foreground">Task Description</h2>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/80">
                {task.description}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Submit Your Work</CardTitle>
              <CardDescription>Complete the form below to submit your task.</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskSubmissionForm task={task} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

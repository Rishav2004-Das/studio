import { TaskCard } from "@/components/tasks/task-card";
import { mockTasks } from "@/lib/mock-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Available Tasks | Telebounties",
  description: "Browse and complete tasks to earn tokens on Telebounties.",
};

export default function TasksPage() {
  return (
    <div className="container mx-auto">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Available Tasks
      </h1>
      {mockTasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          No tasks available at the moment. Check back soon!
        </p>
      )}
    </div>
  );
}

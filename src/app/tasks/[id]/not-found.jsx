import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function TaskNotFound() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center text-center">
      <AlertTriangle className="mb-4 h-16 w-16 text-destructive" />
      <h1 className="mb-2 text-4xl font-bold">Task Not Found</h1>
      <p className="mb-6 text-lg text-muted-foreground">
        Sorry, we couldn't find the task you're looking for.
      </p>
      <Button asChild>
        <Link href="/">Go Back to Tasks</Link>
      </Button>
    </div>
  );
}

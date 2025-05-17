
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Award, ArrowRight } from "lucide-react";
import { getIconComponent } from "@/lib/mock-data.js";


export function TaskCard({ task }) {
  const IconComponent = getIconComponent(task.icon); // Get the icon component using the helper
  return (
    <Card className="flex h-full flex-col overflow-hidden shadow-lg transition-shadow hover:shadow-xl">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <IconComponent className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-xl">{task.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{task.category}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground/80 line-clamp-3">{task.description}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between bg-muted/50 p-4">
        <div className="flex items-center text-accent">
          <Award className="mr-2 h-5 w-5" />
          <span className="font-semibold">{task.tokens} Tokens</span>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/tasks/${task.id}`}>
            View Task <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

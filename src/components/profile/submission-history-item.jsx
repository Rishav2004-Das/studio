
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, CalendarDays, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import Image from "next/image";


const statusIcons = {
  Approved: <CheckCircle className="h-5 w-5 text-green-500" />,
  Rejected: <XCircle className="h-5 w-5 text-red-500" />,
  Pending: <Clock className="h-5 w-5 text-yellow-500" />,
};

const statusColors = {
  Approved: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
  Rejected: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700",
};

export function SubmissionHistoryItem({ submission, taskTitle }) {
  return (
    <Card className="overflow-hidden shadow-md transition-shadow hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          {submission.fileUrl && (submission.fileUrl.startsWith('https://picsum.photos') || submission.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i)) && (
            <div className="relative h-32 w-full flex-shrink-0 sm:h-24 sm:w-24">
              <Image
                src={submission.fileUrl}
                alt={`Submission for ${taskTitle}`}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
                data-ai-hint="submission image"
              />
            </div>
          )}
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-primary">{taskTitle}</h3>
            <p className="mt-1 flex items-center text-xs text-muted-foreground">
              <CalendarDays className="mr-1.5 h-4 w-4" />
              Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
            </p>
            {submission.caption && (
              <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
                <FileText className="mr-1.5 inline h-4 w-4 align-text-bottom" />
                {submission.caption}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between bg-muted/30 p-3">
        <Badge variant="outline" className={`px-2.5 py-1 text-xs font-medium ${statusColors[submission.status]}`}>
          {statusIcons[submission.status]}
          <span className="ml-1.5">{submission.status}</span>
        </Badge>
        {submission.status === "Approved" && submission.tokensAwarded != null && (
          <div className="flex items-center text-sm font-semibold text-accent">
            <Award className="mr-1.5 h-4 w-4" /> +{submission.tokensAwarded} Tokens
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

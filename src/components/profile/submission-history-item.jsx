
import { Card, CardContent, CardFooter } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Award, CalendarDays, FileText, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
// Image component is removed as we are not directly displaying images from Firebase Storage


const statusIcons = {
  Approved: <CheckCircle className="h-5 w-5 text-green-500" />,
  Rejected: <XCircle className="h-5 w-5 text-red-500" />,
  Pending: <Clock className="h-5 w-5 text-yellow-500" />,
  "Auto-Credited": <CheckCircle className="h-5 w-5 text-blue-500" />, // Example for auto-credited
};

const statusColors = {
  Approved: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
  Rejected: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700",
  "Auto-Credited": "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
};

export function SubmissionHistoryItem({ submission, taskTitle }) {
  const currentStatus = submission.status || "Pending"; // Default to Pending if status is undefined

  return (
    <Card className="overflow-hidden shadow-md transition-shadow hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div>
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
            {submission.fileLink && (
               <div className="mt-2">
                <Button variant="link" asChild size="sm" className="p-0 h-auto text-xs">
                  <a href={submission.fileLink} target="_blank" rel="noopener noreferrer">
                    View Submitted File <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between bg-muted/30 p-3">
        <Badge variant="outline" className={`px-2.5 py-1 text-xs font-medium ${statusColors[currentStatus] || statusColors.Pending}`}>
          {statusIcons[currentStatus] || statusIcons.Pending}
          <span className="ml-1.5">{currentStatus}</span>
        </Badge>
        {(currentStatus === "Approved" || currentStatus === "Auto-Credited") && submission.tokensAwarded != null && submission.tokensAwarded > 0 && (
          <div className="flex items-center text-sm font-semibold text-accent">
            <Award className="mr-1.5 h-4 w-4" /> +{submission.tokensAwarded} HTR
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

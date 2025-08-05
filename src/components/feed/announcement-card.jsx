
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

export function AnnouncementCard({ announcement }) {
  return (
    <Card className="bg-primary/5 border-primary/20 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-primary">{announcement.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 mb-2">{announcement.content}</p>
        <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}

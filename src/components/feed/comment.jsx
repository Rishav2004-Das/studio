
'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export function Comment({ comment }) {
    const fallbackInitials = comment.userName?.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 />;
    
    // Check if createdAt is a Firestore Timestamp and convert it
    const date = comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date();

    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 border-2 border-primary/50">
                <AvatarFallback className="text-xs">{fallbackInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-background/50 p-3 rounded-lg">
                <div className="flex items-baseline gap-2">
                    <p className="font-semibold text-sm text-foreground">{comment.userName}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(date, { addSuffix: true })}
                    </p>
                </div>
                <p className="text-sm text-foreground/80 mt-1">{comment.text}</p>
            </div>
        </div>
    );
}

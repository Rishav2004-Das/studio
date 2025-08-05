
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, ExternalLink, UserCircle2 } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, increment, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function isImage(url) {
    if (!url) return false;
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
}

export function FeedCard({ submission }) {
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Optimistic UI state
  const [likeCount, setLikeCount] = useState(submission.likes || 0);
  const [isLiked, setIsLiked] = useState(() => {
    if (!currentUser || !submission.likers) return false;
    return submission.likers.includes(currentUser.id);
  });
  const [isProcessingLike, setIsProcessingLike] = useState(false);

  const fallbackInitials = submission.submitterName?.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 />;

  const handleLikeClick = async () => {
    if (!isAuthenticated || !currentUser) {
      toast({
        title: 'Login Required',
        description: 'You must be logged in to like a post.',
        variant: 'destructive',
      });
      return;
    }
    if(isProcessingLike) return;

    setIsProcessingLike(true);

    // Optimistic update
    const originalLikeCount = likeCount;
    const originalIsLiked = isLiked;
    
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    setIsLiked(prev => !prev);
    
    const submissionRef = doc(db, 'submissions', submission.id);

    try {
        await runTransaction(db, async (transaction) => {
            const submissionDoc = await transaction.get(submissionRef);
            if (!submissionDoc.exists()) {
                throw new Error("Submission does not exist!");
            }
            
            const currentLikers = submissionDoc.data().likers || [];
            const userHasLiked = currentLikers.includes(currentUser.id);
            
            if (userHasLiked) {
                // Unlike
                transaction.update(submissionRef, {
                    likes: increment(-1),
                    likers: arrayRemove(currentUser.id)
                });
            } else {
                // Like
                transaction.update(submissionRef, {
                    likes: increment(1),
                    likers: arrayUnion(currentUser.id)
                });
            }
        });
    } catch (error) {
        console.error("Error processing like: ", error);
        // Revert optimistic update on failure
        setLikeCount(originalLikeCount);
        setIsLiked(originalIsLiked);
        toast({
            title: 'Like Failed',
            description: 'Could not process your like. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsProcessingLike(false);
    }
  };

  return (
    <Card className="shadow-lg overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border-2 border-primary">
            {/* In a real app, user.avatarUrl would be here */}
            <AvatarFallback className="text-lg">{fallbackInitials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{submission.submitterName}</p>
            <p className="text-xs text-muted-foreground">
              Completed task: <span className="font-medium text-primary">{submission.taskTitle}</span>
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-foreground/90 mb-4 whitespace-pre-wrap">{submission.caption}</p>
        
        {isImage(submission.fileLink) ? (
            <div className="rounded-lg overflow-hidden border">
                <img 
                    src={submission.fileLink} 
                    alt={`Submission for ${submission.taskTitle}`}
                    className="w-full h-auto max-h-[500px] object-contain"
                />
            </div>
        ) : (
             <Button asChild variant="secondary" className="w-full">
                <a href={submission.fileLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Submission
                </a>
            </Button>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 p-2 flex items-center justify-start gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1.5 text-muted-foreground hover:text-rose-500"
          onClick={handleLikeClick}
          disabled={isProcessingLike}
        >
          <Heart className={cn("h-5 w-5", isLiked && "fill-rose-500 text-rose-500")} />
          <span className="font-semibold">{likeCount}</span>
        </Button>
        {/* Placeholder for comments */}
        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground">
          <MessageSquare className="h-5 w-5" />
          <span className="font-semibold">Comment</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

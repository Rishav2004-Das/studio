
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageSquare, ExternalLink, UserCircle2, Send } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, doc, updateDoc, increment, arrayUnion, arrayRemove, runTransaction, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Comment } from './comment';

function isImage(url) {
    if (!url) return false;
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
}

export function FeedCard({ submission }) {
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [likeCount, setLikeCount] = useState(submission.likes || 0);
  const [isLiked, setIsLiked] = useState(() => {
    if (!currentUser || !submission.likers) return false;
    return submission.likers.includes(currentUser.id);
  });
  const [isProcessingLike, setIsProcessingLike] = useState(false);

  // Comment state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(submission.commentCount || 0);
  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Fallback for missing submission timestamp
  if (!submission.submittedAt || !(submission.submittedAt instanceof Date)) {
    return null; 
  }

  const fallbackInitials = submission.submitterName?.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 />;

  const fetchComments = async () => {
    if (isFetchingComments) return;
    setIsFetchingComments(true);
    try {
        const commentsRef = collection(db, 'submissions', submission.id, 'comments');
        const q = query(commentsRef, orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedComments = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setComments(fetchedComments);
    } catch (error) {
        console.error("Error fetching comments: ", error);
        toast({ title: "Error", description: "Could not load comments.", variant: "destructive" });
    } finally {
        setIsFetchingComments(false);
    }
  }

  const handleToggleComments = () => {
      const willShow = !showComments;
      setShowComments(willShow);
      if (willShow && comments.length === 0) {
          fetchComments();
      }
  }

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isAuthenticated || !currentUser) {
        toast({ title: "Login Required", description: "You must be logged in to comment.", variant: "destructive"});
        return;
    }
    setIsSubmittingComment(true);
    try {
        const commentsRef = collection(db, 'submissions', submission.id, 'comments');
        const submissionRef = doc(db, 'submissions', submission.id);

        const newCommentData = {
            userId: currentUser.id,
            userName: currentUser.name,
            text: newComment,
            createdAt: serverTimestamp(),
        };
        
        await addDoc(commentsRef, newCommentData);
        await updateDoc(submissionRef, { commentCount: increment(1) });
        
        // Optimistic update client-side
        // Note: Firestore returns the server timestamp as null on the client initially
        const tempClientComment = {
            ...newCommentData,
            id: Date.now().toString(), // temporary id
            createdAt: new Date(),
        };
        setComments(prev => [...prev, tempClientComment]);
        setCommentCount(prev => prev + 1);
        setNewComment("");

    } catch (error) {
        console.error("Error posting comment: ", error);
        toast({ title: "Error", description: "Could not post your comment.", variant: "destructive" });
    } finally {
        setIsSubmittingComment(false);
    }
  }

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
                transaction.update(submissionRef, { likes: increment(-1), likers: arrayRemove(currentUser.id) });
            } else {
                transaction.update(submissionRef, { likes: increment(1), likers: arrayUnion(currentUser.id) });
            }
        });
    } catch (error) {
        console.error("Error processing like: ", error);
        setLikeCount(originalLikeCount);
        setIsLiked(originalIsLiked);
        toast({ title: 'Like Failed', description: 'Could not process your like. Please try again.', variant: 'destructive'});
    } finally {
        setIsProcessingLike(false);
    }
  };

  return (
    <Card className="shadow-lg overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 border-2 border-primary">
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
                <img src={submission.fileLink} alt={`Submission for ${submission.taskTitle}`} className="w-full h-auto max-h-[500px] object-contain" />
            </div>
        ) : (
             <Button asChild variant="secondary" className="w-full">
                <a href={submission.fileLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> View Submission
                </a>
            </Button>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 p-2 flex items-center justify-start gap-4">
        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground hover:text-rose-500" onClick={handleLikeClick} disabled={isProcessingLike}>
          <Heart className={cn("h-5 w-5", isLiked && "fill-rose-500 text-rose-500")} />
          <span className="font-semibold">{likeCount}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground" onClick={handleToggleComments}>
          <MessageSquare className="h-5 w-5" />
          <span className="font-semibold">{commentCount}</span>
        </Button>
      </CardFooter>
      {showComments && (
          <div className="p-4 bg-muted/20">
              {isAuthenticated && (
                  <form onSubmit={handlePostComment} className="flex items-center gap-2 mb-4">
                      <Input 
                          placeholder="Add a comment..." 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          disabled={isSubmittingComment}
                      />
                      <Button type="submit" size="icon" disabled={isSubmittingComment || !newComment.trim()}>
                          <Send className="h-4 w-4" />
                      </Button>
                  </form>
              )}
              <div className="space-y-3">
                  {isFetchingComments && <p className="text-xs text-muted-foreground">Loading comments...</p>}
                  {comments.map(comment => <Comment key={comment.id} comment={comment} />)}
                  {!isFetchingComments && comments.length === 0 && (
                      <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>
                  )}
              </div>
          </div>
      )}
    </Card>
  );
}

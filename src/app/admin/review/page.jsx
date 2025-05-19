
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase/config.js';
import { collection, query, where, getDocs, doc, updateDoc, runTransaction, orderBy, Timestamp, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast.js';
import { Button } from '@/components/ui/button.jsx';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Hourglass, Coins, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context.jsx';

const statusConfig = {
  Pending: { color: "bg-yellow-500 hover:bg-yellow-600", icon: <Hourglass className="mr-2 h-4 w-4" /> },
  Approved: { color: "bg-green-500 hover:bg-green-600", icon: <CheckCircle className="mr-2 h-4 w-4" /> },
  Rejected: { color: "bg-red-500 hover:bg-red-600", icon: <XCircle className="mr-2 h-4 w-4" /> },
};

export default function AdminReviewPage() {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [tokensToAward, setTokensToAward] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSubmissions = useCallback(async (status) => {
    setIsLoading(true);
    if (!currentUser || !currentUser.isAdmin) {
      console.log('[AdminReviewPage] Current user is not an admin or not available. Aborting fetch.');
      setSubmissions([]);
      setIsLoading(false);
      // Optionally, show a toast if user somehow lands here without being admin
      // though AdminLayout should prevent this.
      toast({
        title: 'Access Denied',
        description: 'You must be an admin to view this page.',
        variant: 'destructive',
      });
      return;
    }
    console.log('[AdminReviewPage] Fetching submissions for status:', status, 'as user:', JSON.stringify(currentUser, null, 2));
    try {
      const submissionsCol = collection(db, 'submissions');
      const q = query(submissionsCol, where('status', '==', status), orderBy('submittedAt', 'desc'));
      console.log('[AdminReviewPage] Firestore query object:', q);
      const querySnapshot = await getDocs(q);
      const fetchedSubmissions = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
          submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : new Date(data.submittedAt || Date.now()),
        };
      });
      setSubmissions(fetchedSubmissions);
      console.log(`[AdminReviewPage] Successfully fetched ${fetchedSubmissions.length} ${status} submissions.`);
    } catch (error) {
      console.error(`[AdminReviewPage] Error fetching ${status} submissions (full error object): `, error);
      
      let title = `Error Fetching ${status} Submissions`;
      let description = `Could not load ${status.toLowerCase()} submissions.`;

      if (error.code === 'permission-denied') {
        title = 'Permission Denied';
        description = `Could not load ${status.toLowerCase()} submissions due to a permission issue. 
        1. Please ensure your user account has the 'isAdmin' field set to 'true' (boolean) in its Firestore document. 
        2. Verify that your Firestore security rules are correctly published and allow admin access for listing submissions. 
        3. Check the browser's developer console for more detailed Firebase error messages, including any hints about missing indexes for this specific query (filtering by 'status', ordering by 'submittedAt').`;
         toast({ title, description, variant: 'destructive', duration: 20000 });
      } else if (error.code === 'failed-precondition') {
         title = 'Query Requires Index';
         description = `Could not load ${status.toLowerCase()} submissions because a Firestore index is missing. Please check the browser's developer console for a link from Firebase to create the required composite index for querying 'submissions' by 'status' and ordering by 'submittedAt'.`;
         toast({ title, description, variant: 'destructive', duration: 20000 });
      } else {
         description += " Please try again later or check the browser's developer console for more details.";
         toast({ title, description, variant: 'destructive', duration: 10000 });
      }
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, currentUser]);

  useEffect(() => {
    if (currentUser) {
        // We only fetch if the layout has confirmed the user is an admin by not redirecting.
        // AdminLayout handles the primary isAdmin check.
        // This check here is a safeguard or for cases where currentUser might change.
        if (currentUser.isAdmin) {
            console.log('[AdminReviewPage] useEffect: User is admin, calling fetchSubmissions for tab:', activeTab);
            fetchSubmissions(activeTab);
        } else {
            console.warn('[AdminReviewPage] useEffect: User is not admin. Submissions will not be fetched. AdminLayout should have redirected.');
            // Optionally, clear submissions and show a message if user somehow gets here without being admin
            setSubmissions([]);
            setIsLoading(false);
        }
    } else {
        console.log('[AdminReviewPage] useEffect: Current user not available yet, deferring submission fetch.');
        setIsLoading(false); // Don't show infinite loading if no user
    }
  }, [activeTab, fetchSubmissions, currentUser]);

  const handleApproveClick = (submission) => {
    setSelectedSubmission(submission);
    setTokensToAward(submission.originalTaskTokens || 0);
    setIsApproveDialogOpen(true);
  };

  const handleRejectClick = (submission) => {
    setSelectedSubmission(submission);
    setIsRejectDialogOpen(true);
  };

  const processApproval = async () => {
    if (!selectedSubmission || tokensToAward < 0) {
      toast({ title: "Invalid data", description: "Submission or HTR amount is invalid.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const submissionRef = doc(db, 'submissions', selectedSubmission.id);
      const userRef = doc(db, 'users', selectedSubmission.userId);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error(`User document ${selectedSubmission.userId} not found.`);
        }

        transaction.update(submissionRef, {
          status: 'Approved',
          tokensAwarded: Number(tokensToAward),
          reviewedAt: serverTimestamp(),
        });

        transaction.update(userRef, {
          tokenBalance: increment(Number(tokensToAward)),
        });
      });

      toast({
        title: 'Submission Approved',
        description: `${selectedSubmission.taskTitle} by ${selectedSubmission.submitterName} approved. ${tokensToAward} HTR awarded.`,
      });
      setIsApproveDialogOpen(false);
      setSelectedSubmission(null);
      setTokensToAward(0);
      fetchSubmissions(activeTab); 
    } catch (error) {
      console.error("[AdminReviewPage] Error approving submission: ", error);
      toast({
        title: 'Approval Failed',
        description: `Could not approve submission. ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processRejection = async () => {
    if (!selectedSubmission) return;
    setIsProcessing(true);
    try {
      const submissionRef = doc(db, 'submissions', selectedSubmission.id);
      await updateDoc(submissionRef, {
        status: 'Rejected',
        tokensAwarded: 0, 
        reviewedAt: serverTimestamp(),
      });
      toast({
        title: 'Submission Rejected',
        description: `${selectedSubmission.taskTitle} by ${selectedSubmission.submitterName} has been rejected.`,
      });
      setIsRejectDialogOpen(false);
      setSelectedSubmission(null);
      fetchSubmissions(activeTab); 
    } catch (error) {
      console.error("[AdminReviewPage] Error rejecting submission: ", error);
      toast({
        title: 'Rejection Failed',
        description: `Could not reject submission. ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 tracking-tight text-foreground">Review Submissions</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          {Object.keys(statusConfig).map(status => (
            <TabsTrigger key={status} value={status} className="gap-2">
              {statusConfig[status].icon} {status}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">No {activeTab.toLowerCase()} submissions found.</p>
          <p className="text-sm text-muted-foreground">
            This could be because there are no submissions in this category, or there was an issue fetching them.
            If you are an admin and expect to see submissions, please check the browser's developer console for any specific error messages from Firebase, 
            especially regarding permissions or missing Firestore indexes for querying by 'status' and ordering by 'submittedAt'.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Title</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Caption</TableHead>
                <TableHead>File Link</TableHead>
                {activeTab === 'Approved' && <TableHead className="text-right">HTR Awarded</TableHead>}
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.taskTitle}</TableCell>
                  <TableCell>{submission.submitterName}</TableCell>
                  <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="max-w-xs truncate">{submission.caption}</TableCell>
                  <TableCell>
                    {submission.fileLink ? (
                      <Button variant="link" asChild size="sm">
                        <a href={submission.fileLink} target="_blank" rel="noopener noreferrer">
                          View Submitted File <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No link</span>
                    )}
                  </TableCell>
                  {activeTab === 'Approved' && (
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-accent text-accent-foreground">
                         <Coins className="mr-1.5 h-3 w-3" />{submission.tokensAwarded}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    {submission.status === 'Pending' && (
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleApproveClick(submission)} disabled={isProcessing}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleRejectClick(submission)} disabled={isProcessing}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {submission.status === 'Approved' && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Approved</Badge>}
                    {submission.status === 'Rejected' && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">Rejected</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Submission?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm approval for &quot;{selectedSubmission?.taskTitle}&quot; by {selectedSubmission?.submitterName}.
              Enter the amount of HTR to award. Original task HTR: {selectedSubmission?.originalTaskTokens || 0}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="tokens-awarded">HTR to Award</Label>
            <Input
              id="tokens-awarded"
              type="number"
              value={tokensToAward}
              onChange={(e) => setTokensToAward(e.target.valueAsNumber >= 0 ? e.target.valueAsNumber : 0)}
              min="0"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} onClick={() => {setSelectedSubmission(null); setTokensToAward(0);}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={processApproval} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? 'Processing...' : 'Approve & Award HTR'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Submission?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject &quot;{selectedSubmission?.taskTitle}&quot; by {selectedSubmission?.submitterName}? This action cannot be undone easily.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} onClick={() => setSelectedSubmission(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={processRejection} disabled={isProcessing} className="bg-red-600 hover:bg-red-700">
              {isProcessing ? 'Processing...' : 'Confirm Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

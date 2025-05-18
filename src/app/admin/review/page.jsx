
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
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Hourglass, Coins } from 'lucide-react';

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

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [tokensToAward, setTokensToAward] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSubmissions = useCallback(async (status) => {
    setIsLoading(true);
    try {
      const submissionsCol = collection(db, 'submissions');
      // This admin query requires a composite index on 'status' (asc/desc) and 'submittedAt' (desc)
      // This is different from the index (userId, submittedAt) used for user profiles.
      const q = query(submissionsCol, where('status', '==', status), orderBy('submittedAt', 'desc'));
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
    } catch (error) {
      console.error(`Error fetching ${status} submissions (full error object): `, error);
      let title = 'Error Fetching Submissions';
      let description = `Could not load ${status.toLowerCase()} submissions.`;

      if (error.code === 'failed-precondition') {
        description += ` This often means a required Firestore index is missing for the admin query (filtering by 'status' and ordering by 'submittedAt'). Please check your browser's developer console (usually under the "Console" or "Network" tab) for a message from Firebase with a specific link to create this new index. It will look like 'https://console.firebase.google.com/project/your-project-id/firestore/indexes?create_composite=...'`;
      } else if (error.code === 'permission-denied') {
        description += ` Firebase reported 'permission-denied'. This could be due to several reasons:
        1. Your account does not have 'isAdmin: true' in its Firestore 'users' document.
        2. Your Firestore Security Rules do not correctly grant admin access for this specific query.
        3. **VERY COMMON:** This 'permission-denied' error is actually masking a **MISSING FIRESTORE INDEX** required for the admin query (which filters by 'status' and orders by 'submittedAt').
        **ACTION REQUIRED: Please open your BROWSER'S DEVELOPER CONSOLE (usually by pressing F12, then go to the 'Console' tab). Look for a detailed Firebase error message. It often provides a DIRECT LINK to create the required index in your Firebase project.**
        The link will look like: 'https://console.firebase.google.com/project/YOUR-PROJECT-ID/firestore/indexes?create_composite=...'
        Creating this specific index (for 'status' and 'submittedAt') often resolves this 'permission-denied' error for admin queries.`;
      } else {
        description += ` ${error.message || 'An unknown error occurred.'} Check the browser's developer console for more details, including potential links to create Firestore indexes for the admin query (on 'status' and 'submittedAt').`;
      }
      
      toast({
        title: title,
        description: description,
        variant: 'destructive',
        duration: 30000, // Increased duration for more complex message
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubmissions(activeTab);
  }, [activeTab, fetchSubmissions]);

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
      toast({ title: "Invalid data", description: "Submission or token amount is invalid.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      await runTransaction(db, async (transaction) => {
        const submissionRef = doc(db, 'submissions', selectedSubmission.id);
        const userRef = doc(db, 'users', selectedSubmission.userId);

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
        description: `${selectedSubmission.taskTitle} by ${selectedSubmission.submitterName} approved. ${tokensToAward} tokens awarded.`,
      });
      setIsApproveDialogOpen(false);
      setSelectedSubmission(null);
      setTokensToAward(0);
      fetchSubmissions(activeTab); 
    } catch (error) {
      console.error("Error approving submission: ", error);
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
        tokensAwarded: 0, // Explicitly set to 0
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
      console.error("Error rejecting submission: ", error);
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
          <p className="text-sm text-muted-foreground">Check back later or select a different status.</p>
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
                <TableHead>File</TableHead>
                {activeTab === 'Approved' && <TableHead className="text-right">Tokens Awarded</TableHead>}
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
                    {submission.fileUrl ? (
                      <Button variant="link" asChild size="sm">
                        <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                          View File <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No file</span>
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
              Enter the number of tokens to award. Original task tokens: {selectedSubmission?.originalTaskTokens || 0}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="tokens-awarded">Tokens to Award</Label>
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
              {isProcessing ? 'Processing...' : 'Approve & Award'}
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

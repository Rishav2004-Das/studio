
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
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Hourglass, Coins, ServerCrash, DollarSign, Ban } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context.jsx';

const statusConfig = {
  Pending: { color: "bg-yellow-500 hover:bg-yellow-600", icon: <Hourglass className="mr-2 h-4 w-4" /> },
  Approved: { color: "bg-green-500 hover:bg-green-600", icon: <CheckCircle className="mr-2 h-4 w-4" /> },
  Rejected: { color: "bg-red-500 hover:bg-red-600", icon: <XCircle className="mr-2 h-4 w-4" /> },
};

const redemptionStatusConfig = {
  Pending: { color: "bg-yellow-500 hover:bg-yellow-600", icon: <Hourglass className="mr-2 h-4 w-4" /> },
  Completed: { color: "bg-green-500 hover:bg-green-600", icon: <CheckCircle className="mr-2 h-4 w-4" /> },
  Denied: { color: "bg-red-500 hover:bg-red-600", icon: <Ban className="mr-2 h-4 w-4" /> },
}

export default function AdminReviewPage() {
  const [submissions, setSubmissions] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [isPageLoading, setPageIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending'); // For submissions
  const [activeSubTab, setActiveSubTab] = useState('Submissions'); // For main tabs (Submissions vs Redemptions)
  const [activeRedemptionTab, setActiveRedemptionTab] = useState('Pending'); // For redemptions

  const { toast } = useToast();
  const { currentUser, isLoading: authContextIsLoading } = useAuth();

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [tokensToAward, setTokensToAward] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [fetchErrorToastShown, setFetchErrorToastShown] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [isCompleteRedemptionOpen, setIsCompleteRedemptionOpen] = useState(false);
  const [isDenyRedemptionOpen, setIsDenyRedemptionOpen] = useState(false);

  const fetchSubmissions = useCallback(async (statusToFetch) => {
    // ... (rest of the function is the same, just wrapped in this useCallback)
    if (!currentUser || !currentUser.isAdmin) {
      // ...
      return;
    }
    setPageIsLoading(true);
    setFetchError(null);
    setSubmissions([]);
    try {
      const submissionsCol = collection(db, 'submissions');
      const q = query(submissionsCol, where('status', '==', statusToFetch), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedSubmissions = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
          submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : new Date(data.submittedAt || Date.now()),
          originalTaskTokens: data.originalTaskTokens || 0,
        };
      });
      setSubmissions(fetchedSubmissions);
    } catch (error) {
       console.error(`[AdminReviewPage] Error fetching ${statusToFetch} submissions: `, error);
       setFetchError(`Error fetching submissions. Check console for details, especially for missing Firestore indexes.`);
    } finally {
      setPageIsLoading(false);
    }
  }, [currentUser, toast]);

  const fetchRedemptions = useCallback(async (statusToFetch) => {
    if (!currentUser || !currentUser.isAdmin) {
      return;
    }
    setPageIsLoading(true);
    setFetchError(null);
    setRedemptions([]);
    try {
        const redemptionsCol = collection(db, 'redemptionRequests');
        const q = query(redemptionsCol, where('status', '==', statusToFetch), orderBy('requestedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedRedemptions = querySnapshot.docs.map(docSnapshot => {
            const data = docSnapshot.data();
            return {
                id: docSnapshot.id,
                ...data,
                requestedAt: data.requestedAt instanceof Timestamp ? data.requestedAt.toDate() : new Date(data.requestedAt || Date.now()),
                amountInUSD: (data.amount / 100).toFixed(2)
            };
        });
        setRedemptions(fetchedRedemptions);
    } catch (error) {
        console.error(`[AdminReviewPage] Error fetching ${statusToFetch} redemptions: `, error);
        setFetchError(`Error fetching redemptions. Check console for details, especially for missing Firestore indexes.`);
    } finally {
        setPageIsLoading(false);
    }
  }, [currentUser, toast]);


  useEffect(() => {
    if (!authContextIsLoading && currentUser && currentUser.isAdmin) {
        setFetchErrorToastShown(false);
        if (activeSubTab === 'Submissions') {
            fetchSubmissions(activeTab);
        } else if (activeSubTab === 'Redemptions') {
            fetchRedemptions(activeRedemptionTab);
        }
    } else if (!authContextIsLoading && (!currentUser || !currentUser.isAdmin)) {
        const accessDeniedMsg = "Access Denied: You are not authorized to view this page.";
        setFetchError(accessDeniedMsg);
        setPageIsLoading(false);
        setSubmissions([]);
        setRedemptions([]);
    } else {
        setPageIsLoading(true);
        setFetchError(null);
    }
  }, [activeSubTab, activeTab, activeRedemptionTab, currentUser, authContextIsLoading, fetchSubmissions, fetchRedemptions]);

  // All handler and processing functions (approve, reject) remain the same

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


  const handleCompleteRedemptionClick = (redemption) => {
    setSelectedRedemption(redemption);
    setIsCompleteRedemptionOpen(true);
  };

  const handleDenyRedemptionClick = (redemption) => {
      setSelectedRedemption(redemption);
      setIsDenyRedemptionOpen(true);
  };
  
  const processCompleteRedemption = async () => {
    if (!selectedRedemption) return;
    setIsProcessing(true);
    try {
        const redemptionRef = doc(db, 'redemptionRequests', selectedRedemption.id);
        await updateDoc(redemptionRef, {
            status: 'Completed',
            processedAt: serverTimestamp(),
        });
        toast({ title: "Redemption Completed", description: `Request for ${selectedRedemption.amount} HTR by ${selectedRedemption.userName} marked as complete.` });
        setIsCompleteRedemptionOpen(false);
        setSelectedRedemption(null);
        fetchRedemptions(activeRedemptionTab);
    } catch (error) {
        console.error("Error completing redemption: ", error);
        toast({ title: "Completion Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const processDenyRedemption = async () => {
    if (!selectedRedemption) return;
    setIsProcessing(true);

    const redemptionRef = doc(db, 'redemptionRequests', selectedRedemption.id);
    const userRef = doc(db, 'users', selectedRedemption.userId);

    try {
        await runTransaction(db, async (transaction) => {
            // Refund the HTR to the user
            transaction.update(userRef, { tokenBalance: increment(selectedRedemption.amount) });
            // Update the redemption request status
            transaction.update(redemptionRef, {
                status: 'Denied',
                processedAt: serverTimestamp(),
            });
        });
        toast({ title: "Redemption Denied", description: `Request for ${selectedRedemption.amount} HTR by ${selectedRedemption.userName} denied and tokens refunded.` });
        setIsDenyRedemptionOpen(false);
        setSelectedRedemption(null);
        fetchRedemptions(activeRedemptionTab);
    } catch (error) {
        console.error("Error denying redemption: ", error);
        toast({ title: "Denial Failed", description: `Could not deny request. ${error.message}`, variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };


  const renderSubmissionsContent = () => (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          {Object.keys(statusConfig).map(status => (
            <TabsTrigger key={status} value={status} className="gap-2">
              {statusConfig[status].icon} {status}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">No {activeTab.toLowerCase()} submissions found.</p>
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
                    {renderSubmissionRow(submission)}
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      )}
    </>
  );

  const renderRedemptionsContent = () => (
    <>
        <Tabs value={activeRedemptionTab} onValueChange={setActiveRedemptionTab} className="mb-6">
            <TabsList>
                {Object.keys(redemptionStatusConfig).map(status => (
                    <TabsTrigger key={status} value={status} className="gap-2">
                        {redemptionStatusConfig[status].icon} {status}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
        {redemptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">No {activeRedemptionTab.toLowerCase()} redemption requests.</p>
            </div>
        ) : (
            <div className="overflow-x-auto rounded-lg border shadow-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User Name</TableHead>
                            <TableHead>Requested At</TableHead>
                            <TableHead>HTR Amount</TableHead>
                            <TableHead>Amount (USD)</TableHead>
                            <TableHead>PayPal Email</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {redemptions.map((redemption) => (
                            <TableRow key={redemption.id}>
                                {renderRedemptionRow(redemption)}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}
    </>
);

  const renderSubmissionRow = (submission) => (
    <>
        <TableCell className="font-medium">{submission.taskTitle}</TableCell>
        <TableCell>{submission.submitterName}</TableCell>
        <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
        <TableCell className="max-w-xs truncate">{submission.caption}</TableCell>
        <TableCell>
            {submission.fileLink ? (
            <Button variant="link" asChild size="sm">
                <a href={submission.fileLink} target="_blank" rel="noopener noreferrer">
                View File <ExternalLink className="ml-1 h-3 w-3" />
                </a>
            </Button>
            ) : <span className="text-xs text-muted-foreground">No link</span>}
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
                <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleApproveClick(submission)} disabled={isProcessing}>Approve</Button>
                <Button size="sm" variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleRejectClick(submission)} disabled={isProcessing}>Reject</Button>
            </div>
            )}
            {submission.status === 'Approved' && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Approved</Badge>}
            {submission.status === 'Rejected' && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">Rejected</Badge>}
        </TableCell>
    </>
  );

  const renderRedemptionRow = (redemption) => (
    <>
        <TableCell className="font-medium">{redemption.userName}</TableCell>
        <TableCell>{new Date(redemption.requestedAt).toLocaleDateString()}</TableCell>
        <TableCell><Coins className="mr-1 inline-block h-4 w-4 text-accent" />{redemption.amount.toLocaleString()}</TableCell>
        <TableCell className="font-semibold">${redemption.amountInUSD}</TableCell>
        <TableCell>{redemption.paypalEmail}</TableCell>
        <TableCell className="text-center">
            {redemption.status === 'Pending' && (
                <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleCompleteRedemptionClick(redemption)} disabled={isProcessing}>Complete</Button>
                    <Button size="sm" variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDenyRedemptionClick(redemption)} disabled={isProcessing}>Deny</Button>
                </div>
            )}
            {redemption.status === 'Completed' && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Completed</Badge>}
            {redemption.status === 'Denied' && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">Denied</Badge>}
        </TableCell>
    </>
  );


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 tracking-tight text-foreground">Admin Panel</h1>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="mb-6">
        <TabsList>
            <TabsTrigger value="Submissions">Task Submissions</TabsTrigger>
            <TabsTrigger value="Redemptions">HTR Redemptions</TabsTrigger>
        </TabsList>
      </Tabs>

      {isPageLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : fetchError ? (
         <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg border-destructive bg-destructive/10">
          <ServerCrash className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Data</h2>
          <p className="text-sm text-destructive whitespace-pre-wrap">{fetchError}</p>
        </div>
      ) : (
        activeSubTab === 'Submissions' ? renderSubmissionsContent() : renderRedemptionsContent()
      )}
      
      {/* Submission Dialogs */}
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

      {/* Redemption Dialogs */}
      <AlertDialog open={isCompleteRedemptionOpen} onOpenChange={setIsCompleteRedemptionOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Complete Redemption Request?</AlertDialogTitle>
                <AlertDialogDescription>
                  Have you manually sent ${selectedRedemption?.amountInUSD} to {selectedRedemption?.userName} via PayPal ({selectedRedemption?.paypalEmail})? This action will mark the request as complete and cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={processCompleteRedemption} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">{isProcessing ? "Processing..." : "Yes, I have paid"}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDenyRedemptionOpen} onOpenChange={setIsDenyRedemptionOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Deny Redemption Request?</AlertDialogTitle>
                <AlertDialogDescription>
                    Deny the request for {selectedRedemption?.amount.toLocaleString()} HTR from {selectedRedemption?.userName}. This will refund the HTR to the user's account.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={processDenyRedemption} disabled={isProcessing} className="bg-red-600 hover:bg-red-700">{isProcessing ? "Processing..." : "Confirm Deny & Refund HTR"}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

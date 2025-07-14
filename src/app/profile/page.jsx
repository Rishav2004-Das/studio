
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserProfileCard } from '@/components/profile/user-profile-card.jsx';
import { SubmissionHistoryItem } from '@/components/profile/submission-history-item.jsx';
import { LoginForm } from '@/components/auth/login-form.jsx';
import { SignupForm } from '@/components/auth/signup-form.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { useToast } from '@/hooks/use-toast.js';
import { useAuth } from '@/contexts/auth-context.jsx';
import { auth, db } from '@/lib/firebase/config.js'; 
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, orderBy, runTransaction, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.jsx';

const redemptionSchema = z.object({
  amount: z.coerce.number().int().positive({ message: 'Amount must be a positive number.' }).min(100, { message: 'Minimum redemption is 100 HTR.' }),
  paypalEmail: z.string().email({ message: 'Please enter a valid PayPal email address.' }),
});


export default function ProfilePage() {
  const { toast } = useToast();
  const { currentUser, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [localCurrentUser, setLocalCurrentUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isProcessingRedemption, setIsProcessingRedemption] = useState(false);

  const redemptionForm = useForm({
    resolver: zodResolver(redemptionSchema),
    defaultValues: {
      amount: '',
      paypalEmail: '',
    },
  });

  const fetchUserData = async (userId) => {
      if (!userId) return;
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setLocalCurrentUser(userDocSnap.data());
      } else {
        setLocalCurrentUser(currentUser); 
      }
  };

  useEffect(() => {
    if (!authLoading) {
      setPageLoading(false);
      if (currentUser && currentUser.id) {
        fetchUserData(currentUser.id);

        const fetchSubmissions = async () => {
          try {
            const submissionsCol = collection(db, 'submissions');
            const q = query(
              submissionsCol,
              where('userId', '==', currentUser.id),
              orderBy('submittedAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const fetchedSubmissions = querySnapshot.docs.map(docSnapshot => {
              const data = docSnapshot.data();
              return {
                id: docSnapshot.id,
                ...data,
                submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(data.submittedAt || Date.now())
              };
            });
            setSubmissions(fetchedSubmissions);
          } catch (error) {
            console.error("Error fetching submissions: ", error);
            toast({
              title: 'Error Fetching History',
              description: 'Could not load your submission history.',
              variant: 'destructive',
            });
            setSubmissions([]);
          }
        };
        fetchSubmissions();
      } else {
        setLocalCurrentUser(null);
        setSubmissions([]);
      }
    }
  }, [authLoading, currentUser, toast]);

  const handleRedeemSubmit = async (data) => {
    if (!localCurrentUser || !currentUser) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    if (data.amount > localCurrentUser.tokenBalance) {
      redemptionForm.setError("amount", { type: "manual", message: "You don't have enough HTR." });
      return;
    }
    
    setIsProcessingRedemption(true);

    const userRef = doc(db, 'users', currentUser.id);
    const redemptionRequestsRef = collection(db, 'redemptionRequests');

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error("User document does not exist!");
        }
        const currentBalance = userDoc.data().tokenBalance;
        if (data.amount > currentBalance) {
          throw new Error("Insufficient funds for redemption.");
        }
        
        const newBalance = currentBalance - data.amount;
        transaction.update(userRef, { tokenBalance: newBalance });
        
        transaction.set(doc(redemptionRequestsRef), {
          userId: currentUser.id,
          userName: localCurrentUser.name,
          userEmail: localCurrentUser.email,
          amount: data.amount,
          paypalEmail: data.paypalEmail,
          status: 'Pending',
          requestedAt: serverTimestamp(),
        });
      });
      
      toast({
        title: "Redemption Request Submitted",
        description: `Your request to redeem ${data.amount} HTR has been sent for processing.`,
      });
      
      await fetchUserData(currentUser.id); // Refresh user data
      setIsRedeemOpen(false);
      redemptionForm.reset();

    } catch (error) {
      console.error("Redemption transaction failed: ", error);
      toast({
        title: "Redemption Failed",
        description: error.message || "Could not process your redemption request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingRedemption(false);
    }
  };

  const handleAuthSuccess = async () => {
    // AuthContext will update currentUser, which triggers the useEffect above
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error("Error logging out: ", error);
      toast({
        title: 'Logout Failed',
        description: 'Could not log you out. Please try again.',
        variant: 'destructive',
      });
    }
  };


  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto animate-pulse">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
            <Skeleton className="h-24 w-24 rounded-full sm:h-28 sm:w-28" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-64" />
            </div>
          </CardHeader>
        </Card>
        <Separator className="my-8" />
        <Skeleton className="mb-6 h-8 w-1/3" />
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !localCurrentUser) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {showLogin ? 'Welcome Back!' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {showLogin
                ? 'Log in to access your profile and earn HTR.'
                : 'Sign up to start earning HTR.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showLogin ? (
              <LoginForm
                onLoginSuccess={handleAuthSuccess} 
                switchToSignup={() => setShowLogin(false)}
              />
            ) : (
              <SignupForm
                onSignupSuccess={handleAuthSuccess} 
                switchToLogin={() => setShowLogin(true)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <UserProfileCard
        user={localCurrentUser}
        isOwnProfile={true}
        onRedeemClick={() => setIsRedeemOpen(true)}
      />
       <div className="mt-2 p-4 border border-dashed rounded-md bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
                Profile picture uploads are currently disabled.
            </p>
        </div>


      <div className="mt-4 text-center sm:text-right">
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>

      <Separator className="my-8" />

      <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Submission History
      </h2>
      {submissions.length > 0 ? (
        <div className="space-y-6">
          {submissions.map((submission) => (
            <SubmissionHistoryItem
              key={submission.id}
              submission={submission}
              taskTitle={submission.taskTitle || "Task details unavailable"}
            />
          ))}
        </div>
      ) : (
        <div className="text-center rounded-lg border border-dashed p-8">
          <p className="text-muted-foreground">
            You haven't made any submissions yet.
          </p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/">Browse available tasks</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            and complete them to see your history here!
          </p>
        </div>
      )}

      {/* Redemption Dialog */}
      <AlertDialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redeem HTR for Cash</AlertDialogTitle>
            <AlertDialogDescription>
              Convert your HTR into real money. 100 HTR = $1 USD.
              Minimum redemption is 100 HTR. Payments are processed via PayPal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...redemptionForm}>
            <form id="redemption-form" onSubmit={redemptionForm.handleSubmit(handleRedeemSubmit)} className="space-y-4">
              <FormField
                control={redemptionForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTR to Redeem (Balance: {localCurrentUser.tokenBalance.toLocaleString()})</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 500" 
                        {...field} 
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                        max={localCurrentUser.tokenBalance}
                        min="100"
                        disabled={isProcessingRedemption}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={redemptionForm.control}
                name="paypalEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PayPal Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} disabled={isProcessingRedemption} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingRedemption} onClick={() => redemptionForm.reset()}>Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit" form="redemption-form" disabled={isProcessingRedemption}>
              {isProcessingRedemption ? "Processing..." : "Submit Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

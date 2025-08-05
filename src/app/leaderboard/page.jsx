
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, getDocs, where, getCountFromServer } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Award, UserCircle2, ServerCrash, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return <span className="font-mono text-sm text-muted-foreground">{rank}</span>;
};

export default function LeaderboardPage() {
    const [topUsers, setTopUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [searchError, setSearchError] = useState(null);

    useEffect(() => {
        const fetchTopUsers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const usersCol = collection(db, 'users');
                const q = query(usersCol, orderBy('tokenBalance', 'desc'), limit(10));
                const querySnapshot = await getDocs(q);
                const fetchedTopUsers = querySnapshot.docs.map((doc, index) => ({
                    id: doc.id,
                    rank: index + 1,
                    ...doc.data()
                }));
                setTopUsers(fetchedTopUsers);
            } catch (err) {
                console.error("Error fetching leaderboard:", err);
                if (err.code === 'permission-denied') {
                    setError("You don't have permission to view the leaderboard. The security rules may need to be updated to allow listing users.");
                } else if (err.code === 'failed-precondition') {
                     setError("The leaderboard query requires a database index that hasn't been created yet. Please check the developer console for a link to create it in Firebase.");
                } else {
                    setError("Could not load the leaderboard. Please try again later.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchTopUsers();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        setSearchError(null);
        setSearchResult(null);

        try {
            // 1. Find the user by name
            const usersCol = collection(db, 'users');
            // Using case-insensitive search by matching lowercase name
            const userQuery = query(usersCol, where('name', '==', searchTerm.trim()));
            const userSnapshot = await getDocs(userQuery);

            if (userSnapshot.empty) {
                setSearchError(`No user found with the name "${searchTerm.trim()}". Please check the spelling.`);
                return;
            }

            const userData = userSnapshot.docs[0].data();
            const userTokenBalance = userData.tokenBalance;

            // 2. Count users with a higher score to determine rank
            const rankQuery = query(usersCol, where('tokenBalance', '>', userTokenBalance));
            const higherRankedSnapshot = await getCountFromServer(rankQuery);
            const rank = higherRankedSnapshot.data().count + 1;

            setSearchResult({ ...userData, rank });

        } catch (err) {
            console.error("Error searching for user rank:", err);
            let message = "An error occurred while searching. Please check the console.";
            if (err.code === 'failed-precondition') {
                message = "The search query requires a Firestore index that has not been created. Please check the developer console for a link to create it.";
            } else if (err.code === 'permission-denied') {
                message = "You do not have permission to perform this search. Please check Firestore security rules.";
            }
            setSearchError(message);
        } finally {
            setIsSearching(false);
        }
    };


    const renderLoadingSkeleton = () => (
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">HTR Balance</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                            <TableCell className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <Skeleton className="h-5 w-32" />
                            </TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    );

    const renderContent = () => {
        if (isLoading) {
            return renderLoadingSkeleton();
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg border-destructive bg-destructive/10">
                  <ServerCrash className="h-16 w-16 text-destructive mb-4" />
                  <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Leaderboard</h2>
                  <p className="text-sm text-destructive whitespace-pre-wrap">{error}</p>
                </div>
            );
        }
        
        if (topUsers.length === 0) {
             return (
                <div className="text-center rounded-lg border-2 border-dashed p-12">
                    <p className="text-lg font-semibold text-muted-foreground">The leaderboard is empty.</p>
                    <p className="mt-2 text-muted-foreground">
                        Complete some tasks to get on the board!
                    </p>
                </div>
            );
        }

        return (
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px] text-center">Rank</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="text-right">HTR Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topUsers.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="text-center text-lg font-bold">{getMedal(user.rank)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-primary/50">
                                            <AvatarFallback>
                                                {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-foreground">{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1.5 font-semibold text-accent">
                                        <Award className="h-5 w-5" />
                                        <span>{user.tokenBalance.toLocaleString()}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        );
    }

    return (
        <div className="container mx-auto">
            <Card className="shadow-lg mb-8">
                <CardHeader>
                    <CardTitle>Find Your Rank</CardTitle>
                    <CardDescription>Enter your username to see your position on the leaderboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                        <Input 
                            placeholder="Enter your exact username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={isSearching}
                        />
                        <Button type="submit" disabled={isSearching || !searchTerm.trim()} className="w-full sm:w-auto">
                            {isSearching ? "Searching..." : <><Search className="mr-2 h-4 w-4" /> Search</>}
                        </Button>
                    </form>
                    {isSearching && (
                        <div className="mt-4 flex items-center justify-center text-muted-foreground">
                            <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                            <span>Finding your rank...</span>
                        </div>
                    )}
                    {searchError && (
                        <p className="mt-4 text-sm text-destructive text-center">{searchError}</p>
                    )}
                    {searchResult && (
                        <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                             <h3 className="text-lg font-semibold text-center text-accent-foreground mb-4">Your Position</h3>
                             <Table>
                                 <TableBody>
                                     <TableRow className="border-0 hover:bg-transparent">
                                         <TableCell className="text-center text-xl font-bold w-[80px]">
                                             {getMedal(searchResult.rank)}
                                         </TableCell>
                                         <TableCell>
                                             <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border-2 border-primary/50">
                                                    <AvatarFallback>{searchResult.name?.split(' ').map(n => n[0]).join('').toUpperCase() || <UserCircle2 />}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-foreground">{searchResult.name}</span>
                                             </div>
                                         </TableCell>
                                         <TableCell className="text-right">
                                             <div className="flex items-center justify-end gap-1.5 font-semibold text-accent">
                                                <Award className="h-5 w-5" />
                                                <span>{searchResult.tokenBalance.toLocaleString()}</span>
                                             </div>
                                         </TableCell>
                                     </TableRow>
                                 </TableBody>
                             </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className="text-3xl font-bold tracking-tight">Top Earners</CardTitle>
                            <CardDescription>See who's at the top of the Telebounties leaderboard.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                {renderContent()}
            </Card>
        </div>
    );
}

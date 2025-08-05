
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config.js';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { mockTasks } from "@/lib/mock-data.js";
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { LayoutGrid, Rss, Megaphone } from 'lucide-react';
import { FeedCard } from '@/components/feed/feed-card.jsx';
import { AnnouncementCard } from '@/components/feed/announcement-card.jsx';
import Link from 'next/link';
import { Button } from '@/components/ui/button.jsx';

// Mock announcements - in a real app, this would come from Firestore
const mockAnnouncements = [
  {
    id: 'anno1',
    title: 'New "Short Video" Tasks Added!',
    content: 'We\'ve added 5 new high-value video creation tasks. Check them out and earn up to 100 HTR per submission!',
    createdAt: new Date(),
  },
  {
    id: 'anno2',
    title: 'PayPal Redemption Now Live',
    content: 'You can now redeem your HTR for cash via PayPal. Head to your profile to see the new option.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  }
];


export default function HomePage() {
  const [feedItems, setFeedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeed = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const submissionsCol = collection(db, 'submissions');
        const q = query(
          submissionsCol,
          where('status', '==', 'Approved'),
          orderBy('reviewedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const approvedSubmissions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFeedItems(approvedSubmissions);
      } catch (err) {
        console.error("Error fetching feed:", err);
        setError("Could not load the community feed. It's possible the necessary database index hasn't been created yet. Please check the developer console for more details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeed();
  }, []);

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed Content */}
        <div className="lg:col-span-2">
          <h1 className="mb-6 flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <Rss className="h-8 w-8 text-primary" />
            Community Feed
          </h1>

          {isLoading && (
             <div className="space-y-6">
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          )}

          {error && (
            <div className="text-center rounded-lg border-2 border-dashed border-destructive p-8 bg-destructive/10 text-destructive">
              <p className="font-semibold">An error occurred</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          )}

          {!isLoading && !error && feedItems.length === 0 && (
            <div className="text-center rounded-lg border-2 border-dashed p-12">
              <p className="text-lg font-semibold text-muted-foreground">The feed is quiet...</p>
              <p className="mt-2 text-muted-foreground">
                No approved submissions yet. Complete a task to be the first!
              </p>
            </div>
          )}

          {!isLoading && !error && feedItems.length > 0 && (
            <div className="space-y-6">
              {feedItems.map((item) => (
                <FeedCard key={item.id} submission={item} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar for Announcements and Tasks */}
        <div className="lg:col-span-1 space-y-8">
          {/* Announcements Section */}
          <div>
            <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-foreground">
              <Megaphone className="h-7 w-7 text-primary" />
              Announcements
            </h2>
            <div className="space-y-4">
              {mockAnnouncements.map(anno => (
                <AnnouncementCard key={anno.id} announcement={anno} />
              ))}
            </div>
          </div>

          {/* Available Tasks Section */}
          <div>
            <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-foreground">
              <LayoutGrid className="h-7 w-7 text-primary" />
              Available Tasks
            </h2>
            <div className="space-y-3">
              {mockTasks.slice(0, 4).map((task) => (
                <Link href={`/tasks/${task.id}`} key={task.id} className="block group">
                  <div className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors shadow-sm">
                    <p className="font-semibold text-card-foreground group-hover:text-primary">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.category}</p>
                  </div>
                </Link>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link href="/">View All Tasks</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

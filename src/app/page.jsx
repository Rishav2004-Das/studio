
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config.js';
import { collection, query, where, orderBy, getDocs, Timestamp, limit } from 'firebase/firestore';
import { mockTasks } from "@/lib/mock-data.js";
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { LayoutGrid, Rss, Megaphone, Lock } from 'lucide-react';
import { FeedCard } from '@/components/feed/feed-card.jsx';
import { AnnouncementCard } from '@/components/feed/announcement-card.jsx';
import Link from 'next/link';
import { Button } from '@/components/ui/button.jsx';
import { useAuth } from '@/contexts/auth-context.jsx';

export default function HomePage() {
  const { currentUser, isLoading: authIsLoading, isAuthenticated } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [announcementsError, setAnnouncementsError] = useState(null);

  useEffect(() => {
    // This fetch is public, no auth check needed
    const fetchFeed = async () => {
      setIsFeedLoading(true);
      setFeedError(null);
      try {
        const submissionsCol = collection(db, 'submissions');
        const q = query(
          submissionsCol,
          where('status', '==', 'Approved'),
          orderBy('submittedAt', 'desc'),
          limit(20) // To keep the feed snappy
        );
        const querySnapshot = await getDocs(q);
        const approvedSubmissions = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : new Date(data.submittedAt || Date.now())
          }
        });
        setFeedItems(approvedSubmissions);
      } catch (err) {
        console.error("Error fetching feed:", err);
        setFeedError("Could not load the community feed. It's possible the necessary database index hasn't been created yet. Please check the developer console for more details.");
      } finally {
        setIsFeedLoading(false);
      }
    };
    
    // This fetch is also public
    const fetchAnnouncements = async () => {
      setIsAnnouncementsLoading(true);
      setAnnouncementsError(null);
      try {
        const announcementsCol = collection(db, 'announcements');
        const q = query(announcementsCol, orderBy('createdAt', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        const fetchedAnnouncements = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date()
          }
        });
        setAnnouncements(fetchedAnnouncements);
      } catch (err) {
        console.error("Error fetching announcements:", err);
        setAnnouncementsError("Could not load announcements.");
      } finally {
        setIsAnnouncementsLoading(false);
      }
    };
    
    fetchFeed();
    fetchAnnouncements();

  }, []);

  const renderFeedContent = () => {
    if (isFeedLoading) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      );
    }

    if (feedError) {
      return (
        <div className="text-center rounded-lg border-2 border-dashed border-destructive p-8 bg-destructive/10 text-destructive">
          <p className="font-semibold">An error occurred</p>
          <p className="text-sm mt-2">{feedError}</p>
        </div>
      );
    }

    if (feedItems.length === 0) {
      return (
        <div className="text-center rounded-lg border-2 border-dashed p-12">
          <p className="text-lg font-semibold text-muted-foreground">The feed is quiet...</p>
          <p className="mt-2 text-muted-foreground">
            No approved submissions yet. Complete a task to be the first!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {feedItems.map((item) => (
          <FeedCard key={item.id} submission={item} />
        ))}
      </div>
    );
  };
  
  const renderAnnouncementsContent = () => {
    if (isAnnouncementsLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
            </div>
        )
    }
    
    if (announcementsError) {
        return (
            <div className="text-center rounded-lg border border-dashed border-destructive/50 p-4 bg-destructive/10 text-destructive text-xs">
                {announcementsError}
            </div>
        )
    }

    if (announcements.length === 0) {
        return (
             <div className="text-center rounded-lg border border-dashed p-4">
                <p className="text-sm text-muted-foreground">No announcements right now.</p>
            </div>
        )
    }
    
    return (
        <div className="space-y-4">
            {announcements.map(anno => (
                <AnnouncementCard key={anno.id} announcement={anno} />
            ))}
        </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed Content */}
        <div className="lg:col-span-2">
          <h1 className="mb-6 flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <Rss className="h-8 w-8 text-primary" />
            Community Feed
          </h1>
          {renderFeedContent()}
        </div>

        {/* Sidebar for Announcements and Tasks */}
        <div className="lg:col-span-1 space-y-8">
          {/* Announcements Section */}
          <div>
            <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-foreground">
              <Megaphone className="h-7 w-7 text-primary" />
              Announcements
            </h2>
            {renderAnnouncementsContent()}
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
                <Link href="/tasks">View All Tasks</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

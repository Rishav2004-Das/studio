
import type { Task, Submission } from "@/types"; // Removed LeaderboardEntry
import { SmilePlus, MessageSquare, FileText, ListChecks, Video } from "lucide-react";
// Firebase related user data (getUserById, updateUserAvatar, mockUser) will be handled by AuthContext and direct Firestore calls.

export const mockTasks: Task[] = [
  {
    id: "1",
    title: "Create Meme",
    description: "Create a funny and engaging meme related to our brand. Submit the image file.",
    tokens: 50,
    icon: SmilePlus,
    category: "Content Creation",
  },
  {
    id: "2",
    title: "Upload Tweet",
    description: "Draft and share a tweet promoting our latest feature. Provide the tweet text.",
    tokens: 30,
    icon: MessageSquare,
    category: "Social Media",
  },
  {
    id: "3",
    title: "Share Blog Post",
    description: "Share our latest blog post on your preferred social media platform. Submit a link to your share.",
    tokens: 40,
    icon: FileText,
    category: "Social Media",
  },
  {
    id: "4",
    title: "Run a Poll",
    description: "Create and run a poll related to user preferences for new features. Submit poll results/summary.",
    tokens: 60,
    icon: ListChecks,
    category: "Engagement",
  },
  {
    id: "5",
    title: "Create Short Video",
    description: "Produce a short video (15-30 seconds) showcasing our product in action. Submit the video file.",
    tokens: 100,
    icon: Video,
    category: "Content Creation",
  },
];

// Mock submissions can remain for now if they are not tied to the new Firebase users yet.
// If submissions need to be linked to Firebase users, this data structure and fetching logic would need an update.
// For now, we assume 'user123' is a placeholder and submissions are for demonstration.
export const mockSubmissions: Submission[] = [
  {
    id: "sub1",
    taskId: "1",
    userId: "user123_placeholder", // Placeholder, as real UIDs will be from Firebase
    caption: "Check out this hilarious meme I made!",
    fileUrl: "https://picsum.photos/seed/meme1/400/300",
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 
    status: "Approved",
    tokensAwarded: 50,
  },
  {
    id: "sub2",
    taskId: "3",
    userId: "user123_placeholder",
    caption: "Shared the new blog post on LinkedIn.",
    fileUrl: "https://linkedin.com/post/example",
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 
    status: "Approved",
    tokensAwarded: 40,
  },
  {
    id: "sub3",
    taskId: "5",
    userId: "user123_placeholder",
    caption: "My short video showcasing the product.",
    fileUrl: "https://youtube.com/shorts/example",
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 
    status: "Pending",
  },
];

// Helper function to get task by ID (simulating data fetching)
export const getTaskById = (id: string): Task | undefined => {
  return mockTasks.find((task) => task.id === id);
};

// Helper function to get submissions for a user (using mock data for now)
// This would need to fetch from Firestore if submissions are stored there.
export const getSubmissionsByUserId = (userId: string): Submission[] => {
  // For now, return all mock submissions as a placeholder, or filter by a mock ID if desired.
  // This needs to be updated if submissions are migrated to Firestore and linked to Firebase UIDs.
  return mockSubmissions.filter(sub => sub.userId === "user123_placeholder"); // Example: filter by placeholder
};

// getUserById and updateUserAvatar are now handled by AuthContext and direct Firestore operations
// in components like ProfilePage.tsx.

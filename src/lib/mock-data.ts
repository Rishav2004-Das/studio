import type { Task, User, Submission, LeaderboardEntry } from "@/types";
import { SmilePlus, MessageSquare, FileText, ListChecks, Video, Award, UserCircle2 } from "lucide-react";

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

export const mockUser: User = {
  id: "user123",
  name: "Alex Johnson",
  avatarUrl: "https://picsum.photos/seed/alex/100/100",
  tokenBalance: 1250,
};

export const mockSubmissions: Submission[] = [
  {
    id: "sub1",
    taskId: "1",
    userId: "user123",
    caption: "Check out this hilarious meme I made!",
    fileUrl: "https://picsum.photos/seed/meme1/400/300",
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: "Approved",
    tokensAwarded: 50,
  },
  {
    id: "sub2",
    taskId: "3",
    userId: "user123",
    caption: "Shared the new blog post on LinkedIn.",
    fileUrl: "https://linkedin.com/post/example",
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    status: "Approved",
    tokensAwarded: 40,
  },
  {
    id: "sub3",
    taskId: "5",
    userId: "user123",
    caption: "My short video showcasing the product.",
    fileUrl: "https://youtube.com/shorts/example",
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    status: "Pending",
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "user001",
    userName: "Sarah Miller",
    userAvatarUrl: "https://picsum.photos/seed/sarah/80/80",
    totalTokens: 2500,
  },
  {
    rank: 2,
    userId: "user002",
    userName: "John Doe",
    userAvatarUrl: "https://picsum.photos/seed/john/80/80",
    totalTokens: 2200,
  },
  {
    rank: 3,
    userId: "user123",
    userName: "Alex Johnson",
    userAvatarUrl: "https://picsum.photos/seed/alex/80/80",
    totalTokens: 1250,
  },
  {
    rank: 4,
    userId: "user004",
    userName: "Emily White",
    userAvatarUrl: "https://picsum.photos/seed/emily/80/80",
    totalTokens: 1100,
  },
  {
    rank: 5,
    userId: "user005",
    userName: "Michael Brown",
    userAvatarUrl: "https://picsum.photos/seed/michael/80/80",
    totalTokens: 950,
  },
];

// Helper function to get task by ID (simulating data fetching)
export const getTaskById = (id: string): Task | undefined => {
  return mockTasks.find((task) => task.id === id);
};

// Helper function to get submissions for a user
export const getSubmissionsByUserId = (userId: string): Submission[] => {
  return mockSubmissions.filter((sub) => sub.userId === userId);
};

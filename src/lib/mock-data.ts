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

// Mock user starts with 0 tokens and no avatar.
export const mockUser: User = {
  id: "user123",
  name: "Alex Johnson",
  avatarUrl: null, // Initially no avatar photo
  tokenBalance: 0, // Initial token balance set to 0
};

// Note: The submissions below award tokens, which will increase the balance displayed
// if the app logic were to sum them up. The header currently shows the static mockUser.tokenBalance.
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

// Calculate total earned tokens for the leaderboard based on approved submissions
const calculateTotalTokens = (userId: string): number => {
  return mockSubmissions
    .filter(sub => sub.userId === userId && sub.status === "Approved" && sub.tokensAwarded)
    .reduce((sum, sub) => sum + (sub.tokensAwarded || 0), 0);
};

// Update leaderboard data based on calculated tokens
export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "user001",
    userName: "Sarah Miller",
    userAvatarUrl: "https://picsum.photos/seed/sarah/80/80",
    totalTokens: calculateTotalTokens("user001") + 150, // Add some base value for variety
  },
  {
    rank: 2,
    userId: "user002",
    userName: "John Doe",
    userAvatarUrl: "https://picsum.photos/seed/john/80/80",
    totalTokens: calculateTotalTokens("user002") + 100, // Add some base value for variety
  },
  {
    rank: 3,
    userId: "user123",
    userName: "Alex Johnson",
    userAvatarUrl: mockUser.avatarUrl, // Use the current state from mockUser
    totalTokens: calculateTotalTokens("user123"), // Alex's tokens based on approved submissions
  },
  {
    rank: 4,
    userId: "user004",
    userName: "Emily White",
    userAvatarUrl: "https://picsum.photos/seed/emily/80/80",
    totalTokens: calculateTotalTokens("user004") + 20, // Add some base value for variety
  },
  {
    rank: 5,
    userId: "user005",
    userName: "Michael Brown",
    userAvatarUrl: "https://picsum.photos/seed/michael/80/80",
    totalTokens: calculateTotalTokens("user005"),
  },
].sort((a, b) => b.totalTokens - a.totalTokens) // Sort by tokens desc
 .map((entry, index) => ({ ...entry, rank: index + 1 })); // Recalculate rank based on sorting


// Helper function to get task by ID (simulating data fetching)
export const getTaskById = (id: string): Task | undefined => {
  return mockTasks.find((task) => task.id === id);
};

// Helper function to get submissions for a user
export const getSubmissionsByUserId = (userId: string): Submission[] => {
  return mockSubmissions.filter((sub) => sub.userId === userId);
};

// Simulate updating the mockUser's avatar (in a real app, this would update the database)
export const updateUserAvatar = (userId: string, newAvatarUrl: string): void => {
    if (userId === mockUser.id) {
        mockUser.avatarUrl = newAvatarUrl;
        // Also update the leaderboard entry if the user exists there
        const leaderboardIndex = mockLeaderboard.findIndex(entry => entry.userId === userId);
        if (leaderboardIndex !== -1) {
            mockLeaderboard[leaderboardIndex].userAvatarUrl = newAvatarUrl;
        }
    }
    // Handle other users if needed
}

// Helper function to get user by ID (needed for profile page logic)
export const getUserById = (userId: string): User | undefined => {
  // In a real app, this would fetch from a database.
  // For simulation, return the mock user if IDs match.
  if (userId === mockUser.id) {
      // Return a copy with the calculated token balance based on submissions
      // and the current avatar URL
      return {
          ...mockUser,
          tokenBalance: calculateTotalTokens(userId),
          avatarUrl: mockUser.avatarUrl, // Ensure the current avatar is returned
      };
  }
  // Find user in the leaderboard data (simulate fetching other users)
  const leaderboardUser = mockLeaderboard.find(entry => entry.userId === userId);
  if (leaderboardUser) {
    return {
      id: leaderboardUser.userId,
      name: leaderboardUser.userName,
      avatarUrl: leaderboardUser.userAvatarUrl,
      tokenBalance: leaderboardUser.totalTokens,
    }
  }
  return undefined;
}

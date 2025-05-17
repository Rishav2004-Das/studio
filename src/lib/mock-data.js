
import { SmilePlus, MessageSquare, FileText, ListChecks, Video, AlertCircle } from "lucide-react";

// Helper function to get the icon component from its name
export const getIconComponent = (iconName) => {
  switch (iconName) {
    case "SmilePlus":
      return SmilePlus;
    case "MessageSquare":
      return MessageSquare;
    case "FileText":
      return FileText;
    case "ListChecks":
      return ListChecks;
    case "Video":
      return Video;
    default:
      return AlertCircle; // Return a default icon if name not found
  }
};

export const mockTasks = [
  {
    id: "1",
    title: "Create Meme",
    description: "Create a funny and engaging meme related to our brand. Submit the image file.",
    tokens: 50,
    icon: "SmilePlus", // Store icon name as a string
    category: "Content Creation",
  },
  {
    id: "2",
    title: "Upload Tweet",
    description: "Draft and share a tweet promoting our latest feature. Provide the tweet text.",
    tokens: 30,
    icon: "MessageSquare", // Store icon name as a string
    category: "Social Media",
  },
  {
    id: "3",
    title: "Share Blog Post",
    description: "Share our latest blog post on your preferred social media platform. Submit a link to your share.",
    tokens: 40,
    icon: "FileText", // Store icon name as a string
    category: "Social Media",
  },
  {
    id: "4",
    title: "Run a Poll",
    description: "Create and run a poll related to user preferences for new features. Submit poll results/summary.",
    tokens: 60,
    icon: "ListChecks", // Store icon name as a string
    category: "Engagement",
  },
  {
    id: "5",
    title: "Create Short Video",
    description: "Produce a short video (15-30 seconds) showcasing our product in action. Submit the video file.",
    tokens: 100,
    icon: "Video", // Store icon name as a string
    category: "Content Creation",
  },
];

export const mockSubmissions = [
  {
    id: "sub1",
    taskId: "1",
    userId: "user123_placeholder",
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

export const getTaskById = (id) => {
  return mockTasks.find((task) => task.id === id);
};

export const getSubmissionsByUserId = (userId) => {
  // This function still uses mock data. For real data, query Firestore.
  return mockSubmissions.filter(sub => sub.userId === "user123_placeholder");
};

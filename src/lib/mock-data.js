
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
    icon: "SmilePlus",
    category: "Content Creation",
  },
  {
    id: "2",
    title: "Upload Tweet",
    description: "Draft and share a tweet promoting our latest feature. Provide the tweet text.",
    tokens: 30,
    icon: "MessageSquare",
    category: "Social Media",
  },
  {
    id: "3",
    title: "Share Blog Post",
    description: "Share our latest blog post on your preferred social media platform. Submit a link to your share.",
    tokens: 40,
    icon: "FileText",
    category: "Social Media",
  },
  {
    id: "4",
    title: "Run a Poll",
    description: "Create and run a poll related to user preferences for new features. Submit poll results/summary.",
    tokens: 60,
    icon: "ListChecks",
    category: "Engagement",
  },
  {
    id: "5",
    title: "Create Short Video",
    description: "Produce a short video (15-30 seconds) showcasing our product in action. Submit the video file.",
    tokens: 100,
    icon: "Video",
    category: "Content Creation",
  },
];

export const mockSubmissions = [
  {
    id: "sub1",
    taskId: "1",
    userId: "user123_placeholder", // This will be replaced by actual user ID from Firestore
    taskTitle: "Create Meme",
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
    taskTitle: "Share Blog Post",
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
    taskTitle: "Create Short Video",
    caption: "My short video showcasing the product.",
    fileUrl: "https://youtube.com/shorts/example",
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: "Pending",
    tokensAwarded: 0,
  },
];

export const getTaskById = (id) => {
  const task = mockTasks.find((task) => task.id === id);
  if (task) {
    // Explicitly create a new plain object to ensure no complex references are passed
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      tokens: task.tokens,
      icon: task.icon,
      category: task.category,
    };
  }
  return undefined;
};

// This function is now primarily for Firestore queries.
// The mockSubmissions are illustrative but not directly used by getSubmissionsByUserId anymore
// if the profile page fetches from Firestore.
export const getSubmissionsByUserId = (userId) => {
  // For actual data, Firestore will be queried in the component.
  // This mock version can be kept for reference or testing if needed.
  return mockSubmissions.filter(sub => sub.userId === "user123_placeholder"); // Example, will not be reactive
};

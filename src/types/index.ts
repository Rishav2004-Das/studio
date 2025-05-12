import type { LucideIcon } from "lucide-react";

export interface Task {
  id: string;
  title: string;
  description: string;
  tokens: number;
  icon: LucideIcon | React.ComponentType<any>; // Allow LucideIcon or custom SVG component
  category: string; // e.g., "Content Creation", "Social Media"
}

// Serializable version of Task, without the non-serializable 'icon' property
export type SerializableTask = Omit<Task, 'icon'>;

export interface User {
  id: string;
  name: string;
  avatarUrl: string | null; // Allow null for users without an avatar
  tokenBalance: number;
}

export interface Submission {
  id: string;
  taskId: string;
  userId: string;
  caption: string;
  fileUrl?: string; // Optional, as some tasks might not require file upload
  submittedAt: Date;
  status: "Pending" | "Approved" | "Rejected";
  tokensAwarded?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatarUrl: string | null; // Allow null avatar for leaderboard entries as well
  totalTokens: number;
}

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
}

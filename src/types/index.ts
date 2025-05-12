import type { LucideIcon } from "lucide-react";

export interface Task {
  id: string;
  title: string;
  description: string;
  tokens: number;
  icon: LucideIcon | React.ComponentType<any>; // Allow LucideIcon or custom SVG component
  category: string; // e.g., "Content Creation", "Social Media"
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
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
  userAvatarUrl: string;
  totalTokens: number;
}

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
}

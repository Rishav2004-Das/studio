
import type { LucideIcon } from "lucide-react";
import type { Timestamp } from "firebase/firestore"; // Import Timestamp

export interface Task {
  id: string;
  title: string;
  description: string;
  tokens: number;
  icon: LucideIcon | React.ComponentType<any>; 
  category: string; 
}

export type SerializableTask = Omit<Task, 'icon'>;

export interface User {
  id: string; // Firebase UID
  name: string;
  email: string; // Added email
  avatarUrl: string | null; 
  tokenBalance: number;
  createdAt?: Timestamp | Date; // Added createdAt, can be Firestore Timestamp or Date object
}

export interface Submission {
  id: string;
  taskId: string;
  userId: string; // Firebase UID
  caption: string;
  fileUrl?: string; 
  submittedAt: Date;
  status: "Pending" | "Approved" | "Rejected";
  tokensAwarded?: number;
}

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon; 
  label?: string;
  disabled?: boolean;
}


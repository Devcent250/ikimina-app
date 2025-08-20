import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility function to check if a user is a leader
export function isLeader(user: any): boolean {
  if (!user) return false;

  // Check if user has a leader role
  const roleName = user.role?.name || user.role;
  return roleName === "President" || roleName === "Accountant" || roleName === "Secretary";
}

// Utility function to check if a user can perform admin-like actions
export function canPerformAdminActions(user: any): boolean {
  if (!user) return false;

  // Admin users can perform all actions
  if (user.isAdmin) return true;

  // Leaders can perform certain admin-like actions
  return isLeader(user);
}

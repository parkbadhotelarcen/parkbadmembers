export type VisitStatus = "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED";
export interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  memberSince: string;
  memberLevel: "MEMBER" | "SILVER" | "GOLD";
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "BLOCKED";
}
export interface Visit {
  id: string;
  userId: string;
  bookingNumber: string;
  arrivalDate: string;
  status: VisitStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  reward?: string;
}
export interface UserReward {
  id: string;
  userId: string;
  name: string;
  earnedAt: string;
  status: "AVAILABLE" | "REDEEMED";
  cycle?: number;
}
export interface Benefit {
  id: string;
  title: string;
  description: string;
  detail: string;
  image: string;
  category: string;
  active: boolean;
}

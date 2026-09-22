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
  status: "AVAILABLE" | "REDEEMED" | "EXPIRED";
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
export interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
}
export interface PortalData {
  member: Member;
  visits: Visit[];
  rewards: UserReward[];
  benefits: Benefit[];
  promotions: Promotion[];
  required: number;
  consumed: number;
  nextRewardName: string;
  referenceDate: string;
}

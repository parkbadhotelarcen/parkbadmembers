import type { Records } from "@/lib/google-sheets/schema";
export interface Identity {
  email: string;
  isAdmin: boolean;
}
export interface WriteOperations {
  createMember: {
    input: { firstName: string; lastName: string };
    output: Records["Members"];
  };
  createVisit: {
    input: { bookingNumber: string; arrivalDate: string; requestId: string };
    output: Records["Bezoeken"];
  };
  updateVisitStatus: {
    input: { visitId: string; status: Records["Bezoeken"]["Status"] };
    output: Records["Bezoeken"];
  };
  assignReward: {
    input: { memberId: string; rewardId: string; requestId: string };
    output: Records["MemberBeloningen"];
  };
}
export interface WriteGateway {
  execute<K extends keyof WriteOperations>(
    operation: K,
    actor: Identity,
    input: WriteOperations[K]["input"],
  ): Promise<WriteOperations[K]["output"]>;
}

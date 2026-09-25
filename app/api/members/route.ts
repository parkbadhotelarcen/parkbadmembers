import { requireIdentity } from "@/lib/auth";
import { endpoint, input } from "@/lib/api";
import { memberService } from "@/services";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return endpoint(async () => {
    const actor = await requireIdentity();
    await input(request);
    const member = await memberService.activateMember(actor);
    return { memberId: member.MemberID };
  });
}

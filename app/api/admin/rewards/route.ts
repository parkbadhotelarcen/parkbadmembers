import { z } from "zod";
import { requireIdentity } from "@/lib/auth";
import { endpoint, input, requestId } from "@/lib/api";
import { memberService } from "@/services";
import { memberId } from "@/lib/google-sheets/schema";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return endpoint(async () => {
    const actor = await requireIdentity();
    const body = z
      .object({ memberId, rewardId: z.string().min(1).max(100) })
      .strict()
      .parse(await input(request));
    return {
      reward: await memberService.assignReward(
        actor,
        body.memberId,
        body.rewardId,
        requestId(request),
      ),
    };
  });
}

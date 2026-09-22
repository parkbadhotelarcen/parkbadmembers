import { z } from "zod";
import { requireIdentity } from "@/lib/auth";
import { endpoint, input } from "@/lib/api";
import { memberService } from "@/services";
import { visitStatus } from "@/lib/google-sheets/schema";
export const runtime = "nodejs";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return endpoint(async () => {
    const actor = await requireIdentity();
    const body = z
      .object({ status: visitStatus })
      .strict()
      .parse(await input(request));
    return {
      visit: await memberService.updateVisitStatus(
        actor,
        (await context.params).id,
        body.status,
      ),
    };
  });
}

import { requireIdentity } from "@/lib/auth";
import { endpoint, input, requestId } from "@/lib/api";
import { memberService } from "@/services";
import { visitToView } from "@/services/portal";
export const runtime = "nodejs";
export async function GET() {
  return endpoint(async () => ({
    visits: (
      await memberService.getVisitsForMember(await requireIdentity())
    ).map(visitToView),
  }));
}
export async function POST(request: Request) {
  return endpoint(async () => {
    const actor = await requireIdentity();
    return {
      visit: visitToView(
        await memberService.createVisit(
          actor,
          await input(request),
          requestId(request),
        ),
      ),
    };
  });
}

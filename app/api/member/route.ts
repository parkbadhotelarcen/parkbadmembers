import { requireIdentity } from "@/lib/auth";
import { endpoint } from "@/lib/api";
import { memberService } from "@/services";
import { portalToView } from "@/services/portal";
export const runtime = "nodejs";
export async function GET() {
  return endpoint(async () => {
    const actor = await requireIdentity();
    return portalToView(await memberService.getPortal(actor), actor);
  });
}

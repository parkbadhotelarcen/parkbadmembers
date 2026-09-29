import "server-only";
import { AppsScriptGateway } from "@/lib/google-sheets/writer";
import { MemberService } from "./member-service";
const gateway = new AppsScriptGateway();
export const memberService = new MemberService(gateway, gateway);

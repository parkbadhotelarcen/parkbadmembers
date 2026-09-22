import "server-only";
import { GoogleSheetsStore } from "@/lib/google-sheets/client";
import { AppsScriptWriter } from "@/lib/google-sheets/writer";
import { MemberService } from "./member-service";
export const memberService = new MemberService(
  new GoogleSheetsStore(),
  new AppsScriptWriter(),
);

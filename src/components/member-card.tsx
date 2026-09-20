import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck } from "lucide-react";
import { Brand } from "./ui";
import { MemberStats } from "./member-stats";
import { formatDate, type rewardProgress } from "@/lib/loyalty";
import type { Member } from "@/lib/types";
export function MemberCard({
  member,
  progress,
}: {
  member: Member;
  progress: ReturnType<typeof rewardProgress>;
}) {
  return (
    <>
      <div className="member-card">
        <div className="card-shine" />
        <Brand />
        <div className="card-member">
          <h2>
            {member.firstName} {member.lastName}
          </h2>
          <p>Member {member.memberNumber}</p>
        </div>
        <div className="qr">
          <QRCodeSVG
            value={member.memberNumber}
            size={204}
            level="M"
            marginSize={2}
            title={`Member QR-code ${member.memberNumber}`}
          />
        </div>
        <p className="scan-instruction">
          Laat deze QR-code scannen
          <br />
          bij je bezoek.
        </p>
        <p className="member-since">
          Lid sinds {formatDate(member.memberSince)}
        </p>
        <MemberStats card progress={progress} />
        <div className="card-footer">
          <ShieldCheck size={14} /> PERSOONLIJK & EXCLUSIEF
        </div>
      </div>
    </>
  );
}

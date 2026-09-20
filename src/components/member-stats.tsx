import { CalendarDays, ChartNoAxesColumnIncreasing, Crown } from "lucide-react";
import type { rewardProgress } from "@/lib/loyalty";
export function MemberStats({
  progress: p,
  card = false,
}: {
  progress: ReturnType<typeof rewardProgress>;
  card?: boolean;
}) {
  return (
    <div className="stats">
      <div>
        <CalendarDays />
        <strong>{p.total}</strong>
        <span>Bezoeken</span>
      </div>
      <div>
        <ChartNoAxesColumnIncreasing />
        <strong>{p.percent}%</strong>
        <span>{card ? "Naar volgende beloning" : "Voortgang"}</span>
      </div>
      <div>
        <Crown />
        <strong>Member</strong>
        <span>Niveau</span>
      </div>
    </div>
  );
}

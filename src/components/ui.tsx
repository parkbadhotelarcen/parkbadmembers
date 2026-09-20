import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Gift,
  X,
} from "lucide-react";
import { brand } from "@/lib/mock-data";
import { formatDate, loyaltyConfig, rewardProgress } from "@/lib/loyalty";
import type { Benefit, Visit, VisitStatus } from "@/lib/types";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      {brand.logoSrc && (
        <Image
          src={brand.logoSrc}
          width={80}
          height={80}
          alt="Parkbad"
          className="original-logo"
        />
      )}
      <span>
        PARKBAD<small>MEMBERS</small>
      </span>
    </div>
  );
}
export function PageHeader({
  title,
  subtitle,
  back = "/",
}: {
  title: string;
  subtitle?: string;
  back?: string;
}) {
  return (
    <header className="page-heading">
      <Link href={back} className="back" aria-label="Terug">
        <ArrowLeft size={22} />
      </Link>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  );
}
const labels: Record<VisitStatus, string> = {
  PENDING: "In afwachting",
  APPROVED: "Goedgekeurd",
  COMPLETED: "Bezocht",
  REJECTED: "Afgewezen",
};
export function StatusBadge({ status }: { status: VisitStatus }) {
  const Icon =
    status === "PENDING" ? Clock3 : status === "REJECTED" ? X : Check;
  return (
    <span className={`badge ${status.toLowerCase()}`}>
      <Icon size={13} />
      {labels[status]}
    </span>
  );
}
export function ProgressCard({ visits }: { visits: Visit[] }) {
  const p = rewardProgress(visits);
  return (
    <Link href="/beloningen" className="card progress-card">
      <div className="eyebrow">ELK VERBLIJF BRENGT JE DICHTERBIJ</div>
      <div className="card-title">
        <h2>
          {p.remaining ? (
            <>
              Nog {p.remaining} verblijf{p.remaining !== 1 ? "ven" : ""} tot je
              <br />
              volgende beloning
            </>
          ) : (
            <>Je beloning staat klaar</>
          )}
        </h2>
        <ArrowRight size={22} />
      </div>
      <div className="progress-line">
        <progress
          value={p.current}
          max={p.required}
          aria-label="Beloningsvoortgang"
        />
        <strong>{p.percent}%</strong>
      </div>
      <RewardCard name={loyaltyConfig.nextRewardName} remaining={p.remaining} />
    </Link>
  );
}
export function VisitCard({ visit }: { visit: Visit }) {
  const d = new Date(visit.arrivalDate);
  return (
    <Link className="card visit-card" href={`/boekingen/${visit.id}`}>
      <div className="date-block">
        <strong>{String(d.getUTCDate()).padStart(2, "0")}</strong>
        <span>
          {new Intl.DateTimeFormat("nl-NL", { month: "short", timeZone: "UTC" })
            .format(d)
            .replace(".", "")}
        </span>
        <small>{d.getUTCFullYear()}</small>
      </div>
      <div className="visit-content">
        <h3>Parkhotel Bad Arcen</h3>
        <p>Boeking #{visit.bookingNumber}</p>
        <StatusBadge status={visit.status} />
        {visit.reward && (
          <span className="reward-label">
            <Gift size={15} />
            Beloning ontvangen
          </span>
        )}
      </div>
      <ChevronRight size={19} />
    </Link>
  );
}
export function NextVisit({ visit }: { visit?: Visit }) {
  return (
    <Link
      className="card next-visit"
      href={visit ? `/boekingen/${visit.id}` : "/bezoek"}
    >
      <span className="calendar-tile">
        <CalendarDays size={32} />
      </span>
      <div>
        <span className="muted">Je volgende bezoek</span>
        <h3>
          {visit ? formatDate(visit.arrivalDate) : "Wanneer zien we je weer?"}
        </h3>
        {visit ? (
          <StatusBadge status={visit.status} />
        ) : (
          <small>Meld je volgende verblijf aan</small>
        )}
      </div>
      <ChevronRight size={20} />
    </Link>
  );
}
export function EmptyState({
  title = "Je hebt nog geen bezoeken geregistreerd.",
}: {
  title?: string;
}) {
  return (
    <div className="card empty">
      <CalendarDays size={34} />
      <h2>{title}</h2>
      <p>Er ligt een mooi verblijf op je te wachten.</p>
      <Link href="/bezoek" className="primary">
        Eerste bezoek registreren <ArrowRight size={18} />
      </Link>
    </div>
  );
}

export function RewardCard({
  name,
  remaining,
  detail = false,
}: {
  name: string;
  remaining: number;
  detail?: boolean;
}) {
  return (
    <div className="reward-preview">
      <span className="gift-tile">
        <Gift size={32} />
      </span>
      <div>
        <span className="muted">Volgende beloning</span>
        <h3>{name}</h3>
        {detail && <p className="text-sm text-ink">Laat je verrassen!</p>}
        <small>
          {remaining
            ? `Nog ${remaining} verblijf${remaining === 1 ? "" : "ven"} te gaan.`
            : "Vraag de receptie om je beloning."}
        </small>
      </div>
    </div>
  );
}

export function BenefitCard({
  benefit,
  index,
}: {
  benefit: Benefit;
  index: number;
}) {
  return (
    <Link href={`/voordelen/${benefit.id}`} className="benefit-card">
      <Image
        src={benefit.image}
        alt=""
        fill
        sizes="(max-width: 700px) 100vw, 500px"
      />
      <div>
        <span className="eyebrow">{benefit.category}</span>
        <h2>{benefit.title}</h2>
        <p>{benefit.description}</p>
      </div>
      <span className="benefit-arrow">
        <ArrowRight size={22} />
      </span>
      <span className="benefit-number">0{index + 1}</span>
    </Link>
  );
}

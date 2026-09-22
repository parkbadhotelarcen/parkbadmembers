"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberCard } from "./member-card";
import { MemberStats } from "./member-stats";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Gift,
  Heart,
  Info,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Utensils,
  Waves,
  X,
} from "lucide-react";
import { brand } from "@/lib/mock-data";
import { signOut } from "next-auth/react";
import { formatDate, validateVisit } from "@/lib/loyalty";
import { useMembers } from "./app-provider";
import { BottomNavigation } from "./navigation";
import {
  Brand,
  BenefitCard,
  RewardCard,
  EmptyState,
  NextVisit,
  PageHeader,
  ProgressCard,
  StatusBadge,
  VisitCard,
} from "./ui";

function Stats() {
  const { progress, member } = useMembers();
  return <MemberStats progress={progress} level={member.memberLevel} />;
}
function Hero({ small = false }: { small?: boolean }) {
  return (
    <Link href="/voordelen" className={`photo-banner ${small ? "small" : ""}`}>
      <Image
        src={brand.heroImage}
        alt="Zwembad omringd door groen"
        fill
        sizes="(max-width: 700px) 100vw, 600px"
        priority={!small}
      />
      <div>
        <span className="eyebrow">TIJD VOOR JEZELF</span>
        <h2>
          Meer dan
          <br />
          <em>een verblijf.</em>
        </h2>
        <span className="banner-link">
          Ontdek jouw voordelen <ArrowRight size={18} />
        </span>
      </div>
      <span className="photo-note">Sfeerimpressie</span>
    </Link>
  );
}
function HomeScreen() {
  const { visits, member, benefits, progress, nextRewardName, referenceDate } =
    useMembers();
  const next = visits
    .filter(
      (v) =>
        (v.status === "PENDING" || v.status === "APPROVED") &&
        v.arrivalDate >= referenceDate,
    )
    .sort((a, b) => a.arrivalDate.localeCompare(b.arrivalDate))[0];
  return (
    <>
      <header className="home-heading">
        <div>
          <div className="eyebrow">FIJN DAT JE ER WEER BENT</div>
          <h1>
            Goedemiddag, {member.firstName}
            <span>.</span>
          </h1>
          <p>
            Member {member.memberNumber} <span className="member-dot">•</span>{" "}
            Jouw moment van rust
          </p>
        </div>
        <Link href="/profiel" className="avatar" aria-label="Mijn profiel">
          <UserRound size={24} />
        </Link>
      </header>
      <div className="home-grid">
        <div className="home-cards">
          <ProgressCard progress={progress} name={nextRewardName} />
          <NextVisit visit={next} />
          <div className="quiet-note">
            <Heart size={17} /> Bij ons ben je meer dan een gast.
          </div>
        </div>
        <Hero />
      </div>
      <section className="discover">
        <div className="section-heading">
          <h2>Maak je verblijf bijzonder</h2>
          <Link href="/voordelen">
            Alle voordelen <ArrowRight size={17} />
          </Link>
        </div>
        <div className="teaser-grid">
          {benefits.slice(0, 2).map((b) => (
            <Link key={b.id} href={`/voordelen/${b.id}`} className="teaser">
              <span className="teaser-icon">
                {b.id === "thermaalbad" ? <Waves /> : <Utensils />}
              </span>
              <div>
                <h3>{b.title}</h3>
                <p>{b.description}</p>
              </div>
              <ChevronRight size={18} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
function MemberCardScreen() {
  const { member, progress } = useMembers();
  return (
    <>
      <PageHeader
        title="Mijn QR-code"
        subtitle="Jouw persoonlijke pas, altijd bij de hand"
      />
      <MemberCard member={member} progress={progress} />
    </>
  );
}
function RegisterVisit() {
  const { visits, createVisit, mode } = useMembers();
  const requestId = useRef({ payload: "", id: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const date = new Date();
  const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return (
    <>
      <PageHeader
        title="Nieuw bezoek registreren"
        subtitle="We kijken uit naar je komst"
      />
      <div className="split">
        <section className="card form-card">
          {success ? (
            <div className="success" role="status">
              <span className="success-icon">
                <Check size={32} />
              </span>
              <h2>Bezoek aangemeld</h2>
              <p>
                De receptie controleert de boeking. Je kunt de status volgen bij
                Mijn boekingen.
              </p>
              {mode === "demo" && (
                <p className="muted">
                  Dit is een demo: het bezoek wordt niet opgeslagen.
                </p>
              )}
              <Link href={`/boekingen/${success}`} className="primary">
                Bekijk je boeking <ArrowRight size={18} />
              </Link>
              <button
                className="text-button"
                onClick={() => {
                  setSuccess(null);
                  requestId.current = { payload: "", id: "" };
                  lock.current = false;
                }}
              >
                Nog een bezoek aanmelden
              </button>
            </div>
          ) : (
            <>
              <h2>Een nieuw moment om naar uit te kijken</h2>
              <p>
                Vul je boekingsgegevens in om je volgende bezoek te registreren.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (lock.current) return;
                  const data = new FormData(e.currentTarget);
                  const number = String(data.get("bookingNumber") ?? "").trim();
                  const arrival = String(data.get("arrivalDate") ?? "");
                  const problem = validateVisit(number, arrival, visits, today);
                  if (problem) {
                    setError(problem);
                    return;
                  }
                  lock.current = true;
                  setBusy(true);
                  const payload = JSON.stringify([
                    number.toUpperCase(),
                    arrival,
                  ]);
                  if (requestId.current.payload !== payload)
                    requestId.current = { payload, id: crypto.randomUUID() };
                  try {
                    const visit = await createVisit(
                      { bookingNumber: number, arrivalDate: arrival },
                      requestId.current.id,
                    );
                    setSuccess(visit.id);
                    setError("");
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Aanmelden mislukt. Probeer het opnieuw.",
                    );
                  } finally {
                    setBusy(false);
                    lock.current = false;
                  }
                }}
              >
                <label htmlFor="bookingNumber">Boekingsnummer</label>
                <input
                  id="bookingNumber"
                  name="bookingNumber"
                  placeholder="Bijv. 25358026"
                  required
                  minLength={4}
                  maxLength={30}
                  autoComplete="off"
                  aria-describedby={error ? "form-error" : undefined}
                />
                <label htmlFor="arrivalDate">Aankomstdatum</label>
                <input
                  id="arrivalDate"
                  name="arrivalDate"
                  type="date"
                  min={today}
                  required
                  aria-describedby={error ? "form-error" : undefined}
                />
                {error && (
                  <p id="form-error" className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="primary" disabled={busy} type="submit">
                  {busy ? "Bezoek aanmelden…" : "Bezoek aanmelden"}
                  <ArrowRight size={20} />
                </button>
              </form>
              <div className="info-box">
                <Clock3 size={25} />
                <p>
                  Na aanmelding controleren wij de boeking. Alleen goedgekeurde
                  bezoeken tellen mee voor je beloning.
                </p>
              </div>
            </>
          )}
        </section>
        <Hero small />
      </div>
    </>
  );
}
function Bookings() {
  const { visits } = useMembers();
  const [filter, setFilter] = useState("Alles");
  const filtered = visits.filter(
    (v) =>
      filter === "Alles" ||
      (filter === "Aankomend" && ["PENDING", "APPROVED"].includes(v.status)) ||
      (filter === "Bezocht" && v.status === "COMPLETED") ||
      (filter === "Beloningen" && !!v.reward),
  );
  return (
    <>
      <PageHeader
        title="Mijn boekingen"
        subtitle="Mooie herinneringen. Nieuwe vooruitzichten."
      />
      <div className="filters" aria-label="Boekingen filteren">
        {["Alles", "Aankomend", "Bezocht", "Beloningen"].map((f) => (
          <button
            key={f}
            className={filter === f ? "selected" : ""}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="bookings-list">
        {filtered.length ? (
          filtered.map((v) => <VisitCard visit={v} key={v.id} />)
        ) : (
          <EmptyState title="Geen boekingen in deze categorie" />
        )}
      </div>
      <p className="list-note">
        <ShieldCheck size={16} /> Al je verblijven overzichtelijk op één plek.
      </p>
    </>
  );
}
function BookingDetail({ id }: { id: string }) {
  const { visits, member } = useMembers();
  const v = visits.find((v) => v.id === id);
  if (!v)
    return (
      <>
        <PageHeader title="Boeking niet gevonden" back="/boekingen" />
        <EmptyState title="Deze boeking is niet beschikbaar" />
      </>
    );
  return (
    <>
      <PageHeader title="Jouw boeking" back="/boekingen" />
      <div className="card detail-card">
        <div className="detail-symbol">
          <CalendarDays size={32} />
        </div>
        <h2>Parkhotel Bad Arcen</h2>
        <p>Boeking #{v.bookingNumber}</p>
        <StatusBadge status={v.status} />
        <dl>
          <div>
            <dt>Aankomst</dt>
            <dd>{formatDate(v.arrivalDate)}</dd>
          </div>
          <div>
            <dt>Member</dt>
            <dd>{member.memberNumber}</dd>
          </div>
          <div>
            <dt>Aangemeld op</dt>
            <dd>{formatDate(v.createdAt)}</dd>
          </div>
        </dl>
        {v.reward && (
          <div className="info-box">
            <Gift />
            <p>{v.reward}</p>
          </div>
        )}
        <p>
          {v.status === "PENDING"
            ? "Je boeking wordt gecontroleerd. Dit bezoek telt nog niet mee voor je beloning."
            : v.status === "REJECTED"
              ? "Dit bezoek telt niet mee. Neem contact op met de receptie voor meer informatie."
              : "Dit verblijf telt mee voor je beloningsvoortgang."}
        </p>
        <Link className="primary" href="/qr-code">
          Bekijk je Member Card <ArrowRight size={18} />
        </Link>
      </div>
    </>
  );
}
function Rewards() {
  const { progress: p, rewards, nextRewardName } = useMembers();
  return (
    <>
      <PageHeader
        title="Beloningsvoortgang"
        subtitle="We maken terugkomen nog een beetje mooier"
      />
      <div className="reward-grid">
        <section className="card reward-progress">
          <span className="eyebrow">JOUW VOORTGANG</span>
          <h2>Elk verblijf telt.</h2>
          <div className="milestones">
            {Array.from({ length: p.required }, (_, i) => (
              <span
                key={i}
                className={i < p.current ? "earned" : ""}
                aria-label={`Bezoek ${i + 1}: ${i < p.current ? "behaald" : "nog te gaan"}`}
              >
                <BedDouble size={26} />
                {i < p.current && (
                  <i>
                    <Check size={10} />
                  </i>
                )}
              </span>
            ))}
          </div>
          <h3>
            {p.current} van {p.required} bezoeken
          </h3>
          <p>
            {p.remaining
              ? `Nog ${p.remaining === 1 ? "één" : p.remaining} bezoek${p.remaining !== 1 ? "en" : ""} en je ontvangt je volgende beloning.`
              : "Je volgende beloning kan worden toegekend."}
          </p>
          <RewardCard name={nextRewardName} remaining={p.remaining} detail />
        </section>
        <section className="card history">
          <h2>Eerder verdiend</h2>
          <p className="muted">Kleine extraatjes, mooie herinneringen.</p>
          {!rewards.length && <p>Je hebt nog geen beloningen verdiend.</p>}
          {rewards.map((r) => (
            <div className="history-row" key={r.id}>
              <Gift size={22} />
              <div>
                <strong>{r.name}</strong>
                <span>
                  {formatDate(r.earnedAt)} ·{" "}
                  {r.status === "AVAILABLE"
                    ? "Beschikbaar"
                    : r.status === "REDEEMED"
                      ? "Gebruikt"
                      : "Verlopen"}
                </span>
              </div>
              <Check size={16} />
            </div>
          ))}
          <div className="info-box">
            <Info size={23} />
            <p>
              Na {p.required} goedgekeurde verblijven ontvang je een beloning.
              Daarna start een nieuwe cyclus.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
function Benefits() {
  const { benefits, promotions, mode } = useMembers();
  return (
    <>
      <PageHeader
        title="Mijn voordelen"
        subtitle="Een beetje extra, speciaal voor jou"
      />
      <p className="intro">
        Als Parkbad Member profiteer je van exclusieve voordelen tijdens je
        verblijf.
      </p>
      {benefits.length === 0 && (
        <p>Er zijn momenteel geen actieve voordelen.</p>
      )}
      {promotions.length > 0 && (
        <section className="promotions">
          <h2>Acties</h2>
          {promotions.map((p) => (
            <article className="card detail-card" key={p.id}>
              {p.image && (
                <div className="editorial-image">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="(max-width:700px) 100vw, 800px"
                    unoptimized={p.image.startsWith("https://")}
                  />
                </div>
              )}
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <small>
                Van {formatDate(p.startDate)} tot en met {formatDate(p.endDate)}
              </small>
            </article>
          ))}
        </section>
      )}
      <div className="benefits-grid">
        {benefits
          .filter((b) => b.active)
          .map((b, i) => (
            <BenefitCard key={b.id} benefit={b} index={i} />
          ))}
      </div>
      <p className="list-note">
        {mode === "demo"
          ? "Voordelen en sfeerbeelden zijn ter illustratie."
          : "Vraag de receptie naar de voorwaarden van jouw voordelen."}
      </p>
    </>
  );
}
const menu = [
  {
    title: "Mijn profiel",
    desc: "Gegevens en instellingen",
    href: "/profiel",
    icon: UserRound,
  },
  {
    title: "Mijn voordelen",
    desc: "Alle Member-voordelen",
    href: "/voordelen",
    icon: Gift,
  },
  {
    title: "Thermaalbad",
    desc: "Tijd voor ontspanning",
    href: "/voordelen/thermaalbad",
    icon: Waves,
  },
  {
    title: "Eten & drinken",
    desc: "Samen genieten",
    href: "/voordelen/eten-drinken",
    icon: Utensils,
  },
  {
    title: "Hotel informatie",
    desc: "Goed om te weten",
    href: "/hotel",
    icon: BedDouble,
  },
  {
    title: "Contact",
    desc: "We helpen je graag",
    href: "/contact",
    icon: Mail,
  },
  {
    title: "Voorwaarden",
    desc: "Over het membership",
    href: "/voorwaarden",
    icon: ShieldCheck,
  },
];
function Logout() {
  const dialog = useRef<HTMLDialogElement>(null);
  const { reset, mode } = useMembers();
  const router = useRouter();
  return (
    <>
      <button className="logout" onClick={() => dialog.current?.showModal()}>
        <LogOut size={21} />
        Uitloggen
        <ChevronRight size={19} />
      </button>
      <dialog ref={dialog} className="confirm-dialog">
        <button
          className="dialog-close"
          aria-label="Sluiten"
          onClick={() => dialog.current?.close()}
        >
          <X />
        </button>
        <h2>{mode === "demo" ? "Demo afsluiten?" : "Uitloggen?"}</h2>
        <p>
          {mode === "demo"
            ? "Je toegevoegde demobezoeken worden gewist."
            : "Je kunt later opnieuw inloggen met Google. Je gegevens blijven bewaard."}
        </p>
        <button
          className="primary"
          onClick={() => {
            if (mode === "sheets") {
              void signOut({ callbackUrl: "/" });
              return;
            }
            reset();
            dialog.current?.close();
            router.push("/welkom");
          }}
        >
          {mode === "demo" ? "Demo afsluiten" : "Uitloggen"}
        </button>
        <button className="secondary" onClick={() => dialog.current?.close()}>
          Annuleren
        </button>
      </dialog>
    </>
  );
}
function More() {
  return (
    <>
      <PageHeader title="Meer" subtitle="Alles voor een ontspannen verblijf" />
      <div className="card menu-card">
        {menu.map(({ title, desc, href, icon: Icon }) => (
          <Link className="menu-row" href={href} key={href}>
            <Icon size={25} />
            <div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
            <ChevronRight size={19} />
          </Link>
        ))}
        <Logout />
      </div>
    </>
  );
}
function Profile() {
  const { member } = useMembers();
  return (
    <>
      <PageHeader title="Mijn profiel" back="/meer" />
      <div className="card profile-card">
        <Brand />
        <h2>
          {member.firstName} {member.lastName}
        </h2>
        <p>Member {member.memberNumber}</p>
        <span className="muted">
          Lid sinds {formatDate(member.memberSince)}
        </span>
        <Stats />
        <div className="profile-links">
          {[
            {
              label: "Persoonlijke gegevens",
              href: "/gegevens",
              icon: UserRound,
            },
            {
              label: "Accountinstellingen",
              href: "/instellingen",
              icon: Settings,
            },
            { label: "Privacy", href: "/privacy", icon: ShieldCheck },
          ].map(({ label, href, icon: Icon }) => (
            <Link className="menu-row" key={href} href={href}>
              <Icon size={22} />
              <h3>{label}</h3>
              <ChevronRight size={19} />
            </Link>
          ))}
        </div>
        <Logout />
      </div>
    </>
  );
}
function InfoScreen({ route }: { route: string }) {
  const { member, benefits, mode } = useMembers();
  const benefit = benefits.find((b) => `voordelen/${b.id}` === route);
  if (benefit)
    return (
      <>
        <PageHeader title={benefit.title} back="/voordelen" />
        <div className="card editorial">
          <div className="editorial-image">
            <Image
              src={benefit.image}
              unoptimized={benefit.image.startsWith("https://")}
              alt="Sfeerimpressie"
              fill
              sizes="(max-width:700px) 100vw, 800px"
            />
          </div>
          <div className="editorial-copy">
            <span className="eyebrow">{benefit.category}</span>
            <h2>{benefit.description}</h2>
            <p>{benefit.detail}</p>
            <div className="info-box">
              <Info />
              <p>
                {mode === "demo"
                  ? "Voorbeeldcontent. De actuele voorwaarden volgen later."
                  : "Vraag de receptie naar beschikbaarheid en voorwaarden."}
              </p>
            </div>
            <Link href="/contact" className="primary">
              Vraag het de receptie <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </>
    );
  const content: Record<string, { title: string; text: string }> = {
    hotel: {
      title: "Hotel informatie",
      text: "Alles voor een zorgeloos verblijf bij Parkhotel Bad Arcen. Openingstijden, incheckinformatie en praktische details worden binnenkort toegevoegd.",
    },
    contact: {
      title: "Contact",
      text: "Een vraag over je verblijf, boeking of Member-voordeel? Loop gerust even langs bij de receptie van het hotel. We helpen je graag.",
    },
    voorwaarden: {
      title: "Voorwaarden",
      text: "De definitieve voorwaarden van Parkbad Members worden voor de lancering toegevoegd. Deze demo kent geen echte beloningen toe en registreert geen hotelboekingen.",
    },
    privacy: {
      title: "Privacy",
      text: "Deze demo gebruikt fictieve Member-gegevens. Nieuwe bezoeken worden alleen tijdelijk in het geheugen van deze browsersessie bewaard. Bij herladen vervallen je wijzigingen. Er worden geen boekingsgegevens naar een server verstuurd. Het definitieve privacybeleid volgt vóór de lancering.",
    },
    instellingen: {
      title: "Accountinstellingen",
      text: "Je bekijkt een demo-account. Inloggen, e-mailvoorkeuren en accountbeheer worden beschikbaar zodra authenticatie is aangesloten.",
    },
  };
  if (route === "gegevens")
    return (
      <>
        <PageHeader title="Persoonlijke gegevens" back="/profiel" />
        <div className="card detail-card">
          <h2>Jouw Member-gegevens</h2>
          <dl>
            {[
              ["Naam", `${member.firstName} ${member.lastName}`],
              ["E-mailadres", member.email],
              ["Membernummer", member.memberNumber],
              ["Lid sinds", formatDate(member.memberSince)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="muted">
            {mode === "demo"
              ? "Dit zijn fictieve gegevens."
              : "Neem voor het wijzigen van je gegevens contact op met de receptie."}
          </p>
        </div>
      </>
    );
  if (mode === "sheets") {
    content.privacy.text =
      "Je membership en bezoeken worden opgeslagen in de beveiligde administratie van Parkbad Members. Google verzorgt het inloggen. Je browser gebruikt een sessiecookie. Het volledige privacybeleid wordt voor de lancering toegevoegd.";
    content.voorwaarden.text =
      "Alleen goedgekeurde en bezochte verblijven tellen mee. De receptie kent beloningen toe. De definitieve voorwaarden volgen voor de lancering.";
    content.instellingen.text =
      "Je logt in met je Google-account. Neem voor wijzigingen in je membership contact op met de receptie.";
  }
  const c = content[route] ?? {
    title: "Voordeel niet beschikbaar",
    text: "Dit voordeel is niet meer actief. Bekijk Mijn voordelen voor het actuele aanbod.",
  };
  return (
    <>
      <PageHeader title={c.title} back="/meer" />
      <div className="card detail-card">
        <span className="detail-symbol">
          <Info size={30} />
        </span>
        <h2>{c.title}</h2>
        <p>{c.text}</p>
        <Link className="secondary" href="/meer">
          Terug naar Meer
        </Link>
      </div>
    </>
  );
}
export function MemberApp({ route }: { route: string }) {
  const { member, mode } = useMembers();
  let screen;
  if (route === "") screen = <HomeScreen />;
  else if (route === "qr-code") screen = <MemberCardScreen />;
  else if (route === "bezoek") screen = <RegisterVisit />;
  else if (route === "boekingen") screen = <Bookings />;
  else if (route.startsWith("boekingen/"))
    screen = <BookingDetail id={route.split("/")[1]} />;
  else if (route === "beloningen") screen = <Rewards />;
  else if (route === "voordelen") screen = <Benefits />;
  else if (route === "meer") screen = <More />;
  else if (route === "profiel") screen = <Profile />;
  else if (route === "welkom")
    screen = (
      <div className="welcome">
        <Brand />
        <Sparkles className="welcome-icon" />
        <h1>
          Een warm welkom.
          <br />
          <em>Elke keer weer.</em>
        </h1>
        <p>
          Jouw verblijf. Jouw voordelen.
          <br />
          Ontdek Parkbad Members.
        </p>
        <Link href="/" className="primary gold-button">
          {mode === "demo" ? "Open de demo" : "Mijn membership"}{" "}
          <ArrowRight size={19} />
        </Link>
      </div>
    );
  else screen = <InfoScreen route={route} />;
  return (
    <div
      className={`app-shell ${route === "welkom" ? "welcome-shell" : route ? "secondary-page" : ""}`}
    >
      <a className="skip-link" href="#main">
        Ga naar inhoud
      </a>
      <div className="topbar">
        <Link href="/" aria-label="Parkbad Members Home">
          <Brand compact />
        </Link>
        <span className="topbar-note">JOUW VERBLIJF. JOUW VOORDELEN.</span>
        <Link className="desktop-member" href="/profiel">
          <span className="avatar">
            {member.firstName[0]}
            {member.lastName[0]}
          </span>
          <span>
            {member.firstName} {member.lastName}
            <small>Member {member.memberNumber}</small>
          </span>
        </Link>
      </div>
      {mode === "demo" && (
        <div className="demo-note">
          Demoversie <span>·</span> Ontdek jouw membership
        </div>
      )}
      <main
        id="main"
        className={`main-content ${route === "" ? "home-page" : ""}`}
      >
        {screen}
      </main>
      <footer className="desktop-footer">
        <span>PARKBAD MEMBERS</span>
        <span>Meer dan een verblijf.</span>
      </footer>
      <BottomNavigation route={route} />
    </div>
  );
}

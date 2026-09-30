import Image from "next/image";
import Link from "next/link";

export function AuthShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action: { prompt: string; label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link href="/" className="auth-brand" aria-label="Parkhotel Bad Arcen Members Home">
          <span>PARKHOTEL BAD ARCEN</span>
          <small>MEMBERS</small>
        </Link>
        <div className="auth-copy">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
        <p className="auth-switch">
          {action.prompt} <Link href={action.href}>{action.label}</Link>
        </p>
        <div className="auth-parent-brand" aria-label="Onderdeel van Landal">
          <span>Onderdeel van</span>
          <Image
            src="/images/landal-logo-horizontal-teal.png"
            alt="Landal Holiday Breaks in nature"
            width={250}
            height={118}
            priority
          />
        </div>
      </section>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link href="/" className="auth-brand" aria-label="Parkbad Members Home">
          <span>PARKBAD</span>
          <small>MEMBERS</small>
        </Link>
        <div className="auth-copy">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
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

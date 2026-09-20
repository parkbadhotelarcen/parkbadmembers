"use client";
import Link from "next/link";
import { CalendarDays, Home, MoreHorizontal, Plus, QrCode } from "lucide-react";
const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/qr-code", label: "QR-code", icon: QrCode },
  { href: "/bezoek", label: "Bezoek +", icon: Plus },
  { href: "/boekingen", label: "Boekingen", icon: CalendarDays },
  { href: "/meer", label: "Meer", icon: MoreHorizontal },
];
export function BottomNavigation({ route }: { route: string }) {
  const active =
    route === ""
      ? "/"
      : route.startsWith("boekingen")
        ? "/boekingen"
        : ["qr-code", "bezoek"].includes(route)
          ? `/${route}`
          : route === "beloningen"
            ? "/"
            : "/meer";
  return (
    <nav className="bottom-nav" aria-label="Hoofdnavigatie">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          href={href}
          key={href}
          aria-current={href === active ? "page" : undefined}
          className={`${href === active ? "active" : ""} ${href === "/bezoek" ? "add-visit" : ""}`}
        >
          <span>
            <Icon size={23} strokeWidth={1.65} />
          </span>
          <small>{label}</small>
        </Link>
      ))}
    </nav>
  );
}

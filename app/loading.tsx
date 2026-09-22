"use client";
import { usePathname } from "next/navigation";
import { BottomNavigation } from "@/components/navigation";
export default function Loading() {
  const route = usePathname().slice(1);
  return (
    <>
      <main className="loading" aria-label="Pagina laden" aria-busy="true">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </main>
      <BottomNavigation route={route} />
    </>
  );
}

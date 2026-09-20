import { notFound } from "next/navigation";
import { MemberApp } from "@/components/member-app";
const paths = [
  "",
  "qr-code",
  "bezoek",
  "boekingen",
  "beloningen",
  "voordelen",
  "meer",
  "profiel",
  "gegevens",
  "instellingen",
  "privacy",
  "contact",
  "voorwaarden",
  "hotel",
  "welkom",
  "voordelen/thermaalbad",
  "voordelen/eten-drinken",
  "voordelen/verblijf",
  "voordelen/acties",
];
export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  const route = slug.join("/");
  if (!paths.includes(route) && !(slug[0] === "boekingen" && slug.length === 2))
    notFound();
  return <MemberApp route={route} />;
}

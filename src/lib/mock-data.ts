import type { Member, Visit, UserReward, Benefit } from "./types";
export const member: Member = {
  id: "a71b9e81-3c74-48b8-9f33-2ebc735f2486",
  memberNumber: "KV-001",
  firstName: "Milan",
  lastName: "P.",
  email: "milan@example.com",
  memberSince: "2026-06-20",
  memberLevel: "MEMBER",
  role: "USER",
  status: "ACTIVE",
};
export const initialVisits: Visit[] = [
  {
    id: "visit-4",
    userId: member.id,
    bookingNumber: "25358026",
    arrivalDate: "2026-11-21",
    status: "PENDING",
    createdAt: "2026-09-19",
  },
  {
    id: "visit-3",
    userId: member.id,
    bookingNumber: "24789123",
    arrivalDate: "2026-10-06",
    status: "APPROVED",
    createdAt: "2026-09-01",
    reward: "Zakje snoepgoed",
  },
  {
    id: "visit-2",
    userId: member.id,
    bookingNumber: "24633110",
    arrivalDate: "2026-09-05",
    status: "COMPLETED",
    createdAt: "2026-08-20",
    reward: "Welkomstdrankje",
  },
  {
    id: "visit-1",
    userId: member.id,
    bookingNumber: "23877654",
    arrivalDate: "2025-03-01",
    status: "COMPLETED",
    createdAt: "2025-02-20",
    reward: "Eerste Member-voordeel",
  },
];
export const rewards: UserReward[] = [
  {
    id: "r3",
    userId: member.id,
    name: "Zakje snoepgoed",
    earnedAt: "2026-10-06",
    status: "REDEEMED",
  },
  {
    id: "r1",
    userId: member.id,
    name: "Welkomstdrankje",
    earnedAt: "2026-09-05",
    status: "REDEEMED",
  },
  {
    id: "r2",
    userId: member.id,
    name: "Eerste Member-voordeel",
    earnedAt: "2025-03-01",
    status: "REDEEMED",
  },
];
export const benefits: Benefit[] = [
  {
    id: "thermaalbad",
    title: "Thermaalbad",
    description: "Ontspanning met voordeel",
    detail:
      "Kom tot rust en maak tijd voor jezelf. Vraag tijdens je verblijf bij de receptie naar de actuele Member-voordelen voor het thermaalbad.",
    image: "/images/pool.jpg",
    category: "Ontspanning",
    active: true,
  },
  {
    id: "eten-drinken",
    title: "Eten & drinken",
    description: "Speciale Member-aanbiedingen",
    detail:
      "Van een rustig ontbijt tot een sfeervol diner. Ontdek bij de receptie welke Member-aanbiedingen tijdens jouw verblijf beschikbaar zijn.",
    image: "/images/dining.jpg",
    category: "Culinair",
    active: true,
  },
  {
    id: "verblijf",
    title: "Mijn verblijf",
    description: "Handige informatie",
    detail:
      "Alles voor een ontspannen verblijf. Voor informatie over inchecken, uitchecken en faciliteiten helpt de receptie je graag verder.",
    image: "/images/room.jpg",
    category: "Het hotel",
    active: true,
  },
  {
    id: "acties",
    title: "Acties",
    description: "Tijdelijke acties & verrassingen",
    detail:
      "Kleine verrassingen maken je verblijf bijzonder. Nieuwe Member-acties verschijnen hier zodra ze beschikbaar zijn.",
    image: "/images/dining.jpg",
    category: "Speciaal voor jou",
    active: true,
  },
];
// Set only after the original, standalone brand asset has been supplied.
export const brand = {
  logoSrc: null as string | null,
  heroImage: "/images/pool.jpg",
};
// The supplied demo spans different dates; this snapshot makes 21 November
// the next visit while retaining the requested historical booking examples.
export const demoReferenceDate = "2026-10-07";

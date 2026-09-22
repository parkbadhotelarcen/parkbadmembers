import { MemberApp } from "@/components/member-app";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemberApp route={`boekingen/${id}`} />;
}

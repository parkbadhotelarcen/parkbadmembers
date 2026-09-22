import { MemberApp } from "@/components/member-app";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemberApp route={`voordelen/${id}`} />;
}

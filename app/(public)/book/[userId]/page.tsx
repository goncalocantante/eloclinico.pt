import PublicProfile from "@/components/public-profile";
import { getPublicProfile } from "@/lib/db/queries/queries";
import { notFound } from "next/navigation";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const user = await getPublicProfile(userId);
  if (!user) {
    notFound();
  }

  const { name } = user; // Extract the user's full name

  // Render PublicProfile component
  return <PublicProfile userId={userId} fullName={name} />;
}

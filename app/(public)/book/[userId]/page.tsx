import PublicProfile from "@/components/public-profile";
import { getUser } from "@/lib/db/queries/queries";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const user = await getUser();
  if (!user) {
    throw new Error("User is not authenticated");
  }

  const { name } = user; // Extract the user's full name

  // Render PublicProfile component
  return <PublicProfile userId={userId} fullName={name} />;
}

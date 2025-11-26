"use client";

// import Loading from "@/components/Loading";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function PublicPage() {
  //   const { user, isLoaded } = useUser(); // Using `isLoaded` to check if user data is available
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();

  const user = session?.user;
  if (isPending) {
    // Display loading until user data is loaded
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect to login if no user is found
    return redirect("/login");
  }

  // Once user is available, redirect to the booking page [Public Profile Page]
  return redirect(`/book/${user.id}`);
}

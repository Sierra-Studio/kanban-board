"use client";

import { useRouter } from "next/navigation";
import { signOut } from "~/lib/auth-client";
import { Button } from "~/components/ui";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <Button onClick={handleSignOut} variant="ghost" size="sm">
      Sign Out
    </Button>
  );
}
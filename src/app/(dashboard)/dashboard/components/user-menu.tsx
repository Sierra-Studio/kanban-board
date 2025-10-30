import { getSession } from "~/server/auth/client";
import { SignOutButton } from "./sign-out-button";

export async function UserMenu() {
  const session = await getSession();

  if (!session) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <p className="font-medium text-gray-900">{session.user.name || "User"}</p>
        <p className="text-gray-500">{session.user.email}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
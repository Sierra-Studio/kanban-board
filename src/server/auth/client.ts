import { auth } from "./config";
import { headers } from "next/headers";

// Helper function to get session in Server Components
export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

// Helper function to require authentication
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
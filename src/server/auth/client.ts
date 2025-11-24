import { auth } from "./config";
import { headers } from "next/headers";
import { runSessionConsistencyCheck } from "./session-consistency";

// Helper function to get session in Server Components
export async function getSession() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  await runSessionConsistencyCheck(requestHeaders);

  return session;
}

// Helper function to require authentication
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

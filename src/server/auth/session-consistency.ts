import { auth } from "./config";

export async function runSessionConsistencyCheck(
  requestHeaders: Headers | HeadersInit,
): Promise<void> {
  try {
    await auth.api.getSession({
      headers: requestHeaders,
      query: {
        disableCookieCache: true,
        disableRefresh: true,
      },
    });
  } catch (error) {
    console.warn("Session consistency check failed", error);
  }
}

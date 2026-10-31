import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";

// Cached per-request: layout + page share one DB session query instead of two.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

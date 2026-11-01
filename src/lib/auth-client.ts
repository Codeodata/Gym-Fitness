"use client";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  fetchOptions: {
    headers: {
      // Bypasses ngrok's browser warning interstitial in dev tunnels
      "ngrok-skip-browser-warning": "true",
    },
  },
  // Permite pasar membershipRenewsAt (date) en signUp.email con tipado correcto.
  plugins: [inferAdditionalFields({ user: { membershipRenewsAt: { type: "date", required: false } } })],
});

export const { signIn, signUp, signOut, useSession } = authClient;

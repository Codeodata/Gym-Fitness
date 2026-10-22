"use client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  fetchOptions: {
    headers: {
      // Bypasses ngrok's browser warning interstitial in dev tunnels
      "ngrok-skip-browser-warning": "true",
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;

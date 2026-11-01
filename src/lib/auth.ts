import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb, schema } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.APP_BASE_URL!,
  trustedOrigins: () => {
    const extra = process.env.TRUSTED_ORIGINS?.split(",") ?? [];
    const base = process.env.APP_BASE_URL ? [process.env.APP_BASE_URL] : [];
    return ["http://localhost:3000", "http://localhost:3001", ...base, ...extra];
  },
  emailAndPassword: {
    enabled: true,
    // After registration, client must wait for trainer approval
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      // No settable desde el cliente: el valor lo fija el servidor / el profe.
      role: { type: "string", defaultValue: "client", input: false },
      approved: { type: "boolean", defaultValue: false, input: false },
      active: { type: "boolean", defaultValue: true, input: false },
      // Fecha de renovación del plan: la carga el alumno al registrarse.
      membershipRenewsAt: { type: "date", required: false, input: true },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

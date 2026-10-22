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
    return ["http://localhost:3000", "http://localhost:3001", ...extra];
  },
  emailAndPassword: {
    enabled: true,
    // After registration, client must wait for trainer approval
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "client" },
      approved: { type: "boolean", defaultValue: false },
      active: { type: "boolean", defaultValue: true },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

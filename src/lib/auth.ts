import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
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
      // Datos que el alumno carga al registrarse.
      membershipRenewsAt: { type: "date", required: false, input: true },
      gender: { type: "string", required: false, input: true }, // 'chica' | 'chico'
    },
  },
  // Al dar de alta un alumno, avisar al profe con una notificación de registro.
  databaseHooks: {
    user: {
      create: {
        after: async (newUser) => {
          try {
            const role = (newUser as { role?: string }).role;
            if (role && role !== "client") return;
            const db = getDb();
            const [trainer] = await db
              .select({ id: schema.user.id })
              .from(schema.user)
              .where(eq(schema.user.role, "trainer"))
              .limit(1);
            if (!trainer) return;
            await db.insert(schema.notification).values({
              fromId: newUser.id,
              toId: trainer.id,
              type: "registration",
              body: `Nuevo registro: ${newUser.name}${newUser.email ? ` (${newUser.email})` : ""}`,
            });
          } catch (err) {
            console.error("No se pudo avisar al profe del nuevo registro:", err);
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

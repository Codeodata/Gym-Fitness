import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
  },
} satisfies Config;

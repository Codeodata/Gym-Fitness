import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as PgPool } from "pg";
import { Pool as NeonPool } from "@neondatabase/serverless";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzlePg<typeof schema>>;

let _db: Db | null = null;

export function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL!;
    const isLocal = url.includes("localhost") || url.includes("127.0.0.1");

    if (isLocal) {
      const pool = new PgPool({ connectionString: url });
      _db = drizzlePg(pool, { schema });
    } else {
      // Neon serverless uses WebSockets — no TCP connection pool limits
      const pool = new NeonPool({ connectionString: url });
      _db = drizzleNeon(pool, { schema }) as unknown as Db;
    }
  }
  return _db;
}

export { schema };

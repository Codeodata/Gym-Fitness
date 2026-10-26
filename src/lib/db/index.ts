import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as PgPool } from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";

// Required for @neondatabase/serverless Pool in Node.js runtime (not edge)
if (typeof globalThis.WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = globalThis.WebSocket;
}

type Db = ReturnType<typeof drizzlePg<typeof schema>>;

let _db: Db | null = null;

export function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL!;
    const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
    const isNeon = url.includes("neon.tech");

    if (isLocal) {
      const pool = new PgPool({ connectionString: url });
      _db = drizzlePg(pool, { schema });
    } else if (isNeon) {
      // Neon serverless uses WebSockets — no TCP connection pool limits
      const pool = new NeonPool({ connectionString: url });
      _db = drizzleNeon(pool, { schema }) as unknown as Db;
    } else {
      // Non-Neon cloud DB (e.g. Supabase): use pg with SSL
      const pool = new PgPool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
      });
      _db = drizzlePg(pool, { schema });
    }
  }
  return _db;
}

export { schema };

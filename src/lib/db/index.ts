import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const isLocal = process.env.DATABASE_URL?.includes("localhost");
    const parsed = new URL(process.env.DATABASE_URL!);
    parsed.searchParams.delete("sslmode");
    const pool = new Pool({
      connectionString: parsed.toString(),
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

export { schema };

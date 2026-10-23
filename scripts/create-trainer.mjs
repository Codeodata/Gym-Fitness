import { hashPassword } from "../node_modules/.pnpm/@better-auth+utils@0.5.0/node_modules/@better-auth/utils/dist/password.node.mjs";
import pg from "pg";
import { readFileSync } from "fs";

// Load .env.local
const envLocal = readFileSync(".env.local", "utf8");
const dbUrl = envLocal.match(/DATABASE_URL=(.+)/)?.[1]?.trim();

if (!dbUrl) {
  console.error("No DATABASE_URL in .env.local");
  process.exit(1);
}

const parsed = new URL(dbUrl);
parsed.searchParams.delete("sslmode");

const pool = new pg.Pool({
  connectionString: parsed.toString(),
  ssl: { rejectUnauthorized: false },
});

const newId = crypto.randomUUID();
const password = "Admin26";
const hash = await hashPassword(password);

await pool.query(
  `INSERT INTO "user" (id, name, email, email_verified, role, approved, active, created_at, updated_at)
   VALUES ($1, $2, $3, true, 'trainer', true, true, NOW(), NOW())
   ON CONFLICT (email) DO UPDATE SET role='trainer', approved=true`,
  [newId, "Admin", "admin@gym.com"]
);

// Get the real user ID (may differ from newId if user already existed)
const { rows } = await pool.query(`SELECT id FROM "user" WHERE email = 'admin@gym.com'`);
const userId = rows[0].id;

// Replace any existing credential account with the correct one
await pool.query(`DELETE FROM "account" WHERE user_id = $1 AND provider_id = 'credential'`, [userId]);
const accountId = crypto.randomUUID();
await pool.query(
  `INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)
   VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
  [accountId, userId, userId, hash]
);

console.log("✓ Trainer creado: admin@gym.com / Admin26");
await pool.end();

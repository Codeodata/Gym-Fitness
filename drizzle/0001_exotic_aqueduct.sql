ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "membership_renews_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "membership_paid_at" timestamp;

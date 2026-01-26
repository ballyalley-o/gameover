ALTER TABLE "trades" ADD COLUMN "from_exception_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "to_exception_used" integer DEFAULT 0 NOT NULL;
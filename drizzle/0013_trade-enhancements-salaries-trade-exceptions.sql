ALTER TABLE "rosters" ADD COLUMN "contract_start_year" smallint;--> statement-breakpoint
ALTER TABLE "rosters" ADD COLUMN "salary_by_year" jsonb;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "exception_budget" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "exception_type" varchar(32);
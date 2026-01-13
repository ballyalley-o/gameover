CREATE TYPE "public"."conference" AS ENUM('Eastern', 'Western');--> statement-breakpoint
CREATE TYPE "public"."division" AS ENUM('Southeast', 'Central', 'Atlantic', 'Southwest', 'Northwest', 'Pacific');--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "team_id" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "stadium_id" smallint;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "status" "status";--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "city" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "key" varchar(3) NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "conference" "conference";--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "division" "division";--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "primary_color" varchar(8);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "secondary_color" varchar(8);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "tertiary_color" varchar(8);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "quaternary_color" varchar(8);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "logo_url" varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "wordmark_url" varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "headcoach" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_team_id_unique" UNIQUE("team_id");--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_stadium_id_unique" UNIQUE("stadium_id");--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_key_unique" UNIQUE("key");
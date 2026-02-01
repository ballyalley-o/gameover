CREATE TYPE "public"."membership_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TYPE "public"."my_league_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."my_league_status" AS ENUM('pending', 'active', 'locked', 'finished');--> statement-breakpoint
CREATE TYPE "public"."membership_source" AS ENUM('invite', 'request', 'system');--> statement-breakpoint
CREATE TABLE "my_league_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "my_league_role" DEFAULT 'member' NOT NULL,
	"status" "membership_status" DEFAULT 'pending' NOT NULL,
	"source" "membership_source" DEFAULT 'system' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "my_league_teams" ADD COLUMN "is_cpu" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "my_leagues" ADD COLUMN "status" "my_league_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "my_leagues" ADD COLUMN "max_user" smallint;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(255);--> statement-breakpoint
ALTER TABLE "my_league_memberships" ADD CONSTRAINT "my_league_memberships_league_id_my_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."my_leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my_league_memberships" ADD CONSTRAINT "my_league_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_my_league_membership_league" ON "my_league_memberships" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_my_league_membership_user" ON "my_league_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_my_league_membership_status" ON "my_league_memberships" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_my_league_membership_league_user" ON "my_league_memberships" USING btree ("league_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_my_league_teams_league_base_team" ON "my_league_teams" USING btree ("league_id","base_team_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");
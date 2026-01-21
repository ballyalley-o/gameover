ALTER TABLE "rosters" RENAME COLUMN "team_id" TO "in_team_id";--> statement-breakpoint
ALTER TABLE "rosters" DROP CONSTRAINT "rosters_team_id_teams_id_fk";
--> statement-breakpoint
DROP INDEX "idx_rosters_team";--> statement-breakpoint
DROP INDEX "uq_rosters_team_player";--> statement-breakpoint
ALTER TABLE "rosters" ADD COLUMN "ex_team_id" varchar(64);--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_in_team_id_teams_id_fk" FOREIGN KEY ("in_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_ex_team_id_teams_team_id_fk" FOREIGN KEY ("ex_team_id") REFERENCES "public"."teams"("team_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_rosters_team" ON "rosters" USING btree ("in_team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rosters_team_player" ON "rosters" USING btree ("in_team_id","player_id");
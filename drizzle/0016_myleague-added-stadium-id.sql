ALTER TABLE "my_league_teams" ADD COLUMN "stadium_id" smallint;--> statement-breakpoint
ALTER TABLE "my_league_teams" ADD CONSTRAINT "my_league_teams_stadium_id_unique" UNIQUE("stadium_id");
CREATE TYPE "public"."archetype" AS ENUM('playmaker', 'sharpshooter', 'slasher', 'two_way', 'rim_protector', 'stretch_big', 'rebounder', 'utility');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('scheduled', 'completed', 'simulated');--> statement-breakpoint
CREATE TYPE "public"."position" AS ENUM('PG', 'SG', 'SF', 'PF', 'C');--> statement-breakpoint
CREATE TABLE "chemistry_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_a_id" uuid NOT NULL,
	"player_b_id" uuid NOT NULL,
	"score" smallint NOT NULL,
	"reason" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"clock_sec" integer NOT NULL,
	"team_id" uuid NOT NULL,
	"player_id" uuid,
	"type" varchar(24) NOT NULL,
	"value" smallint,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_team_id" uuid NOT NULL,
	"away_team_id" uuid NOT NULL,
	"home_lineup_id" uuid,
	"away_lineup_id" uuid,
	"home_score" integer DEFAULT 0 NOT NULL,
	"away_score" integer DEFAULT 0 NOT NULL,
	"status" "game_status" DEFAULT 'scheduled' NOT NULL,
	"sim_seed" integer,
	"played_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lineup_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lineup_id" uuid NOT NULL,
	"overall" smallint NOT NULL,
	"offense" smallint NOT NULL,
	"defense" smallint NOT NULL,
	"rebounding" smallint NOT NULL,
	"pace" smallint NOT NULL,
	"chemistry" smallint NOT NULL,
	"computed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lineups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slots" jsonb NOT NULL,
	"pace_pref" smallint,
	"style_tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"archetype" "archetype" NOT NULL,
	"positions" "position"[] NOT NULL,
	"height_inches" smallint,
	"weight_lbs" smallint,
	"overall" smallint,
	"offense" smallint,
	"defense" smallint,
	"rebounding" smallint,
	"passing" smallint,
	"iq" smallint,
	"pace" smallint,
	"clutch" smallint,
	"stamina" smallint,
	"injury_risk" varchar(16),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"contract_years" smallint,
	"salary" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid,
	"name" varchar(255) NOT NULL,
	"market" varchar(255),
	"style_tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chemistry_links" ADD CONSTRAINT "chemistry_links_player_a_id_players_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chemistry_links" ADD CONSTRAINT "chemistry_links_player_b_id_players_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_home_lineup_id_lineups_id_fk" FOREIGN KEY ("home_lineup_id") REFERENCES "public"."lineups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_away_lineup_id_lineups_id_fk" FOREIGN KEY ("away_lineup_id") REFERENCES "public"."lineups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineup_metrics" ADD CONSTRAINT "lineup_metrics_lineup_id_lineups_id_fk" FOREIGN KEY ("lineup_id") REFERENCES "public"."lineups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lineups" ADD CONSTRAINT "lineups_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_user_id_User_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chemistry_player_a" ON "chemistry_links" USING btree ("player_a_id");--> statement-breakpoint
CREATE INDEX "idx_chemistry_player_b" ON "chemistry_links" USING btree ("player_b_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_chemistry_pair" ON "chemistry_links" USING btree ("player_a_id","player_b_id");--> statement-breakpoint
CREATE INDEX "idx_game_events_game" ON "game_events" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_games_home_team" ON "games" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "idx_games_away_team" ON "games" USING btree ("away_team_id");--> statement-breakpoint
CREATE INDEX "idx_games_status" ON "games" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_lineup_metrics_lineup" ON "lineup_metrics" USING btree ("lineup_id");--> statement-breakpoint
CREATE INDEX "idx_lineups_team" ON "lineups" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_lineups_team_name" ON "lineups" USING btree ("team_id","name");--> statement-breakpoint
CREATE INDEX "idx_rosters_team" ON "rosters" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_rosters_player" ON "rosters" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rosters_team_player" ON "rosters" USING btree ("team_id","player_id");--> statement-breakpoint
CREATE INDEX "idx_teams_owner" ON "teams" USING btree ("owner_user_id");
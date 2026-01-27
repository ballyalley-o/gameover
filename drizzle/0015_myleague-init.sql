CREATE TABLE "my_league_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"base_player_id" uuid,
	"player_id" varchar(64) NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"archetype" "archetype" DEFAULT 'unknown',
	"positions" "position"[] NOT NULL,
	"status" "status" DEFAULT 'Active',
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
	"salary" integer,
	"injury_risk" varchar(16),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "my_league_rosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"league_team_id" uuid NOT NULL,
	"league_player_id" uuid NOT NULL,
	"draft_round" smallint,
	"draft_pick" smallint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "my_league_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"base_team_id" uuid,
	"owner_user_id" uuid,
	"city" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"key" varchar(3) NOT NULL,
	"conference" "conference",
	"division" "division",
	"primary_color" varchar(8),
	"secondary_color" varchar(8),
	"tertiary_color" varchar(8),
	"quaternary_color" varchar(8),
	"logo_url" varchar(255),
	"wordmark_url" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "my_leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "my_league_players" ADD CONSTRAINT "my_league_players_league_id_my_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."my_leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my_league_players" ADD CONSTRAINT "my_league_players_base_player_id_players_id_fk" FOREIGN KEY ("base_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my_league_rosters" ADD CONSTRAINT "my_league_rosters_league_id_my_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."my_leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my_league_rosters" ADD CONSTRAINT "my_league_rosters_league_team_id_my_league_teams_id_fk" FOREIGN KEY ("league_team_id") REFERENCES "public"."my_league_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my_league_rosters" ADD CONSTRAINT "my_league_rosters_league_player_id_my_league_players_id_fk" FOREIGN KEY ("league_player_id") REFERENCES "public"."my_league_players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my_league_teams" ADD CONSTRAINT "my_league_teams_league_id_my_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."my_leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my_league_teams" ADD CONSTRAINT "my_league_teams_base_team_id_teams_id_fk" FOREIGN KEY ("base_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my_league_teams" ADD CONSTRAINT "my_league_teams_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my_leagues" ADD CONSTRAINT "my_leagues_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_my_league_players_league" ON "my_league_players" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_my_league_players_base" ON "my_league_players" USING btree ("base_player_id");--> statement-breakpoint
CREATE INDEX "idx_my_league_rosters_league" ON "my_league_rosters" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_my_league_rosters_team" ON "my_league_rosters" USING btree ("league_team_id");--> statement-breakpoint
CREATE INDEX "idx_my_league_rosters_player" ON "my_league_rosters" USING btree ("league_player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_my_league_rosters_league_player" ON "my_league_rosters" USING btree ("league_id","league_player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_my_league_rosters_team_player" ON "my_league_rosters" USING btree ("league_team_id","league_player_id");--> statement-breakpoint
CREATE INDEX "idx_my_league_teams_league" ON "my_league_teams" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_my_league_teams_owner" ON "my_league_teams" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_my_league_teams_league_key" ON "my_league_teams" USING btree ("league_id","key");--> statement-breakpoint
CREATE INDEX "idx_my_leagues_owner" ON "my_leagues" USING btree ("owner_user_id");
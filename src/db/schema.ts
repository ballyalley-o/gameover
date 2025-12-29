import type { LineupSlot } from '../types/game'
import { pgEnum, pgTable, boolean, index, integer, jsonb, smallint, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

export const positionEnum = pgEnum('position', ['PG', 'SG', 'SF', 'PF', 'C'])
export const archetypeEnum = pgEnum('archetype', [
  'playmaker',
  'sharpshooter',
  'slasher',
  'two_way',
  'rim_protector',
  'stretch_big',
  'rebounder',
  'utility',
])
export const gameStatusEnum = pgEnum('game_status', ['scheduled', 'completed', 'simulated'])

export const users = pgTable('User', {
  id           : uuid('id').defaultRandom().primaryKey(),
  firstname    : varchar('firstname', { length: 255 }).notNull(),
  lastname     : varchar('lastname', { length: 255 }),
  email        : varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('emailVerified', { withTimezone: false, mode: 'date' }),
  password     : varchar('password', { length: 255 }),
  role         : varchar('role', { length: 32 }).$type<Role>().notNull().default('user'),
  createdAt    : timestamp('createdAt', { withTimezone: false, mode: 'date' }).notNull().defaultNow(),
  updatedAt    : timestamp('updatedAt', { withTimezone: false, mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
})

export const players = pgTable('players', {
  id          : uuid('id').defaultRandom().primaryKey(),
  name        : varchar('name', { length: 255 }).notNull(),
  archetype   : archetypeEnum('archetype').notNull(),
  positions   : positionEnum('positions').array().notNull(),
  heightInches: smallint('height_inches'),
  weightLbs   : smallint('weight_lbs'),
  overall     : smallint('overall'),
  offense     : smallint('offense'),
  defense     : smallint('defense'),
  rebounding  : smallint('rebounding'),
  passing     : smallint('passing'),
  iq          : smallint('iq'),
  pace        : smallint('pace'),
  clutch      : smallint('clutch'),
  stamina     : smallint('stamina'),
  injuryRisk  : varchar('injury_risk', { length: 16 }),
  createdAt   : timestamp('created_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow(),
  updatedAt   : timestamp('updated_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
})

export const teams = pgTable('teams', {
  id         : uuid('id').defaultRandom().primaryKey(),
  ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
  name       : varchar('name', { length: 255 }).notNull(),
  market     : varchar('market', { length: 255 }),
  styleTags  : text('style_tags').array(),
  createdAt  : timestamp('created_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow(),
  updatedAt  : timestamp('updated_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  ownerIdx: index('idx_teams_owner').on(table.ownerUserId),
}))

export const rosters = pgTable('rosters', {
  id         : uuid('id').defaultRandom().primaryKey(),
  teamId     : uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  playerId   : uuid('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  contractYrs: smallint('contract_years'),
  salary     : integer('salary'),
  isActive   : boolean('is_active').notNull().default(true),
  createdAt  : timestamp('created_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow(),
  updatedAt  : timestamp('updated_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  teamIdx      : index('idx_rosters_team').on(table.teamId),
  playerIdx    : index('idx_rosters_player').on(table.playerId),
  teamPlayerUq : uniqueIndex('uq_rosters_team_player').on(table.teamId, table.playerId),
}))

export const lineups = pgTable('lineups', {
  id        : uuid('id').defaultRandom().primaryKey(),
  teamId    : uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  name      : varchar('name', { length: 255 }).notNull(),
  slots     : jsonb('slots').$type<LineupSlot[]>().notNull(),
  pacePref  : smallint('pace_pref'),
  styleTags : text('style_tags').array(),
  createdAt : timestamp('created_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow(),
  updatedAt : timestamp('updated_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  teamIdx    : index('idx_lineups_team').on(table.teamId),
  teamNameUq : uniqueIndex('uq_lineups_team_name').on(table.teamId, table.name),
}))

export const chemistryLinks = pgTable('chemistry_links', {
  id       : uuid('id').defaultRandom().primaryKey(),
  playerAId: uuid('player_a_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  playerBId: uuid('player_b_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  score    : smallint('score').notNull(),
  reason   : varchar('reason', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  playerAIdx: index('idx_chemistry_player_a').on(table.playerAId),
  playerBIdx: index('idx_chemistry_player_b').on(table.playerBId),
  pairUnique: uniqueIndex('uq_chemistry_pair').on(table.playerAId, table.playerBId),
}))

export const lineupMetrics = pgTable('lineup_metrics', {
  id        : uuid('id').defaultRandom().primaryKey(),
  lineupId  : uuid('lineup_id').notNull().references(() => lineups.id, { onDelete: 'cascade' }),
  overall   : smallint('overall').notNull(),
  offense   : smallint('offense').notNull(),
  defense   : smallint('defense').notNull(),
  rebounding: smallint('rebounding').notNull(),
  pace      : smallint('pace').notNull(),
  chemistry : smallint('chemistry').notNull(),
  computedAt: timestamp('computed_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  lineupIdx: uniqueIndex('uq_lineup_metrics_lineup').on(table.lineupId),
}))

export const games = pgTable('games', {
  id          : uuid('id').defaultRandom().primaryKey(),
  homeTeamId  : uuid('home_team_id').notNull().references(() => teams.id, { onDelete: 'restrict' }),
  awayTeamId  : uuid('away_team_id').notNull().references(() => teams.id, { onDelete: 'restrict' }),
  homeLineupId: uuid('home_lineup_id').references(() => lineups.id, { onDelete: 'set null' }),
  awayLineupId: uuid('away_lineup_id').references(() => lineups.id, { onDelete: 'set null' }),
  homeScore   : integer('home_score').notNull().default(0),
  awayScore   : integer('away_score').notNull().default(0),
  status      : gameStatusEnum('status').notNull().default('scheduled'),
  simSeed     : integer('sim_seed'),
  playedAt    : timestamp('played_at', { withTimezone: false, mode: 'date' }),
  createdAt   : timestamp('created_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow(),
  updatedAt   : timestamp('updated_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  homeIdx  : index('idx_games_home_team').on(table.homeTeamId),
  awayIdx  : index('idx_games_away_team').on(table.awayTeamId),
  statusIdx: index('idx_games_status').on(table.status),
}))

export const gameEvents = pgTable('game_events', {
  id       : uuid('id').defaultRandom().primaryKey(),
  gameId   : uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  clockSec : integer('clock_sec').notNull(),
  teamId   : uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  playerId : uuid('player_id').references(() => players.id, { onDelete: 'set null' }),
  type     : varchar('type', { length: 24 }).notNull(),
  value    : smallint('value'),
  note     : text('note'),
  createdAt: timestamp('created_at', { withTimezone: false, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  gameIdx: index('idx_game_events_game').on(table.gameId),
}))

export type DrizzleUser      = typeof users.$inferSelect
export type NewDrizzleUser   = typeof users.$inferInsert
export type DrizzlePlayer    = typeof players.$inferSelect
export type NewDrizzlePlayer = typeof players.$inferInsert
export type DrizzleTeam      = typeof teams.$inferSelect
export type NewDrizzleTeam   = typeof teams.$inferInsert

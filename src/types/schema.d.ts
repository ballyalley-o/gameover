import { users, players, teams, myLeagues, myLeagueTeams, myLeaguePlayers, myLeagueRosters } from "db/schema"

export type RosterItemInput = {
  playerId    : string
  contractYrs?: number
  salary     ?: number
  isActive   ?: boolean
}

export type DrizzleUser              = typeof users.$inferSelect
export type NewDrizzleUser           = typeof users.$inferInsert
export type DrizzlePlayer            = typeof players.$inferSelect
export type NewDrizzlePlayer         = typeof players.$inferInsert
export type DrizzleTeam              = typeof teams.$inferSelect
export type NewDrizzleTeam           = typeof teams.$inferInsert
export type DrizzleMyLeague          = typeof myLeagues.$inferSelect
export type NewDrizzleMyLeague       = typeof myLeagues.$inferInsert
export type DrizzleMyLeagueTeam      = typeof myLeagueTeams.$inferSelect
export type NewDrizzleMyLeagueTeam   = typeof myLeagueTeams.$inferInsert
export type DrizzleMyLeaguePlayer    = typeof myLeaguePlayers.$inferSelect
export type NewDrizzleMyLeaguePlayer = typeof myLeaguePlayers.$inferInsert
export type DrizzleMyLeagueRoster    = typeof myLeagueRosters.$inferSelect
export type NewDrizzleMyLeagueRoster = typeof myLeagueRosters.$inferInsert

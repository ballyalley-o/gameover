import { users, players } from "db/schema"

export type RosterItemInput = {
  playerId    : string
  contractYrs?: number
  salary     ?: number
  isActive   ?: boolean
}

export type DrizzleUser      = typeof users.$inferSelect
export type NewDrizzleUser   = typeof users.$inferInsert
export type DrizzlePlayer    = typeof players.$inferSelect
export type NewDrizzlePlayer = typeof players.$inferInsert
export type DrizzleTeam      = typeof teams.$inferSelect
export type NewDrizzleTeam   = typeof teams.$inferInsert

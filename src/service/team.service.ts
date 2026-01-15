import { and, eq, inArray } from 'drizzle-orm'
import { db } from 'gameover'
import { CODE, RESPONSE } from 'constant'
import { ErrorResponse } from 'middleware'
import { players, rosters, teams } from 'db/schema'
import type { DrizzleTeam, NewDrizzleTeam } from 'types/schema'

export const teamService = {
  async list(ownerUserId?: string): Promise<DrizzleTeam[]> {
    const where = ownerUserId ? eq(teams.ownerUserId, ownerUserId) : undefined
    return db.select().from(teams).where(where)
  },

  async getById(id: string): Promise<DrizzleTeam | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id))
    return team
  },

  async create(data: NewDrizzleTeam): Promise<DrizzleTeam> {
    const [created] = await db.insert(teams).values(data).returning()
    return created
  },

  async update(id: string, data: Partial<NewDrizzleTeam>): Promise<DrizzleTeam | undefined> {
    const [updated] = await db.update(teams).set({ ...data }).where(eq(teams.id, id)).returning()
    return updated
  },

  async addToRoster(teamId: string, playerId: string, contract?: { years?: number; salary?: number }): Promise<void> {
    const [team] = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, teamId))
    if (!team) throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)

    const [player] = await db.select({ id: players.id }).from(players).where(eq(players.id, playerId))
    if (!player) throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)

    const [existing] = await db.select({ id: rosters.id }).from(rosters).where(and(eq(rosters.teamId, teamId), eq(rosters.playerId, playerId)))
    if (existing) throw new ErrorResponse(RESPONSE.ERROR.DOCUMENT_EXISTS, CODE.CONFLICT)

    await db.insert(rosters).values({
      teamId,
      playerId,
      contractYrs: contract?.years,
      salary     : contract?.salary,
    })
  },

  async removeFromRoster(teamId: string, playerId: string): Promise<void> {
    await db.delete(rosters).where(and(eq(rosters.teamId, teamId), eq(rosters.playerId, playerId)))
  },

  async roster(teamId: string) {
    const rows = await db
      .select({
        rosterId: rosters.id,
        teamId  : rosters.teamId,
        playerId: rosters.playerId,
        contractYrs: rosters.contractYrs,
        salary     : rosters.salary,
        isActive   : rosters.isActive,
        player     : players,
      })
      .from(rosters)
      .innerJoin(players, eq(rosters.playerId, players.id))
      .where(eq(rosters.teamId, teamId))

    return rows
  },

  async bulkAdd(teamId: string, playerIds: string[]): Promise<void> {
    if (!playerIds.length) return

    const validPlayers = await db.select({ id: players.id }).from(players).where(inArray(players.id, playerIds))
    if (validPlayers.length !== playerIds.length) {
      throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)
    }

    const rows = playerIds.map((pid) => ({ teamId, playerId: pid }))
    await db.insert(rosters).values(rows)
  },

  async deleteTeam(): Promise<void> {
    await db.delete(teams)
  }
}

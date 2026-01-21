import { and, eq, getTableColumns, inArray, not } from 'drizzle-orm'
import { db } from 'gameover'
import { CODE, RESPONSE } from 'constant'
import { ErrorResponse } from 'middleware'
import { players, rosters, teams } from 'db/schema'
import type { DrizzleTeam, NewDrizzleTeam, RosterItemInput } from 'types/schema'

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
    const [team] = await db.select({ id: teams.id, teamId: teams.teamId }).from(teams).where(eq(teams.id, teamId))
    if (!team) throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)

    const [player] = await db.select({ id: players.id }).from(players).where(eq(players.id, playerId))
    if (!player) throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)

    const [existing] = await db.select({ id: rosters.id }).from(rosters).where(and(eq(rosters.inTeamId, teamId), eq(rosters.playerId, playerId)))
    if (existing) throw new ErrorResponse(RESPONSE.ERROR.DOCUMENT_EXISTS, CODE.CONFLICT)

    await db.insert(rosters).values({
      inTeamId: teamId,
      exTeamId: team.teamId,
      playerId,
      contractYrs: contract?.years,
      salary     : contract?.salary,
    })
  },

  async removeFromRoster(teamId: string, playerId: string): Promise<void> {
    await db.delete(rosters).where(and(eq(rosters.inTeamId, teamId), eq(rosters.playerId, playerId)))
  },

  async roster(teamId: string) {
    const playerColumns = getTableColumns(players)
    const rows          = await db
      .select({
        rosterId   : rosters.id,
        inTeamId   : rosters.inTeamId,
        exTeamId   : rosters.exTeamId,
        playerId   : rosters.playerId,
        contractYrs: rosters.contractYrs,
        salary     : rosters.salary,
        isActive   : rosters.isActive,
        player     : playerColumns,
      })
      .from(rosters)
      .innerJoin(players, eq(rosters.playerId, players.id))
      .where(eq(rosters.exTeamId, teamId))
    return rows
  },

   async syncRoster(teamId: string, items: RosterItemInput[]): Promise<{ upserted: number, removed: number }> {
    const uniqueMap = new Map<string, RosterItemInput>()
    for (const _item of items ?? []) uniqueMap.set(_item.playerId, _item)

    const unique    = [...uniqueMap.values()]
    const playerIds = unique.map(i => i.playerId)

    const res =  await db.transaction(async (tx) => {
      let upserted = 0
      if (unique.length) {
        const upsertRows = unique.map((i) => ({
            inTeamId   : teamId,
            // exTeamId: i.
            playerId   : i.playerId,
            contractYrs: i.contractYrs,
            salary     : i.salary ?? 0,
            isActive   : i.isActive ?? true,
          }))
        const insertOrUpdated = await tx
          .insert(rosters)
          .values(upsertRows)
          .onConflictDoUpdate({
            target: [rosters.inTeamId, rosters.playerId],
            set: {
              contractYrs: rosters.contractYrs,
              salary     : rosters.salary,
              exTeamId   : rosters.exTeamId,
              isActive   : rosters.isActive,
              updatedAt  : new Date()
            }
          })
          .returning({ id: rosters.id })

          upserted = insertOrUpdated.length
      }

      const removedRows = playerIds.length ?
        await tx
          .delete(rosters)
          .where(and(eq(rosters.inTeamId, teamId), not(inArray(rosters.playerId, playerIds))))
          .returning({ id: rosters.id })
        :
        await tx
          .delete(rosters)
          .where(eq(rosters.inTeamId, teamId))
          .returning({ id: rosters.id })

        return { upserted, removed: removedRows.length }
    })

    return res
  },

  async bulkAdd(teamId: string, playerIds: string[]): Promise<{ inserted: number }> {
    if (!playerIds.length) return { inserted: 0 }

    const [team] = await db.select({ id: teams.id, teamId: teams.teamId }).from(teams).where(eq(teams.teamId, teamId))
    if (!team) throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)

    const uniqueIds   = [...new Set(playerIds)]
    const playerRows  = await db
      .select({ id: players.id, salary: players.salary })
      .from(players)
      .where(inArray(players.id, uniqueIds))

    if (playerRows.length !== uniqueIds.length) {
      throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)
    }

    const rows     = playerRows.map((player) => ({
      inTeamId: team.id,
      exTeamId: teamId,
      playerId: player.id,
      salary  : player.salary ?? 0,
    }))
    const inserted = await db
      .insert(rosters)
      .values(rows)
      .onConflictDoNothing({ target: [rosters.inTeamId, rosters.playerId] })
      .returning({ id: rosters.id })

    return { inserted: inserted.length }
  },

  async deleteTeamAll(): Promise<void> {
    await db.delete(teams)
  },

  async deleteRosterAll(): Promise<void> {
    await db.delete(rosters)
  }
}

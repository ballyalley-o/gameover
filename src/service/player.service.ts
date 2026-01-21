import { and, eq, ilike, sql } from 'drizzle-orm'
import { db } from 'gameover'
import { players } from 'db/schema'
import type { DrizzlePlayer, NewDrizzlePlayer } from 'types/schema'

export interface PlayerFilters {
  fullname ?: string
  archetype?: string
  position ?: string
}

export const playerService = {
  async list(filters: PlayerFilters = {}): Promise<DrizzlePlayer[]> {
    const conditions = []

    const fullname = sql`concat(${players.firstname}, ' ', ${players.lastname})`
    if (filters.fullname) {
      conditions.push(ilike(fullname, `%${filters.fullname}%`))
    }
    if (filters.archetype) {
      conditions.push(eq(players.archetype, filters.archetype as any))
    }
    if (filters.position) {
      conditions.push(eq(players.positions, [filters.position] as any))
    }

    const where = conditions.length ? and(...conditions) : undefined
    return db.select().from(players).where(where)
  },

  async getById(playerId: string): Promise<DrizzlePlayer | undefined> {
    const [player] = await db.select().from(players).where(eq(players.playerId, playerId))
    return player
  },

  async getPlayerStatsByIdAndSeason(id: string, season: string): Promise<DrizzlePlayer | undefined> {
    const [stats] = await db.select().from(players).where(eq(players.id, id))
    return stats
  },

  async create(data: NewDrizzlePlayer): Promise<DrizzlePlayer> {
    const [created] = await db.insert(players).values(data).returning()
    return created
  },

  async update(id: string, data: Partial<NewDrizzlePlayer>): Promise<DrizzlePlayer | undefined> {
    const [updated] = await db.update(players).set({ ...data }).where(eq(players.id, id)).returning()
    return updated
  },

  async remove(id: string): Promise<void> {
    await db.delete(players).where(eq(players.id, id))
  },
}

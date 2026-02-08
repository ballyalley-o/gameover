import { db } from 'gameover'
import { and, eq, ilike, sql } from 'drizzle-orm'
import { ErrorResponse } from 'middleware'
import { players } from 'db/schema'
import type { DrizzlePlayer, NewDrizzlePlayer } from 'types/schema'
import { CODE } from 'constant'
import { transl } from 'utility'

import { feedService } from '../../feed/feed.service'
import { statsService } from './stats.service'

export const playerService = {
  async list(filters: PlayerFilter = {}): Promise<DrizzlePlayer[]> {
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

  async create(data: NewDrizzlePlayer): Promise<DrizzlePlayer> {
    const [created] = await db.insert(players).values(data).returning()
    return created
  },

  async update(id: string, data: Partial<NewDrizzlePlayer>): Promise<DrizzlePlayer | undefined> {
    const [updated] = await db.update(players).set({ ...data }).where(eq(players.id, id)).returning()
    return updated
  },

  async syncPlayerStatsByPlayerId(playerId: string): Promise<DrizzlePlayer | undefined> {
    if (!playerId) {
      throw new ErrorResponse(transl('error.no_id'), CODE.NOT_FOUND)
    }

    const normalizedPlayerId = String(playerId)
    const currentSeason      = new Date().getFullYear()
    const stats              = await feedService.getPlayerStatsBySeasonAndPlayerId(String(currentSeason), normalizedPlayerId)
    const normalized         = statsService.normalizeStats(stats)

    if (!normalized) {
      return undefined
    }

    const ratings       = await statsService.deriveRatingsFromStats(normalized)
    const [updated]     = await db.update(players).set(ratings).where(eq(players.playerId, normalizedPlayerId)).returning()
    return updated
  },

  async syncPlayerAllStats(): Promise<{ total: number; updated: number; skipped: number; failed: number }> {
    const rows = await db.select({ playerId: players.playerId, overall: players.overall }).from(players)

    let updated = 0
    let skipped = 0
    let failed  = 0

    for (const row of rows) {
      if (!row.playerId) {
        skipped += 1
        continue
      }

      if (row.overall !== null) {
        skipped += 1
        continue
      }

      try {
        const result = await this.syncPlayerStatsByPlayerId(String(row.playerId))
        if (result) {
          updated += 1
        } else {
          skipped += 1
        }
      } catch (error) {
        failed += 1
      }
    }


    return { total: rows.length, updated, skipped, failed }
  },

  async remove(id: string): Promise<void> {
    await db.delete(players).where(eq(players.id, id))
  },
}

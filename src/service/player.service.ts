import { and, eq, ilike, sql } from 'drizzle-orm'
import { db } from 'gameover'
import { ErrorResponse } from 'middleware'
import { players } from 'db/schema'
import type { DrizzlePlayer, NewDrizzlePlayer } from 'types/schema'
import { CODE } from 'constant'
import { transl } from 'utility'

import { feedService } from './feed.service'
import { statsService } from './stats.service'

export interface PlayerFilters {
  fullname ?: string
  archetype?: string
  position ?: string
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return 0
}

const pickStat = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') {
      return toNumber(value)
    }
  }
  return 0
}

const normalizeStats = (stats: unknown): PlayerStatsType | null => {
  const row = Array.isArray(stats) ? stats[0] : stats
  if (!row || typeof row !== 'object') return null
  const record = row as Record<string, unknown>

  return {
    points                       : pickStat(record, ['Points', 'points']),
    assists                      : pickStat(record, ['Assists', 'assists']),
    rebounds                     : pickStat(record, ['Rebounds', 'rebounds']),
    offensiveRebounds            : pickStat(record, ['OffensiveRebounds', 'offensiveRebounds']),
    defensiveRebounds            : pickStat(record, ['DefensiveRebounds', 'defensiveRebounds']),
    steals                       : pickStat(record, ['Steals', 'steals']),
    blockedShots                 : pickStat(record, ['BlockedShots', 'blockedShots']),
    turnovers                    : pickStat(record, ['Turnovers', 'turnovers']),
    minutes                      : pickStat(record, ['Minutes', 'minutes']),
    trueShootingPercentage       : pickStat(record, ['TrueShootingPercentage', 'trueShootingPercentage']),
    effectiveFieldGoalsPercentage: pickStat(record, ['EffectiveFieldGoalsPercentage', 'effectiveFieldGoalsPercentage']),
    usageRatePercentage          : pickStat(record, ['UsageRatePercentage', 'usageRatePercentage']),
    playerEfficiencyRating       : pickStat(record, ['PlayerEfficiencyRating', 'playerEfficiencyRating']),
    assistsPercentage            : pickStat(record, ['AssistsPercentage', 'assistsPercentage']),
    plusMinus                    : pickStat(record, ['PlusMinus', 'plusMinus']),
    games                        : pickStat(record, ['Games', 'games']),
  }
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

  async syncPlayerStatsByPlayerId(playerId: string): Promise<DrizzlePlayer | undefined> {
    if (!playerId) {
      throw new ErrorResponse(transl('error.no_id'), CODE.NOT_FOUND)
    }

    const normalizedPlayerId = String(playerId)
    const currentSeason      = new Date().getFullYear()
    const stats              = await feedService.getPlayerStatsBySeasonAndPlayerId(String(currentSeason), normalizedPlayerId)
    const normalized         = normalizeStats(stats)

    if (!normalized) {
      return undefined
    }

    const ratings       = await statsService.deriveRatingsFromStats(normalized)
    const [updated]     = await db.update(players).set(ratings).where(eq(players.playerId, normalizedPlayerId)).returning()
    return updated
  },

  async syncPlayerAllStats(): Promise<{ total: number; updated: number; skipped: number; failed: number }> {
    const rows = await db.select({ playerId: players.playerId }).from(players)

    let updated = 0
    let skipped = 0
    let failed  = 0

    for (const row of rows) {
      if (!row.playerId) {
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
        console.log('error:', error)
        failed += 1
      }
    }


    return { total: rows.length, updated, skipped, failed }
  },

  async refreshArchetype(): Promise<{ total: number; updated: number; unchanged: number }> {
    return statsService.refreshArchetype()
  },

  async remove(id: string): Promise<void> {
    await db.delete(players).where(eq(players.id, id))
  },
}

import { and, eq, inArray } from 'drizzle-orm'
import { db } from 'gameover'
import { CODE, RESPONSE } from 'constant'
import { ErrorResponse } from 'middleware'
import { chemistryService } from 'service'
import { lineups, lineupMetrics, players, rosters, teams } from 'db/schema'
import type { Lineup, LineupMetric, LineupSlot } from 'types/game'

const defaultRating = 50

const normalizeSlots = (slots: LineupSlot[]) => {
  if (!slots.length) return []
  const fallback = 100 / slots.length
  const total = slots.reduce((sum, slot) => sum + (slot.minutesPct ?? fallback), 0)
  return slots.map((slot) => ({ ...slot, weight: (slot.minutesPct ?? fallback) / total }))
}

const roundMetrics = (metrics: Record<string, number>) => {
  const rounded: Record<string, number> = {}
  for (const [key, value] of Object.entries(metrics)) {
    rounded[key] = Math.round(value)
  }
  return rounded
}

export const lineupService = {
  async getById(id: string) {
    const [lineup] = await db.select().from(lineups).where(eq(lineups.id, id))
    return lineup as (typeof lineups.$inferSelect & { slots: LineupSlot[] }) | undefined
  },

  async create(input: Omit<Lineup, 'id'>) {
    const [team] = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, input.teamId))
    if (!team) throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)

    await lineupService.ensurePlayersOnTeam(input.teamId, input.slots)

    const [created] = await db
      .insert(lineups)
      .values({
        teamId   : input.teamId,
        name     : input.name,
        slots    : input.slots,
        pacePref : input.pacePref,
        styleTags: input.styleTags,
      })
      .returning()

    return created
  },

  async update(id: string, data: Partial<Omit<Lineup, 'id' | 'teamId'>>) {
    const lineup = await this.getById(id)
    if (!lineup) throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)

    if (data.slots) {
      await this.ensurePlayersOnTeam(lineup.teamId, data.slots)
    }

    const [updated] = await db
      .update(lineups)
      .set({ ...data })
      .where(eq(lineups.id, id))
      .returning()

    return updated
  },

  async ensurePlayersOnTeam(teamId: string, slots: LineupSlot[]): Promise<void> {
    const playerIds = slots.map((s) => s.playerId)
    if (!playerIds.length) return

    const rostered = await db
      .select({ playerId: rosters.playerId })
      .from(rosters)
      .where(and(eq(rosters.inTeamId, teamId), inArray(rosters.playerId, playerIds)))

    const rosteredIds = new Set(rostered.map((r) => r.playerId))
    const missing = playerIds.filter((id) => !rosteredIds.has(id))
    if (missing.length) {
      throw new ErrorResponse(`${RESPONSE.ERROR.FAILED_FIND}: ${missing.join(',')}`, CODE.NOT_FOUND)
    }
  },

  async computeMetric(lineupId: string): Promise<LineupMetric> {
    const lineup = await this.getById(lineupId)
    if (!lineup) throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)

    const slots           = normalizeSlots(lineup.slots)
    const playerIds       = slots.map((s) => s.playerId)

    const selectedPlayers = await db.select().from(players).where(inArray(players.id, playerIds))
    const playerMap       = new Map(selectedPlayers.map((p) => [p.id, p]))

    const metricKeys: Array<keyof typeof players> = ['overall', 'offense', 'defense', 'rebounding', 'pace'] as any

    const weighted = metricKeys.reduce((acc, key) => {
      const value = slots.reduce((sum, slot) => {
        const player = playerMap.get(slot.playerId) as any
        const rating = player?.[key] ?? defaultRating
        return sum + rating * slot.weight
      }, 0)
      acc[key as string] = value
      return acc
    }, {} as Record<string, number>)

    const chemistryScore = await chemistryService.computeLineupChemistry(playerIds)
    const metrics        = roundMetrics({
      overall   : weighted['overall'] ?? defaultRating,
      offense   : weighted['offense'] ?? defaultRating,
      defense   : weighted['defense'] ?? defaultRating,
      rebounding: weighted['rebounding'] ?? defaultRating,
      pace      : weighted['pace'] ?? defaultRating,
      chemistry : chemistryScore,
    })

    const [stored] = await db
      .insert(lineupMetrics)
      .values({
        lineupId  : lineup.id,
        overall   : metrics.overall,
        offense   : metrics.offense,
        defense   : metrics.defense,
        rebounding: metrics.rebounding,
        pace      : metrics.pace,
        chemistry : metrics.chemistry,
        computedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: lineupMetrics.lineupId,
        set   : {
          overall   : metrics.overall,
          offense   : metrics.offense,
          defense   : metrics.defense,
          rebounding: metrics.rebounding,
          pace      : metrics.pace,
          chemistry : metrics.chemistry,
          computedAt: new Date(),
        },
      })
      .returning()

    return {
      id        : stored.id,
      lineupId  : stored.lineupId,
      overall   : stored.overall,
      offense   : stored.offense,
      defense   : stored.defense,
      rebounding: stored.rebounding,
      pace      : stored.pace,
      chemistry : stored.chemistry,
      computedAt: stored.computedAt,
    }
  },

  async getOrComputeMetric(lineupId: string): Promise<LineupMetric> {
    const [existing] = await db.select().from(lineupMetrics).where(eq(lineupMetrics.lineupId, lineupId))
    if (existing) {
      return {
        id        : existing.id,
        lineupId  : existing.lineupId,
        overall   : existing.overall,
        offense   : existing.offense,
        defense   : existing.defense,
        rebounding: existing.rebounding,
        pace      : existing.pace,
        chemistry : existing.chemistry,
        computedAt: existing.computedAt,
      }
    }

    return this.computeMetric(lineupId)
  },
}

import { db } from "config"
import { eq } from "drizzle-orm"
import { players } from "db/schema"

const _clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n))
const _scale = (value: number, min: number, max: number) => _clamp(((value - min) / (max - min)) * 100)
const _toNumber = (value: number | null | undefined) => (typeof value === 'number' ? value : 0)

export const statsService = {
    async deriveRatingsFromStats(stats: PlayerStatsType) {
        const points     = _scale(stats.points, 0, 30)
        const assists    = _scale(stats.assists, 0, 10)
        const rebounds   = _scale(stats.rebounds, 0, 15)
        const oreb       = _scale(stats.offensiveRebounds, 0, 5)
        const dreb       = _scale(stats.defensiveRebounds, 0, 10)
        const steals     = _scale(stats.steals, 0, 3)
        const blocks     = _scale(stats.blockedShots, 0, 3)
        const minutes    = _scale(stats.minutes, 10, 38)
        const ts         = _scale(stats.trueShootingPercentage, 45, 70)
        const efg        = _scale(stats.effectiveFieldGoalsPercentage, 40, 70)
        const usage      = _scale(stats.usageRatePercentage, 10, 35)
        const per        = _scale(stats.playerEfficiencyRating, 5, 30)
        const astPct     = _scale(stats.assistsPercentage, 5, 40)
        const plusMinus  = _scale(stats.plusMinus, -10, 10)
        const tovPenalty = _scale(stats.turnovers, 0, 5)

        const offense    = _clamp(points * 0.45 + ts * 0.2 + efg * 0.15 + usage * 0.2)
        const defense    = _clamp(steals * 0.35 + blocks * 0.35 + dreb * 0.2 + (100 - tovPenalty) * 0.1)
        const rebounding = _clamp(rebounds * 0.6 + oreb * 0.2 + dreb * 0.2)
        const passing    = _clamp(assists * 0.55 + astPct * 0.45)
        const iq         = _clamp(per * 0.7 + (100 - tovPenalty) * 0.2 + plusMinus * 0.1)
        const pace       = _clamp(minutes * 0.6 + usage * 0.4)
        const clutch     = _clamp(plusMinus * 0.6 + ts * 0.4)
        const stamina    = _clamp(minutes * 0.8 + (stats.games ? _scale(stats.games, 0, 82) : 0) * 0.2)

        const overall = _clamp(
            offense * 0.2 +
            defense * 0.2 +
            rebounding * 0.2 +
            passing * 0.15 +
            iq * 0.15 +
            pace * 0.1 +
            clutch * 0.05
        )

        const ratings = {
            overall, offense, defense, rebounding, passing, iq, pace, clutch, stamina
        }

        return ratings
    },

    classifyArchetype(player: PlayerRatingType): ArchetypeType {
      const overall    = _toNumber(player.overall)
      const offense    = _toNumber(player.offense)
      const defense    = _toNumber(player.defense)
      const rebounding = _toNumber(player.rebounding)
      const passing    = _toNumber(player.passing)
      const iq         = _toNumber(player.iq)
      const pace       = _toNumber(player.pace)
      const clutch     = _toNumber(player.clutch)
      const stamina    = _toNumber(player.stamina)

      const hasStats = [overall, offense, defense, rebounding, passing, iq, pace, clutch, stamina].some((value) => value > 0)
      if (!hasStats) return 'unknown'

      const positions = player.positions ?? []
      const isBig     = positions.includes('C') || positions.includes('PF')

      const scores: Record<ArchetypeType, number> = {
        playmaker    : passing * 1.2 + iq * 1.1 + pace * 0.8 + offense * 0.5,
        sharpshooter : offense * 1.1 + clutch * 1.1 + iq * 0.6 + pace * 0.3,
        slasher      : offense * 1.0 + pace * 1.2 + stamina * 0.8 + clutch * 0.4,
        two_way      : offense * 0.9 + defense * 0.9 + rebounding * 0.3,
        rim_protector: defense * 1.2 + rebounding * 1.0 + (isBig ? 10 : 0),
        stretch_big  : offense * 0.9 + rebounding * 0.6 + pace * 0.5 + (isBig ? 10 : 0),
        rebounder    : rebounding * 1.3 + defense * 0.6 + (isBig ? 5 : 0),
        utility      : overall * 1.0 + iq * 0.5 + passing * 0.2 + defense * 0.2,
        unknown      : 0,
      }

      let best: ArchetypeType = 'utility'
      let bestScore       = -1
      for (const [key, value] of Object.entries(scores)) {
        if (value > bestScore && key !== 'unknown') {
          bestScore = value
          best = key as ArchetypeType
        }
      }

      return best
    },

    async refreshArchetype(): Promise<{ total: number; updated: number; unchanged: number }> {
        const rows = await db
        .select({
            id        : players.id,
            positions : players.positions,
            archetype : players.archetype,
            overall   : players.overall,
            offense   : players.offense,
            defense   : players.defense,
            rebounding: players.rebounding,
            passing   : players.passing,
            iq        : players.iq,
            pace      : players.pace,
            clutch    : players.clutch,
            stamina   : players.stamina,
        })
        .from(players)

        const updates = rows
        .map((row) => ({ id: row.id, archetype: statsService.classifyArchetype(row), current: row.archetype }))
        .filter((row) => row.archetype !== row.current)

        if (updates.length) {
        await db.transaction(async (tx) => {
            for (const update of updates) {
            await tx.update(players).set({ archetype: update.archetype }).where(eq(players.id, update.id))
            }
        })
        }

        return {
            total    : rows.length,
            updated  : updates.length,
            unchanged: rows.length - updates.length,
        }
    }
}
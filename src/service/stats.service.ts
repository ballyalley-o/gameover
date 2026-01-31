import { db } from "config"
import { and, eq } from "drizzle-orm"
import { players } from "db/schema"
import { stringToNumber } from "utility"

const _clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n))
const _scale = (value: number, min: number, max: number) => _clamp(((value - min) / (max - min)) * 100)

const _pickStat = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') {
      return stringToNumber(value)
    }
  }
  return 0
}

export const statsService = {
    normalizeStats(stats: unknown): PlayerStatsType | null {
        const row = Array.isArray(stats) ? stats[0] : stats
        if (!row || typeof row !== 'object') return null
        const record = row as Record<string, unknown>

        return {
            points                       : _pickStat(record, ['Points', 'points']),
            assists                      : _pickStat(record, ['Assists', 'assists']),
            rebounds                     : _pickStat(record, ['Rebounds', 'rebounds']),
            offensiveRebounds            : _pickStat(record, ['OffensiveRebounds', 'offensiveRebounds']),
            defensiveRebounds            : _pickStat(record, ['DefensiveRebounds', 'defensiveRebounds']),
            steals                       : _pickStat(record, ['Steals', 'steals']),
            blockedShots                 : _pickStat(record, ['BlockedShots', 'blockedShots']),
            turnovers                    : _pickStat(record, ['Turnovers', 'turnovers']),
            minutes                      : _pickStat(record, ['Minutes', 'minutes']),
            trueShootingPercentage       : _pickStat(record, ['TrueShootingPercentage', 'trueShootingPercentage']),
            effectiveFieldGoalsPercentage: _pickStat(record, ['EffectiveFieldGoalsPercentage', 'effectiveFieldGoalsPercentage']),
            usageRatePercentage          : _pickStat(record, ['UsageRatePercentage', 'usageRatePercentage']),
            playerEfficiencyRating       : _pickStat(record, ['PlayerEfficiencyRating', 'playerEfficiencyRating']),
            assistsPercentage            : _pickStat(record, ['AssistsPercentage', 'assistsPercentage']),
            plusMinus                    : _pickStat(record, ['PlusMinus', 'plusMinus']),
            games                        : _pickStat(record, ['Games', 'games']),
        }
    },

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
            overall   : Math.round(overall),
            offense   : Math.round(offense),
            defense   : Math.round(defense),
            rebounding: Math.round(rebounding),
            passing   : Math.round(passing),
            iq        : Math.round(iq),
            pace      : Math.round(pace),
            clutch    : Math.round(clutch),
            stamina   : Math.round(stamina),
        }

        return ratings
    },

    computeArchetypeFromRating(player: PlayerRatingType): ArchetypeType {
      const overall    = stringToNumber(player.overall)
      const offense    = stringToNumber(player.offense)
      const defense    = stringToNumber(player.defense)
      const rebounding = stringToNumber(player.rebounding)
      const passing    = stringToNumber(player.passing)
      const iq         = stringToNumber(player.iq)
      const pace       = stringToNumber(player.pace)
      const clutch     = stringToNumber(player.clutch)
      const stamina    = stringToNumber(player.stamina)

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
      let bestScore           = -1
      for (const [key, value] of Object.entries(scores)) {
        if (value > bestScore && key !== 'unknown') {
          bestScore = value
          best      = key as ArchetypeType
        }
      }

      return best
    },

    async classifyArchtype(): Promise<{ total: number; updated: number; unchanged: number }> {
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
            .map((row) => ({ id: row.id, archetype: statsService.computeArchetypeFromRating(row), current: row.archetype }))
            .filter((row) => row.current === 'unknown')
            .filter((row) => row.archetype !== row.current)

        if (updates.length) {
        await db.transaction(async (tx) => {
            for (const update of updates) {
                await tx.update(players).set({ archetype: update.archetype }).where(and(eq(players.id, update.id), eq(players.archetype, 'unknown')))
            }
        })
        }

        return {
            total    : rows.length,
            updated  : updates.length,
            unchanged: rows.length - updates.length,
        }
    },

    async classifyArchetypeByPlayerId(playerId: string): Promise<{ total: number; updated: number; unchanged: number }> {
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
        .from(players).where(eq(players.playerId, String(playerId)))

        const updates = rows
            .map((row) => ({ id: row.id, archetype: statsService.computeArchetypeFromRating(row), current: row.archetype }))
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

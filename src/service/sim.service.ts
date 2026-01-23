import { eq } from 'drizzle-orm'
import { db } from 'gameover'
import { CODE, RESPONSE } from 'constant'
import { ErrorResponse } from 'middleware'
import { games, lineups } from 'db/schema'
import type { Game, LineupMetric, SimulationInput, SimulationResult } from 'types/game'
import { lineupService } from './lineup.service'

const mulberry32 = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const projectScore = (metrics: LineupMetric, opponent: LineupMetric, rng: () => number, isHome: boolean) => {
  const offense = metrics.offense ?? 50
  const defense = metrics.defense ?? 50
  const chemistry = metrics.chemistry ?? 0
  const pace = metrics.pace ?? 50
  const oppDefense = opponent.defense ?? 50

  const base = 90 + (offense - oppDefense) * 0.4 + (chemistry - 50) * 0.2 + (pace - 50) * 0.1
  const noise = rng() * 12
  const homeEdge = isHome ? 2 : 0
  return Math.max(60, Math.round(base + noise + homeEdge))
}

export const simService = {
  async simulate(input: SimulationInput): Promise<SimulationResult> {
    const seed = input.seed ?? Date.now()
    const rng  = mulberry32(seed)

    const homeLineup = await lineupService.getById(input.homeLineupId)
    const awayLineup = await lineupService.getById(input.awayLineupId)

    if (!homeLineup || !awayLineup) {
      throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)
    }

    const [homeMetrics, awayMetrics] = await Promise.all([
      lineupService.getOrComputeMetric(input.homeLineupId),
      lineupService.getOrComputeMetric(input.awayLineupId),
    ])

    const homeScore = projectScore(homeMetrics, awayMetrics, rng, true)
    const awayScore = projectScore(awayMetrics, homeMetrics, rng, false)

    const [gameRow] = await db
      .insert(games)
      .values({
        homeTeamId  : homeLineup.teamId,
        awayTeamId  : awayLineup.teamId,
        homeLineupId: homeLineup.id,
        awayLineupId: awayLineup.id,
        homeScore,
        awayScore,
        status   : 'simulated',
        simSeed  : seed,
        playedAt : new Date(),
      })
      .returning()

    const game: Game = {
      id          : gameRow.id,
      homeTeamId  : gameRow.homeTeamId,
      awayTeamId  : gameRow.awayTeamId,
      homeLineupId: gameRow.homeLineupId || undefined,
      awayLineupId: gameRow.awayLineupId || undefined,
      homeScore   : gameRow.homeScore,
      awayScore   : gameRow.awayScore,
      status      : gameRow.status,
      simSeed     : gameRow.simSeed || undefined,
      playedAt    : gameRow.playedAt || undefined,
    }

    return {
      game,
      breakdown: {
        home: homeMetrics,
        away: awayMetrics,
      },
      events: [],
    }
  },
}

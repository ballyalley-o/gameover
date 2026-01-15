import { db } from 'gameover'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { CODE, RESPONSE, TRADE_STATUS } from 'constant'
import { ErrorResponse } from 'middleware'
import { players, rosters, teams, trades } from 'db/schema'

const MATCH_THRESHOLD = 6_533_000
const HIGH_MULT       = 1.25
const LOW_MULT        = 1.75
const BUFFER          = 100_000

export interface TradePayload {
  fromTeamId    : string
  toTeamId      : string
  outgoingIds   : string[]
  incomingIds   : string[]
}

export interface TradePreview {
  valid  : boolean
  reason?: string
  from   : { outgoing: number; incoming: number; allowedIncoming: number; postSalary: number; cap: number }
  to     : { outgoing: number; incoming: number; allowedIncoming: number; postSalary: number; cap: number }
}

export interface TradeSuggestionPayload {
  fromTeamId     : string
  toTeamId       : string
  maxSuggestions?: number
}

export interface TradeSuggestion {
  outgoing: Array<{ playerId: string; firstname: string | null; lastname: string | null; salary: number }>
  incoming: Array<{ playerId: string; firstname: string | null; lastname: string | null; salary: number }>
  preview : TradePreview
}

const allowedIncoming = (outgoing: number) => {
  if (outgoing <= 0) return 0
  return outgoing < MATCH_THRESHOLD
    ? outgoing * LOW_MULT + BUFFER
    : outgoing * HIGH_MULT + BUFFER
}

const sumSalary = (rows: Array<{ salary: number | null }>) => rows.reduce((sum, row) => sum + (row.salary || 0), 0)

const getTeamSalary = async (teamId: string) => {
  const [res] = await db.select({ total: sql<number>`coalesce(sum(${rosters.salary}), 0)` }).from(rosters).where(eq(rosters.teamId, teamId))
  return res?.total || 0
}

const fetchRosterEntries = async (teamId: string, playerIds: string[]) => {
  if (!playerIds.length) return []
  return db.select().from(rosters).where(and(eq(rosters.teamId, teamId), inArray(rosters.playerId, playerIds)))
}

const fetchRosterCandidates = async (teamId: string) => {
  const rows = await db
    .select({
      playerId : rosters.playerId,
      salary   : rosters.salary,
      firstname: players.firstname,
      lastname : players.lastname,
    })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.teamId, teamId))

  return rows.map((row) => ({ ...row, salary: row.salary || 0 }))
}

const buildPreview = ({
  fromTeam,
  toTeam,
  fromCurrentSalary,
  toCurrentSalary,
  outgoingFrom,
  incomingToFrom,
  outgoingTo,
  incomingToTo,
}: {
  fromTeam: typeof teams.$inferSelect
  toTeam: typeof teams.$inferSelect
  fromCurrentSalary: number
  toCurrentSalary: number
  outgoingFrom: number
  incomingToFrom: number
  outgoingTo: number
  incomingToTo: number
}): TradePreview => {
  const fromAllowed = allowedIncoming(outgoingFrom)
  const toAllowed   = allowedIncoming(outgoingTo)

  const fromPostSalary = fromCurrentSalary - outgoingFrom + incomingToFrom
  const toPostSalary   = toCurrentSalary - outgoingTo + incomingToTo

  let valid  = true
  let reason = ''

  if (incomingToFrom > fromAllowed) {
    valid = false
    reason = 'Incoming salary exceeds allowed matching for fromTeam'
  } else if (incomingToTo > toAllowed) {
    valid = false
    reason = 'Incoming salary exceeds allowed matching for toTeam'
  } else if (fromTeam.hardCapActive && fromPostSalary > fromTeam.salaryCap) {
    valid = false
    reason = 'From team exceeds hard cap'
  } else if (toTeam.hardCapActive && toPostSalary > toTeam.salaryCap) {
    valid = false
    reason = 'To team exceeds hard cap'
  }

  return {
    valid,
    reason: reason || undefined,
    from  : { outgoing: outgoingFrom, incoming: incomingToFrom, allowedIncoming: fromAllowed, postSalary: fromPostSalary, cap: fromTeam.salaryCap },
    to    : { outgoing: outgoingTo, incoming: incomingToTo, allowedIncoming: toAllowed, postSalary: toPostSalary, cap: toTeam.salaryCap },
  }
}

export const tradeService = {
  async preview(payload: TradePayload): Promise<TradePreview> {
    const { fromTeamId, toTeamId, outgoingIds, incomingIds } = payload

    const [fromTeam] = await db.select().from(teams).where(eq(teams.id, fromTeamId))
    const [toTeam]   = await db.select().from(teams).where(eq(teams.id, toTeamId))
    if (!fromTeam || !toTeam) throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)

    const [fromRoster, toRoster] = await Promise.all([
      fetchRosterEntries(fromTeamId, outgoingIds),
      fetchRosterEntries(toTeamId, incomingIds),
    ])

    if (fromRoster.length !== outgoingIds.length || toRoster.length !== incomingIds.length) {
      throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)
    }

    const outgoingFrom   = sumSalary(fromRoster)
    const incomingToFrom = sumSalary(toRoster)

    const outgoingTo   = sumSalary(toRoster)
    const incomingToTo = sumSalary(fromRoster)

    const fromCurrentSalary = await getTeamSalary(fromTeamId)
    const toCurrentSalary   = await getTeamSalary(toTeamId)

    return buildPreview({
      fromTeam,
      toTeam,
      fromCurrentSalary,
      toCurrentSalary,
      outgoingFrom,
      incomingToFrom,
      outgoingTo,
      incomingToTo,
    })
  },

  async suggest(payload: TradeSuggestionPayload): Promise<TradeSuggestion[]> {
    const { fromTeamId, toTeamId, maxSuggestions = 10 } = payload

    const [fromTeam] = await db.select().from(teams).where(eq(teams.id, fromTeamId))
    const [toTeam]   = await db.select().from(teams).where(eq(teams.id, toTeamId))
    if (!fromTeam || !toTeam) throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)

    const [fromRoster, toRoster] = await Promise.all([ fetchRosterCandidates(fromTeamId), fetchRosterCandidates(toTeamId) ])

    const fromCurrentSalary = sumSalary(fromRoster)
    const toCurrentSalary   = sumSalary(toRoster)

    const suggestions: TradeSuggestion[] = []

    for (const outgoing of fromRoster) {
      for (const incoming of toRoster) {
        const preview = buildPreview({
          fromTeam,
          toTeam,
          fromCurrentSalary,
          toCurrentSalary,
          outgoingFrom  : outgoing.salary,
          incomingToFrom: incoming.salary,
          outgoingTo    : incoming.salary,
          incomingToTo  : outgoing.salary,
        })

        if (!preview.valid) continue

        suggestions.push({
          outgoing: [outgoing],
          incoming: [incoming],
          preview,
        })

        if (suggestions.length >= maxSuggestions) {
          return suggestions
        }
      }
    }

    return suggestions
  },

  async execute(payload: TradePayload) {
    const preview = await this.preview(payload)
    if (!preview.valid) {
      throw new ErrorResponse(preview.reason || RESPONSE.ERROR.FAILED_UPDATE, CODE.BAD_REQUEST)
    }

    const { fromTeamId, toTeamId, outgoingIds, incomingIds } = payload

    return db.transaction(async (tx) => {
      await tx.update(rosters).set({ teamId: toTeamId }).where(and(eq(rosters.teamId, fromTeamId), inArray(rosters.playerId, outgoingIds)))
      await tx.update(rosters).set({ teamId: fromTeamId }).where(and(eq(rosters.teamId, toTeamId), inArray(rosters.playerId, incomingIds)))

      const [record] = await tx.insert(trades).values({
        fromTeamId,
        toTeamId,
        outgoingIds,
        incomingIds,
        outgoingSalary: preview.from.outgoing,
        incomingSalary: preview.from.incoming,
        status        : TRADE_STATUS.PROCESSED,
      }).returning()

      return { trade: record, preview }
    })
  },
}

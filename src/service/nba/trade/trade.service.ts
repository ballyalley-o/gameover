import { db } from 'gameover'
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm'
import { CODE, RESPONSE, TRADE_STATUS } from 'constant'
import { ErrorResponse } from 'middleware'
import { players, rosters, teams, trades } from 'db/schema'


const MATCH_THRESHOLD   = 6_533_000
const HIGH_MULT         = 1.25
const LOW_MULT          = 1.75
const BUFFER            = 100_000
const CURRENT_SEASON = () => new Date().getFullYear()

const toNumber = (value: number | null | undefined) => (typeof value === 'number' ? value : 0)

const getContractSalary = (row: { salary: number | null; salaryByYear?: number[] | null; contractStartYear?: number | null }, seasonYear: number) => {
  const baseSalary   = toNumber(row.salary)
  const salaryByYear = row.salaryByYear ?? null
  if (salaryByYear && salaryByYear.length) {
    const startYear = row.contractStartYear ?? seasonYear
    const index     = seasonYear - startYear
    if (index >= 0 && index < salaryByYear.length) {
      return toNumber(salaryByYear[index])
    }
  }
  return baseSalary
}

const allowedIncoming = (outgoing: number) => {
  if (outgoing <= 0) return 0
  return outgoing < MATCH_THRESHOLD
    ? outgoing * LOW_MULT + BUFFER
    : outgoing * HIGH_MULT + BUFFER
}

const sumSalary = (rows: Array<{ salary: number | null; salaryByYear?: number[] | null; contractStartYear?: number | null }>, seasonYear: number) =>
  rows.reduce((sum, row) => sum + getContractSalary(row, seasonYear), 0)

const getTeamSalary = async (teamId: string) => {
  const seasonYear = CURRENT_SEASON()
  const rows = await db
    .select({
      salary           : rosters.salary,
      salaryByYear     : rosters.salaryByYear,
      contractStartYear: rosters.contractStartYear,
    })
    .from(rosters)
    .where(eq(rosters.inTeamId, teamId))
  return sumSalary(rows, seasonYear)
}

const fetchRosterEntries = async (teamId: string, playerIds: string[]) => {
  if (!playerIds.length) return []
  return db
    .select()
    .from(rosters)
    .where(and(eq(rosters.inTeamId, teamId), inArray(rosters.playerId, playerIds)))
}

const fetchRosterAllCandidate = async (teamId: string) => {
  const seasonYear = CURRENT_SEASON()
  const rows       = await db
    .select({
      playerId         : rosters.playerId,
      salary           : rosters.salary,
      salaryByYear     : rosters.salaryByYear,
      contractStartYear: rosters.contractStartYear,
      firstname        : players.firstname,
      lastname         : players.lastname,
    })
    .from(rosters)
    .innerJoin(players, eq(rosters.playerId, players.id))
    .where(eq(rosters.inTeamId, teamId))

  return rows.map((row) => ({
    playerId : row.playerId,
    firstname: row.firstname,
    lastname : row.lastname,
    salary   : getContractSalary(row, seasonYear),
  }))
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
  fromTeam         : typeof teams.$inferSelect
  toTeam           : typeof teams.$inferSelect
  fromCurrentSalary: number
  toCurrentSalary  : number
  outgoingFrom     : number
  incomingToFrom   : number
  outgoingTo       : number
  incomingToTo     : number
})               : TradePreview => {
  const fromBaseAllowed     = allowedIncoming(outgoingFrom)
  const toBaseAllowed       = allowedIncoming(outgoingTo)
  const fromExceptionBudget = fromTeam.exceptionBudget ?? 0
  const toExceptionBudget   = toTeam.exceptionBudget ?? 0
  const fromExceptionUsed   = Math.max(0, Math.ceil(incomingToFrom - fromBaseAllowed))
  const toExceptionUsed     = Math.max(0, Math.ceil(incomingToTo - toBaseAllowed))
  const fromAllowed         = fromBaseAllowed + fromExceptionBudget
  const toAllowed           = toBaseAllowed + toExceptionBudget

  const fromPostSalary = fromCurrentSalary - outgoingFrom + incomingToFrom
  const toPostSalary   = toCurrentSalary - outgoingTo + incomingToTo

  let valid  = true
  let reason = ''

  if (incomingToFrom > fromAllowed) {
    valid = false
    reason = 'Incoming salary exceeds allowed matching for fromTeam'
  } else if (fromExceptionUsed > fromExceptionBudget) {
    valid = false
    reason = 'From team trade exception is insufficient'
  } else if (incomingToTo > toAllowed) {
    valid = false
    reason = 'Incoming salary exceeds allowed matching for toTeam'
  } else if (toExceptionUsed > toExceptionBudget) {
    valid = false
    reason = 'To team trade exception is insufficient'
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
    from  : { outgoing: outgoingFrom, incoming: incomingToFrom, allowedIncoming: fromAllowed, postSalary: fromPostSalary, cap: fromTeam.salaryCap, exceptionBudget: fromExceptionBudget, exceptionUsed: fromExceptionUsed },
    to    : { outgoing: outgoingTo, incoming: incomingToTo, allowedIncoming: toAllowed, postSalary: toPostSalary, cap: toTeam.salaryCap, exceptionBudget: toExceptionBudget, exceptionUsed: toExceptionUsed },
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

    const seasonYear     = CURRENT_SEASON()
    const outgoingFrom   = sumSalary(fromRoster, seasonYear)
    const incomingToFrom = sumSalary(toRoster, seasonYear)

    const outgoingTo   = sumSalary(toRoster, seasonYear)
    const incomingToTo = sumSalary(fromRoster, seasonYear)

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

    const [fromRoster, toRoster] = await Promise.all([ fetchRosterAllCandidate(fromTeamId), fetchRosterAllCandidate(toTeamId) ])

    const seasonYear        = CURRENT_SEASON()
    const fromCurrentSalary = sumSalary(fromRoster, seasonYear)
    const toCurrentSalary   = sumSalary(toRoster, seasonYear)

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
    const teamRows = await db
      .select({ id: teams.id, teamId: teams.teamId })
      .from(teams)
      .where(or(eq(teams.id, fromTeamId), eq(teams.id, toTeamId)))

    const fromTeam = teamRows.find((team) => team.id === fromTeamId)
    const toTeam   = teamRows.find((team) => team.id === toTeamId)
    if (!fromTeam || !toTeam) throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)

    return db.transaction(async (tx) => {
      await tx
        .update(rosters)
        .set({ inTeamId: toTeamId, exTeamId: toTeam.teamId })
        .where(and(eq(rosters.inTeamId, fromTeamId), inArray(rosters.playerId, outgoingIds)))
      await tx
        .update(rosters)
        .set({ inTeamId: fromTeamId, exTeamId: fromTeam.teamId })
        .where(and(eq(rosters.inTeamId, toTeamId), inArray(rosters.playerId, incomingIds)))

      if (preview.from.exceptionUsed > 0) {
        await tx
          .update(teams)
          .set({ exceptionBudget: sql<number>`${teams.exceptionBudget} - ${preview.from.exceptionUsed}` })
          .where(eq(teams.id, fromTeamId))
      }

      if (preview.to.exceptionUsed > 0) {
        await tx
          .update(teams)
          .set({ exceptionBudget: sql<number>`${teams.exceptionBudget} - ${preview.to.exceptionUsed}` })
          .where(eq(teams.id, toTeamId))
      }

      const [record] = await tx.insert(trades).values({
        fromTeamId,
        toTeamId,
        outgoingIds,
        incomingIds,
        outgoingSalary: preview.from.outgoing,
        incomingSalary: preview.from.incoming,
        fromExceptionUsed: preview.from.exceptionUsed,
        toExceptionUsed  : preview.to.exceptionUsed,
        status        : TRADE_STATUS.PROCESSED,
      }).returning()

      return { trade: record, preview }
    })
  },

  async history(filters: TradeHistoryFilterTypes = {}): Promise<TradeHistoryItemType[]> {
    const { teamId, limit = 50, offset = 0 } = filters
    const where = teamId ? or(eq(trades.fromTeamId, teamId), eq(trades.toTeamId, teamId)) : undefined

    return db.select().from(trades).where(where).orderBy(desc(trades.createdAt)).limit(limit).offset(offset)
  },

  async resetHistory(teamId?: string): Promise<{ deleted: number; reverted: number }> {
    const where     = teamId ? or(eq(trades.fromTeamId, teamId), eq(trades.toTeamId, teamId)) : undefined
    const tradeRows = await db
      .select({
        id               : trades.id,
        fromTeamId       : trades.fromTeamId,
        toTeamId         : trades.toTeamId,
        outgoingIds      : trades.outgoingIds,
        incomingIds      : trades.incomingIds,
        fromExceptionUsed: trades.fromExceptionUsed,
        toExceptionUsed  : trades.toExceptionUsed,
      })
      .from(trades)
      .where(where)
      .orderBy(desc(trades.createdAt))

    if (!tradeRows.length) {
      return { deleted: 0, reverted: 0 }
    }

    const teamIds   = [...new Set(tradeRows.flatMap((row) => [row.fromTeamId, row.toTeamId]))]
    const teamRows  = await db.select({ id: teams.id, teamId: teams.teamId }).from(teams).where(inArray(teams.id, teamIds))
    const teamIdMap = new Map(teamRows.map((row) => [row.id, row.teamId]))

    const result = await db.transaction(async (tx) => {
      let reverted = 0
      const exceptionRefunds = new Map<string, number>()
      for (const trade of tradeRows) {
        const fromExternal = teamIdMap.get(trade.fromTeamId)
        const toExternal   = teamIdMap.get(trade.toTeamId)

        if (trade.outgoingIds?.length) {
          const updated = await tx
            .update(rosters)
            .set({ inTeamId: trade.fromTeamId, exTeamId: fromExternal })
            .where(and(eq(rosters.inTeamId, trade.toTeamId), inArray(rosters.playerId, trade.outgoingIds)))
            .returning({ id: rosters.id })
          reverted += updated.length
        }

        if (trade.fromExceptionUsed > 0) {
          exceptionRefunds.set(trade.fromTeamId, (exceptionRefunds.get(trade.fromTeamId) ?? 0) + trade.fromExceptionUsed)
        }
        if (trade.toExceptionUsed > 0) {
          exceptionRefunds.set(trade.toTeamId, (exceptionRefunds.get(trade.toTeamId) ?? 0) + trade.toExceptionUsed)
        }

        if (trade.incomingIds?.length) {
          const updated = await tx
            .update(rosters)
            .set({ inTeamId: trade.toTeamId, exTeamId: toExternal })
            .where(and(eq(rosters.inTeamId, trade.fromTeamId), inArray(rosters.playerId, trade.incomingIds)))
            .returning({ id: rosters.id })
          reverted += updated.length
        }
      }

      for (const [teamId, refund] of exceptionRefunds.entries()) {
        if (refund <= 0) continue
        await tx
          .update(teams)
          .set({ exceptionBudget: sql<number>`${teams.exceptionBudget} + ${refund}` })
          .where(eq(teams.id, teamId))
      }

      const deleted = await tx.delete(trades).where(where).returning({ id: trades.id })
      return { reverted, deleted: deleted.length }
    })

    return result
  },
}

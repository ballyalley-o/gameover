import { Request, Response, NextFunction } from 'express'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { AnyPgTable } from 'drizzle-orm/pg-core'
import { GLOBAL, db } from 'gameover'
import { Resp } from 'constant'

type AdvanceResultOptions = {
  select      ?: Record<string, any>
  includeTotal?: boolean
}

const defaultSort = (table: AnyPgTable) => {
  const createdAt = (table as any).createdAt
  return createdAt ? [desc(createdAt)] : []
}

export const advanceResult = (table: AnyPgTable, options: AdvanceResultOptions = {}) => async (req: Request, res: Response, next: NextFunction) => {
  const { sort, page = GLOBAL.PAGINATION.DEFAULT_PAGE, limit = GLOBAL.PAGINATION.LIMIT, includeTotal, ...filters } = req.query

  const offset = (Number(page) - 1) * Number(limit)
  const take   = Number(limit)

  const includeTotalParam  = includeTotal === 'true' || includeTotal === '1'
  const shouldIncludeTotal = options.includeTotal ?? (includeTotal === undefined ? true : includeTotalParam)

  const whereClauses = Object.entries(filters)
    .filter(([key]) => Object.hasOwn((table as any).columns, key))
    .map(([key, value]) => eq((table as any)[key], value as string))

  const where   = whereClauses.length ? and(...whereClauses) : undefined
  const orderBy =
    sort
      ? (sort as string)
        .split(',')
        .map((field) => field.trim())
        .filter(Boolean)
        .map((field) => field.startsWith('-') ? desc((table as any)[field.slice(1)]) : asc((table as any)[field]))
      : defaultSort(table)

  const selectQuery    = options.select ? db.select(options.select) : db.select()
  const resultsQuery   = selectQuery.from(table).where(where).orderBy(...orderBy).limit(take).offset(offset)
  let   results: any[] = []
  let   total          = 0

  if (shouldIncludeTotal) {
    const [fetched, totalResult] = await Promise.all([
      resultsQuery,
      db.select({ count: sql<number>`count(*)` }).from(table).where(where),
    ])
    results = fetched
    total   = Number(totalResult?.[0]?.count ?? 0)
  } else {
    results = await resultsQuery
    total = results.length
  }

  const pagination: any = {}
  const endIndex        = offset + take

  if (shouldIncludeTotal) {
    if (endIndex < total) {
      pagination.next = { page: Number(page) + 1, limit: take }
    }
  } else if (results.length === take) {
    pagination.next = { page: Number(page) + 1, limit: take }
  }

  if (offset > 0) {
    pagination.prev = { page: Number(page) - 1, limit: take }
  }

  res.advanceResult = Resp.AdvancedResult(results, results.length, pagination)
  next()
}

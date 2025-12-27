import { Request, Response, NextFunction } from 'express'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { AnyPgTable } from 'drizzle-orm/pg-core'
import { GLOBAL, db } from 'hoopin'
import { Resp } from 'constant'

const defaultSort = (table: AnyPgTable) => {
  const createdAt = (table as any).createdAt
  return createdAt ? [desc(createdAt)] : []
}

export const advanceResult = <T extends AnyPgTable>(table: T) => async (req: Request, res: Response, next: NextFunction) => {
  const { sort, page = GLOBAL.PAGINATION.DEFAULT_PAGE, limit = GLOBAL.PAGINATION.LIMIT, ...filters } = req.query

  const offset = (Number(page) - 1) * Number(limit)
  const take   = Number(limit)

  const whereClauses = Object.entries(filters)
    .filter(([key]) => Object.hasOwn((table as any).columns, key))
    .map(([key, value]) => eq((table as any)[key], value as string))

  const where = whereClauses.length ? and(...whereClauses) : undefined

  const orderBy =
    sort
      ? (sort as string)
        .split(',')
        .map((field) => field.trim())
        .filter(Boolean)
        .map((field) => field.startsWith('-') ? desc((table as any)[field.slice(1)]) : asc((table as any)[field]))
      : defaultSort(table)

  const [results, totalResult] = await Promise.all([
    db.select().from(table).where(where).orderBy(...orderBy).limit(take).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(table).where(where),
  ])

  const total    = Number(totalResult?.[0]?.count ?? 0)
  const pagination: any = {}
  const endIndex = offset + take

  if (endIndex < total) {
    pagination.next = { page: Number(page) + 1, limit: take }
  }

  if (offset > 0) {
    pagination.prev = { page: Number(page) - 1, limit: take }
  }

  res.advanceResult = Resp.AdvancedResult(results, results.length, pagination)
  next()
}

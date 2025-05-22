import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { GLOBAL } from 'hoopin'
import { Resp } from 'constant'

const prisma = new PrismaClient()

export const advanceResult = <M extends ModelName>(model: M) => async (req: Request, res: Response, next: NextFunction) => {
    const { select, sort, page = GLOBAL.PAGINATION.DEFAULT_PAGE, limit = GLOBAL.PAGINATION.LIMIT, ...filters } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    const orderBy          = sort ? Object.fromEntries((sort as String).split(',').map((field) => [field.trim(), 'asc'])) : { createdAt: 'desc' }
    const where            = Object.fromEntries(Object.entries(filters).map(([key, val]) => [key, { equals: val }]))
    const [results, total] = await Promise.all([ (prisma[model] as any).findMany({ where, take, skip, orderBy }), (prisma[model] as any).count({ where })])
    const pagination: any  = {}
    const endIndex         = skip + take


    if (endIndex < total) {
        pagination.next = { page: Number(page) + 1, limit: take }
    }

    if (skip > 0) {
        pagination.prev = { page: Number(page) - 1, limit: take }
    }

    res.advanceResult = Resp.AdvancedResult(results, results.length, pagination)
    next()
}
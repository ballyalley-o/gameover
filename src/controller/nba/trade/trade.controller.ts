import { Request, Response } from 'express'
import { CODE, Resp } from 'constant'
import { tradeService } from 'service'

export class TradeController {
  static async preview(req: Request, res: Response) {
    const preview = await tradeService.preview(req.body)
    res.status(CODE.OK).send(Resp.Ok(preview))
  }

  static async execute(req: Request, res: Response) {
    const result = await tradeService.execute(req.body)
    res.status(CODE.CREATED).send(Resp.Created(result))
  }

  static async suggest(req: Request, res: Response) {
    const suggestions = await tradeService.suggest(req.body)
    res.status(CODE.OK).send(Resp.Ok(suggestions, suggestions.length))
  }

  static async history(req: Request, res: Response) {
    const teamId    = typeof req.query.teamId === 'string' ? req.query.teamId : undefined
    const rawLimit  = req.query.limit ? Number(req.query.limit) : undefined
    const rawOffset = req.query.offset ? Number(req.query.offset) : undefined
    const limit     = Number.isFinite(rawLimit) ? rawLimit : undefined
    const offset    = Number.isFinite(rawOffset) ? rawOffset : undefined

    const trades = await tradeService.history({ teamId, limit, offset })
    res.status(CODE.OK).send(Resp.Ok(trades, trades.length))
  }

  static async resetHistory(req: Request, res: Response) {
    const teamId = typeof req.query.teamId === 'string' ? req.query.teamId : undefined
    const result = await tradeService.resetHistory(teamId)
    res.status(CODE.OK).send(Resp.Ok(result))
  }
}

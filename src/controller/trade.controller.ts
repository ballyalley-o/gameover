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
}

import { Request, Response } from 'express'
import { CODE, Resp, RESPONSE } from 'constant'
import { ErrorResponse } from 'middleware'
import { lineupService } from 'service'

export class LineupController {
  static async create(req: Request, res: Response) {
    const created = await lineupService.create(req.body)
    res.status(CODE.CREATED).send(Resp.Created(created))
  }

  static async update(req: Request, res: Response) {
    const updated = await lineupService.update(req.params.id, req.body)
    if (!updated) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
    res.status(CODE.OK).send(Resp.Ok(updated))
  }

  static async get(req: Request, res: Response) {
    const lineup = await lineupService.getById(req.params.id)
    if (!lineup) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
    res.status(CODE.OK).send(Resp.Ok(lineup))
  }

  static async computeMetrics(req: Request, res: Response) {
    const metrics = await lineupService.computeMetrics(req.params.id)
    res.status(CODE.OK).send(Resp.Ok(metrics))
  }
}

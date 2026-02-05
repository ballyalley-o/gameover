import { Request, Response } from 'express'
import { CODE, Resp } from 'constant'
import { simService } from 'service'

export class GameController {
  static async simulate(req: Request, res: Response) {
    const result = await simService.simulate(req.body)
    res.status(CODE.CREATED).send(Resp.Created(result))
  }
}

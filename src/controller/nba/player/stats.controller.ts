import { Request, Response } from 'express'
import { CODE, Resp, RESPONSE } from 'constant'
import { ErrorResponse } from 'middleware'
import { playerService } from 'service'
import { statsService } from 'service/nba/player/stats.service'
import { transl } from 'utility'

import { Service } from '../../service.controller'

const TAG = 'Stats.Controller'
export class StatsController {
  static async updatePlayerStats(req: Request, res: Response) {
    try {
      const updated = await playerService.update(req.params.id, req.body)
      if (!updated) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
      res.status(CODE.OK).send(Resp.Ok(updated))
    } catch (error) {
      Service.catchError(error, TAG, 'updatePlayerStats', res)
    }
  }

  static async classifyArchtype(_req: Request, res: Response) {
    try {
      const result = await statsService.classifyArchtype()
      res.status(CODE.OK).send(Resp.Ok(result))
    } catch (error) {
      Service.catchError(error, TAG, 'classifyArchtype', res)
    }
  }

  static async classifyArchetypeByPlayerId(req: Request, res: Response) {
    try {
      const { playerId } = req.params

      const result = await statsService.classifyArchetypeByPlayerId(playerId)
      res.status(CODE.OK).send(Resp.Ok(result))
    } catch (error) {
      Service.catchError(error, TAG, 'classifyArchetypeByPlayerId', res)
    }
  }

  static async syncPlayerStatsByPlayerId(req: Request, res: Response) {
    try {
     const { playerId } = req.params

     if (!playerId) {
      Service.catchError(transl('error.no_id'), TAG, 'playerId-not-found', res)
     }

      const result = await playerService.syncPlayerStatsByPlayerId(playerId)
      res.status(CODE.OK).send(Resp.Ok(result))
    } catch (error) {
      Service.catchError(error, TAG, 'syncPlayerStatsByPlayerId', res)
    }
  }

  static async syncPlayerAllStats(_req: Request, res: Response) {
    try {
      const result = await playerService.syncPlayerAllStats()
      res.status(CODE.OK).send(Resp.Ok(result))
    } catch (error) {
      Service.catchError(error, TAG, 'syncPlayerAllStats', res)
    }
  }
}

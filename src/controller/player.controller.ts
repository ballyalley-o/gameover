import { Request, Response } from 'express'
import { CODE, Resp, RESPONSE } from 'constant'
import { ErrorResponse } from 'middleware'
import { playerInsertSchema } from 'db/validator/player'
import { playerService } from 'service'
import { feedService } from 'service/feed.service'
import { transl } from 'utility'

import { Service } from './service.controller'

const TAG = 'Player.Controller'
export class PlayerController {
  static async list(req: Request, res: Response) {
    const players = await playerService.list({
      fullname : req.query.fullname as string,
      archetype: req.query.archetype as string,
      position : req.query.position as string,
    })
    res.status(CODE.OK).send(Resp.Ok(players, players.length))
  }

  static async get(req: Request, res: Response) {
    try {
      const player = await playerService.getById(req.params.playerId)
      if (!player) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
      res.status(CODE.OK).send(Resp.Ok(player))
    } catch (error) {
      Service.catchError(error, TAG, 'get', res)
    }
  }

  static async create(req: Request, res: Response) {
    const created = await playerService.create(req.body)
    res.status(CODE.CREATED).send(Resp.Created(created))
  }

  static async createBasic(_req: Request, res: Response): Promise<void> {
    const players = await feedService.getPlayerDetailAll()
    if (!Array.isArray(players)) {
      res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.invalid_data_response')))
      return
    }

    const playersToInsert = []
    let   _errors         = []
    for (const _p of players) {
      try {
        const parsed = playerInsertSchema.parse({
          playerId    : _p.PlayerID,
          firstName   : _p.FirstName,
          lastName    : _p.LastName,
          positions   : _p.Position ? [_p.Position]: [],
          heightInches: _p.Height,
          weightLbs   : _p.Weight,
          salary      : _p.Salary,
          archetype   : _p.Archetype ? _p.Archetype: 'unknown'
        })

        playersToInsert.push(parsed)

      } catch (error) {
        console.log('failed to insert:', error)
        _errors.push(error)
      }
    }

    for (const _payload of playersToInsert) {
      await playerService.create(_payload)
    }

    if (playersToInsert.length <= 0) {
      throw new Error('unable to create')
    }
    res.status(CODE.CREATED).send(Resp.Created({ inserted: playersToInsert.length }))
  }

  static async update(req: Request, res: Response) {
    try {
      const updated = await playerService.update(req.params.id, req.body)
      if (!updated) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
      res.status(CODE.OK).send(Resp.Ok(updated))
    } catch (error) {
      Service.catchError(error, TAG, 'update', res)
    }
  }

  static async updatePlayerStats(req: Request, res: Response) {
    try {
      const updated = await playerService.update(req.params.id, req.body)
      if (!updated) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
      res.status(CODE.OK).send(Resp.Ok(updated))
    } catch (error) {
      Service.catchError(error, TAG, 'updatePlayerStats', res)
    }
  }

  static async remove(req: Request, res: Response) {
    await playerService.remove(req.params.id)
    res.status(CODE.OK).send(Resp.Ok({}))
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
      Service.catchError(error, TAG, 'syncAllStats', res)
    }
  }

  static async syncAllStats(_req: Request, res: Response) {
    try {
      const result = await playerService.syncPlayerAllStats()
      res.status(CODE.OK).send(Resp.Ok(result))
    } catch (error) {
      Service.catchError(error, TAG, 'syncAllStats', res)
    }
  }
}

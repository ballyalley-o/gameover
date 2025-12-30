import { Request, Response } from 'express'
import { CODE, Resp, RESPONSE } from 'constant'
import { ErrorResponse } from 'middleware'
import { teamService } from 'service'

const TAG = 'Team.Controller'
export class TeamController {
  static async list(req: Request, res: Response) {
    const teams = await teamService.list(req.query.ownerUserId as string | undefined)
    res.status(CODE.OK).send(Resp.Ok(teams, teams.length))
  }

  static async get(req: Request, res: Response) {
    const team = await teamService.getById(req.params.id)
    if (!team) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
    res.status(CODE.OK).send(Resp.Ok(team))
  }

  static async create(req: Request, res: Response) {
    const created = await teamService.create(req.body)
    res.status(CODE.CREATED).send(Resp.Created(created))
  }

  static async update(req: Request, res: Response) {
    const updated = await teamService.update(req.params.id, req.body)
    if (!updated) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
    res.status(CODE.OK).send(Resp.Ok(updated))
  }

  static async roster(req: Request, res: Response) {
    const roster = await teamService.roster(req.params.id)
    res.status(CODE.OK).send(Resp.Ok(roster, roster.length))
  }

  static async addPlayer(req: Request, res: Response) {
    const { playerId, contract } = req.body
    await teamService.addToRoster(req.params.id, playerId, contract)
    res.status(CODE.OK).send(Resp.Ok({}))
  }

  static async removePlayer(req: Request, res: Response) {
    await teamService.removeFromRoster(req.params.id, req.params.playerId)
    res.status(CODE.OK).send(Resp.Ok({}))
  }
}

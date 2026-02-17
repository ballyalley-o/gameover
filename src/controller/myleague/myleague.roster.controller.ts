import { Request, Response } from 'express'
import { Service } from 'controller'
import { transl } from 'utility'
import { ErrorResponse } from 'middleware'
import { CODE, Resp, RESPONSE } from 'constant'
import { myLeagueRosterService, myLeagueTeamService } from 'service/myleague'

const TAG = 'MyLeagueRoster.Controller'
export class MyLeagueRosterController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const userId         = Service.getAuthUserId(req)
      const { myLeagueId } = req.params
      const user           = await Service.getAuthUser(userId ?? '')

      if (!user) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
      const myLeagueRosterAll = await myLeagueRosterService.list(myLeagueId, user)
      res.status(CODE.OK).send(Resp.Ok(myLeagueRosterAll, myLeagueRosterAll?.length))
    } catch (error) {
      Service.catchError(error, TAG, 'list', res)
    }
  }

  static async listRosterPlayerAll(req: Request, res: Response): Promise<void> {
    try {
      const { myLeagueId, myLeagueTeamId } = req.params

      const rosters = await myLeagueRosterService.listRosterPlayerAll(myLeagueId, myLeagueTeamId)
      res.status(CODE.OK).send(Resp.Ok(rosters, rosters?.length))
    } catch (error) {
      Service.catchError(error, TAG, 'listRosterPlayerAll', res)
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user.id) {
        return Service.invalid(RESPONSE.ERROR[401], CODE.FORBIDDEN)
      }
      const { myLeagueId, myLeagueRosterId } = req.params

      if (!myLeagueId || !myLeagueRosterId) {
        throw new ErrorResponse(transl('error.no_id'), CODE.BAD_REQUEST)
      }

      const myLeagueRoster = await myLeagueRosterService.get(myLeagueId, myLeagueRosterId)
      res.status(CODE.OK).send(Resp.Ok(myLeagueRoster))
    } catch (error) {
      Service.catchError(error, TAG, 'get', res)
    }
  }

  static async removeRoster(req: Request, res: Response): Promise<void> {
    try {
      const actorUser                      = req.user
      const { myLeagueId, myLeagueRosterId } = req.params

      if (!actorUser) {
        throw new ErrorResponse(transl('error.user_not_found'), CODE.NOT_FOUND)
      }

      const removedRoster = await myLeagueRosterService.removeRoster(myLeagueId, myLeagueRosterId, actorUser)
      res.status(CODE.NO_CONTENT).send(Resp.Ok(removedRoster, 0, RESPONSE.SUCCESS.DELETED))
    } catch (error) {
      Service.catchError(error, TAG, 'removeRoster', res)
    }
  }
}

import { Request, Response } from 'express'
import { Service } from 'controller'
import { transl } from 'utility'
import { ErrorResponse } from 'middleware'
import { CODE, Resp, RESPONSE } from 'constant'
import { myLeagueTeamService } from 'service/myleague'

const TAG = 'MyLeagueTeam.Controller'
export class MyLeagueTeamController {
    static async list(req: Request, res: Response): Promise<void> {
        try {
            const userId         = Service.getAuthUserId(req)
            const { myLeagueId } = req.params
            const user           = await Service.getAuthUser(userId ?? '')

            if (!user) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
            const myLeagueTeams = await myLeagueTeamService.list(myLeagueId, user, { name: req.query.name as string, key: req.query.key as string, city: req.query.city as string })
            res.status(CODE.OK).send(Resp.Ok(myLeagueTeams, myLeagueTeams?.length))
        } catch (error) {
            Service.catchError(error, TAG, 'list', res)
        }
    }

    static async listAvailableTeamAll(req: Request, res: Response): Promise<void> {
        try {
            const actorUserId    = req.user?.id
            const { myLeagueId } = req.params

            if (!actorUserId) {
                return Service.invalid(RESPONSE.ERROR[403], CODE.UNAUTHORIZED)
            }

            const teams = await myLeagueTeamService.listAvailableTeamAll(myLeagueId, actorUserId)
            res.status(CODE.OK).send(Resp.Ok(teams, teams.length))
        } catch (error) {
            Service.catchError(error, TAG, 'listAvailableTeamAll',res)
        }
    }

    static async get(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user.id) {
                return Service.invalid(RESPONSE.ERROR[401], CODE.FORBIDDEN)
            }
            const { myLeagueId, myLeagueTeamId } = req.params

            if (!myLeagueId || !myLeagueTeamId) {
                throw new ErrorResponse(transl('error.no_id'), CODE.BAD_REQUEST)
            }

            const myLeagueTeam = await myLeagueTeamService.get(myLeagueId, myLeagueTeamId)
            res.status(CODE.OK).send(Resp.Ok(myLeagueTeam))
        } catch (error) {
            Service.catchError(error,TAG, 'get', res)
        }
    }

    static async selectTeam(req: Request, res: Response) {
        try {
            const actorUserId                    = req.user?.id
            const { myLeagueId, myLeagueTeamId } = req.params
            const { teamKey }    = (typeof req.body === 'object' && req.body) ? req.body : {}

            if (!actorUserId || !myLeagueTeamId) {
                return Service.invalid(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
            }

            const team = await myLeagueTeamService.selectTeam(myLeagueId, actorUserId, teamKey, myLeagueTeamId)
            res.status(CODE.OK).send(Resp.Ok(team))
        } catch (error) {
            Service.catchError(error, TAG, 'selectTeam', res)
        }
    }

    static async removeTeam(req: Request, res: Response): Promise<void> {
        try {
            const actorUser                    = req.user
            const { myLeagueId, myLeagueTeamId } = req.params

            if (!actorUser) {
                throw new ErrorResponse(transl('error.user_not_found'), CODE.NOT_FOUND)
            }

            const removedTeam = await myLeagueTeamService.removeTeam(myLeagueId, myLeagueTeamId, actorUser)
            res.status(CODE.NO_CONTENT).send(Resp.Ok(removedTeam, 0, RESPONSE.SUCCESS.DELETED))
        } catch (error) {
            Service.catchError(error, TAG, 'removeTeam', res)
        }
    }
}
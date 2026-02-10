import { Request, Response } from 'express'
import { CODE, Resp, RESPONSE } from 'constant'
import { myLeagueMembershipService } from 'service'

import { Service } from '../service.controller'

const TAG = 'MyLeagueMembership.Controller'
export class MyLeagueMembershipController {
  static async getMemberAll(req: Request, res: Response) {
    try {
      const { myLeagueId } = req.params
      const status         = req.query.status as MyLeagueMembershipStatus
      const actorUserId    = req.user?.id

      if (!actorUserId) {
        return Service.invalid(RESPONSE.ERROR[401], CODE.UNAUTHORIZED)
      }

      const members = await myLeagueMembershipService.getMemberAll(myLeagueId, actorUserId, status)
      res.status(CODE.OK).send(Resp.Ok(members, members?.length))
    } catch (error) {
      Service.catchError(error, TAG, 'getMemberAll', res)
    }
  }

  static async invite(req: Request, res: Response) {
    try {
      const ownerUserId    = req.user?.id
      const { myLeagueId } = req.params
      const { userId }     = (typeof req.body === 'object' && req.body) ? req.body : {}

      if (!ownerUserId || !userId) {
        return Service.invalid(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
      }

      const membership = await myLeagueMembershipService.invite(myLeagueId, ownerUserId, userId)
      res.status(CODE.CREATED).send(Resp.Created(membership))
    } catch (error) {
      Service.catchError(error, TAG, 'invite', res)
    }
  }

  static async requestJoin(req: Request, res: Response) {
    try {
      const userId         = req.user?.id
      const { myLeagueId } = req.params

      if (!userId) {
        return Service.invalid(RESPONSE.ERROR[401], CODE.UNAUTHORIZED)
      }

      const membership = await myLeagueMembershipService.requestJoin(myLeagueId, userId)
      res.status(CODE.CREATED).send(Resp.Created(membership))
    } catch (error) {
      Service.catchError(error, TAG, 'requestJoin', res)
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const { myLeagueId } = req.params
      const status         = req.query.status as MyLeagueMembershipStatus | undefined
      const actorUserId    = req.user?.id

      if (!actorUserId) {
        return Service.invalid(RESPONSE.ERROR[401], CODE.UNAUTHORIZED)
      }

      const memberships = await myLeagueMembershipService.list(myLeagueId, actorUserId, status)
      res.status(CODE.OK).send(Resp.Ok(memberships, memberships.length))
    } catch (error) {
      Service.catchError(error, TAG, 'list', res)
    }
  }

  static async accept(req: Request, res: Response) {
    try {
      const actorUserId                  = req.user?.id
      const { myLeagueId, membershipId } = req.params

      if (!actorUserId) {
        return Service.invalid(RESPONSE.ERROR[401], CODE.UNAUTHORIZED)
      }

      const updated = await myLeagueMembershipService.respond(myLeagueId, membershipId, actorUserId, 'accept')
      res.status(CODE.OK).send(Resp.Ok(updated))
    } catch (error) {
      Service.catchError(error, TAG, 'accept', res)
    }
  }

  static async decline(req: Request, res: Response) {
    try {
      const actorUserId                  = req.user?.id
      const { myLeagueId, membershipId } = req.params

      if (!actorUserId) {
        return Service.invalid(RESPONSE.ERROR[401], CODE.UNAUTHORIZED)
      }

      const updated = await myLeagueMembershipService.respond(myLeagueId, membershipId, actorUserId, 'decline')
      res.status(CODE.OK).send(Resp.Ok(updated))
    } catch (error) {
      Service.catchError(error, TAG, 'decline', res)
    }
  }

  // static async selectTeam(req: Request, res: Response) {
  //   try {
  //     const actorUserId                 = req.user?.id
  //     const { myLeagueId }              = req.params
  //     const { myLeagueTeamId, teamKey } = (typeof req.body === 'object' && req.body) ? req.body : {}

  //     if (!actorUserId || !myLeagueTeamId) {
  //       return Service.invalid(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
  //     }

  //     const team = await myLeagueMembershipService.selectTeam(myLeagueId, actorUserId, teamKey, myLeagueTeamId)
  //     res.status(CODE.OK).send(Resp.Ok(team))
  //   } catch (error) {
  //     Service.catchError(error, TAG, 'selectTeam', res)
  //   }
  // }

  // static async listAvailableTeamAll(req: Request, res: Response): Promise<void> {
  //   try {
  //     const actorUserId    = req.user?.id
  //     const { myLeagueId } = req.params

  //     if (!actorUserId) {
  //       return Service.invalid(RESPONSE.ERROR[403], CODE.UNAUTHORIZED)
  //     }

  //     const teams = await myLeagueMembershipService.listAvailableTeamAll(myLeagueId, actorUserId)
  //     res.status(CODE.OK).send(Resp.Ok(teams, teams.length))
  //   } catch (error) {
  //     Service.catchError(error, TAG, 'listAvailableTeamAll',res)
  //   }
  // }
}

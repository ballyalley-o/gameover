import { db, GLOBAL } from 'gameover'
import { Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import { users } from 'db/schema'
import { myLeagueService } from 'service'
import { DrizzleUser } from 'types/schema'
import { ErrorResponse } from 'middleware'
import { CODE, Resp, RESPONSE } from 'constant'
import { normalize, transl } from 'utility'

import { Service } from './service.controller'

const MAX_LEAGUE_PER_OWNER = GLOBAL.MY_LEAGUE.MAX_LEAGUE_PER_OWNER

const TAG = 'MyLeague.Controller'
export class MyLeagueController {
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const userId    = Service.getAuthUserId(req)
      const user      = await Service.getAuthUser(userId ?? '')

      if (!user) throw new ErrorResponse(RESPONSE.ERROR[401], CODE.UNAUTHORIZED)
      const myLeagues = await myLeagueService.list(user, { name: req.query.name as string })
      res.status(CODE.OK).send(Resp.Ok(myLeagues, myLeagues.length))
    } catch (error) {
      Service.catchError(error, TAG, 'get', res)
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    try {
      const myLeague = await myLeagueService.getById(req.params.myLeagueId)
      if (!myLeague) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
      res.status(CODE.OK).send(Resp.Ok(myLeague))
    } catch (error) {
      Service.catchError(error, TAG, 'getById', res)
    }
  }

  static async getMyLeagueAll(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user.id) {
        return Service.invalid(RESPONSE.ERROR[401], CODE.UNAUTHORIZED)
      }
      const { user }    = req
      const myLeagueAll = await myLeagueService.getMyLeagueAll(user.id)
      if (myLeagueAll?.length < 0) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
      if (myLeagueAll?.length == 0) throw new Error(transl('message.owner_no_myleague'))

      res.status(CODE.OK).send(Resp.Ok(myLeagueAll))
    } catch (error) {
      Service.catchError(error, TAG, 'getMyLeagueAll', res)
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const payload = typeof req.body === 'object' && req.body ? req.body : {}
      const { draft, ...leaguePayload } = payload

      let draftResult = undefined

      const authUserId = Service.getAuthUserId(req)
      if (!authUserId) throw new ErrorResponse(RESPONSE.ERROR[401], CODE.UNAUTHORIZED)

      const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, authUserId))
      if (!user) throw new ErrorResponse(RESPONSE.ERROR[401], CODE.UNAUTHORIZED)

      const isAdmin = normalize(user.role) === 'admin'

      if (leaguePayload?.ownerUserId && leaguePayload.ownerUserId !== user.id) {
        throw new ErrorResponse(RESPONSE.ERROR[403], CODE.FORBIDDEN)
      }

      const leagueCount = await myLeagueService.ownerLeagueCount(user as DrizzleUser)
      if (leagueCount > MAX_LEAGUE_PER_OWNER && !isAdmin) {
        throw new ErrorResponse(transl('validation.max_league_allowed_user', { max: 5 }), CODE.BAD_REQUEST)
      }

      if (isAdmin) {
        leaguePayload.ownerUserId ??= user.id
      }

      const created = await myLeagueService.create({ ownerUserId: authUserId, ...leaguePayload})

      if (draft && created.league?.id) {
        const options     = typeof draft === 'object' ? draft : {}
              draftResult = await myLeagueService.draft(created.league.id, options)
      }

      res.status(CODE.CREATED).send(Resp.Created({ ...created, draft: draftResult }))
    } catch (error) {
      Service.catchError(error, TAG, 'create', res)
    }
  }

  static async updateMyLeague(req: Request, res: Response): Promise<void> {
    try {
      const { myLeagueId } = req.params
      const data           = req.body

      if (!myLeagueId) Service.invalid(transl('error.no_id'), CODE.BAD_REQUEST)

      const updatedMyLeague = await myLeagueService.updateMyLeague(myLeagueId, data)

      res.status(CODE.OK).send(Resp.Ok(updatedMyLeague))
    } catch (error) {
      Service.catchError(error, TAG, 'update', res)
    }
  }
  static async draft(req: Request, res: Response) {
    try {
      const options = typeof req.body === 'object' && req.body ? req.body : {}
      const result = await myLeagueService.draft(req.params.leagueId, options)
      res.status(CODE.OK).send(Resp.Ok(result))
    } catch (error) {
      Service.catchError(error, TAG, 'draft', res)
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { myLeagueId }  = req.params
      const data            = typeof req.body === 'object' && req.body ? req.body : {}
      const updatedMyLeague = await myLeagueService.updateMyLeagueById(myLeagueId, data)
      res.status(CODE.OK).send(Resp.Ok(updatedMyLeague))
    } catch (error) {
      Service.catchError(error, TAG, 'update', res)
    }
  }

  static async deleteMyLeagueById(req: Request, res: Response): Promise<void> {
    try {
      const { myLeagueId } = req.params
      await myLeagueService.remove(myLeagueId)
      res.status(CODE.NO_CONTENT).send(Resp.Ok({}))
    } catch (error) {
      Service.catchError(error, TAG, 'deleteMyLeagueById', res)
    }
  }

  static async deleteAll(req: Request, res: Response): Promise<void> {
    try {
      await myLeagueService.removeAll()
      res.status(CODE.NO_CONTENT).send(Resp.Ok([]))
    } catch (error) {
      Service.catchError(error, TAG, 'deleteMyLeagueById', res)
    }
  }
}

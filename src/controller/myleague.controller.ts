import { Request, Response } from 'express'
import { CODE, Resp } from 'constant'
import { myLeagueService } from 'service'

import { Service } from './service.controller'

const TAG = 'MyLeague.Controller'
export class MyLeagueController {
  static async create(req: Request, res: Response) {
    try {
      const payload = typeof req.body === 'object' && req.body ? req.body : {}
      const { draft, ...leaguePayload } = payload

      const created = await myLeagueService.create(leaguePayload)
      let draftResult = undefined

      if (draft && created.league?.id) {
        const options = typeof draft === 'object' ? draft : {}
        draftResult = await myLeagueService.draft(created.league.id, options)
      }

      res.status(CODE.CREATED).send(Resp.Created({ ...created, draft: draftResult }))
    } catch (error) {
      Service.catchError(error, TAG, 'create', res)
    }
  }

  static async draft(req: Request, res: Response) {
    try {
      const options = typeof req.body === 'object' && req.body ? req.body : {}
      const result  = await myLeagueService.draft(req.params.leagueId, options)
      res.status(CODE.OK).send(Resp.Ok(result))
    } catch (error) {
      Service.catchError(error, TAG, 'draft', res)
    }
  }
}

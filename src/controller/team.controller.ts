import { Request, Response } from 'express'
import { CODE, Resp, RESPONSE } from 'constant'
import { ErrorResponse } from 'middleware'
import { teamInsertSchema } from 'db/validator'
import { teamService } from 'service'
import { feedService } from 'service/feed.service'
import { transl } from 'utility'

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

  static async createBasic(_req: Request, res: Response): Promise<void> {
    const teams = await feedService.getTeamActiveAll()
    if (!Array.isArray(teams)) {
      res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.invalid_data_response')))
      return
    }

    const teamsToInsert = []
    let   _errors       = []
    for (const _t of teams) {
      try {
        const parsed = teamInsertSchema.parse({
          status         : _t.Active ? 'Active' : 'Inactive',
          teamId         : _t.TeamID,
          stadiumId      : _t.StadiumID,
          key            : _t.Key,
          city           : _t.City,
          name           : _t.Name,
          conference     : _t.Conference,
          division       : _t.Division,
          primaryColor   : _t.PrimaryColor,
          secondaryColor : _t.SecondaryColor,
          tertiaryColor  : _t.TertiaryColor,
          quaternaryColor: _t.QuaternaryColor,
          logoUrl        : _t.WikipediaLogoUrl,
          wordmarkUrl    : _t.WikipediaWordMarkUrl,
          headcoach      : _t.HeadCoach,
        })

        teamsToInsert.push(parsed)

      } catch (error) {
        console.log('failed to insert:', error)
        _errors.push(error)
      }
    }

    for (const _payload of teamsToInsert) {
      await teamService.create(_payload)
    }

    if (teamsToInsert.length <= 0) {
      throw new Error('unable to create')
    }
    res.status(CODE.CREATED).send(Resp.Created({ inserted: teamsToInsert.length }))
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

  static async deleteTeam(_req: Request, res: Response) {
    await teamService.deleteTeam()
    res.status(CODE.NO_CONTENT).send(Resp.Ok({}))
  }
}

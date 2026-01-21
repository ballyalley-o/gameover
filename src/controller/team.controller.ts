import { Request, Response } from 'express'
import { db } from 'gameover'
import { eq, inArray } from 'drizzle-orm'
import { ErrorResponse } from 'middleware'
import { teamInsertSchema } from 'db/validator'
import { players, teams } from 'db/schema'
import { teamService, feedService } from 'service'
import type { TeamAbbrNBA } from 'constant'
import { CODE, Resp, RESPONSE, TEAM_ABBR_NBA } from 'constant'
import { transl } from 'utility'

import { Service } from './service.controller'

const TAG = 'Team.Controller'
export class TeamController {
  static async list(req: Request, res: Response) {
    const teams = await teamService.list(req.query.ownerUserId as string | undefined)
    res.status(CODE.OK).send(Resp.Ok(teams, teams.length))
  }

  static async get(req: Request, res: Response) {
    try {
      const team = await teamService.getById(req.params.teamId)
      if (!team) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
      res.status(CODE.OK).send(Resp.Ok(team))
    } catch (error) {
      Service.catchError(error, TAG, 'get', res)
    }
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
    const roster = await teamService.roster(req.params.teamId)
    res.status(CODE.OK).send(Resp.Ok(roster, roster.length))
  }

  static async addPlayer(req: Request, res: Response) {
    const { teamId } = req.params
    await teamService.addToRoster(teamId, 'asd1241', {})
    res.status(CODE.OK).send(Resp.Ok({}))
  }

  static async addPlayerToRosterBulk(req: Request, res: Response) {
    try {
      const teamId = req.params.teamId

      if (!teamId) {
        res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.no_id'), CODE.BAD_REQUEST))
        return
      }

      const [team] = await db.select({ teamId: teams.teamId, key: teams.key }).from(teams).where(eq(teams.teamId, teamId))
      if (!team) {
        res.status(CODE.NOT_FOUND).json(Resp.Error(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND))
        return
      }

      const playersFeed = await feedService.getPlayerAllByTeam(team.key as TeamAbbrNBA)
      if (!Array.isArray(playersFeed)) {
        res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.invalid_data_response')))
        return
      }

      const feedPlayerIds = [...new Set(playersFeed
        .map((player) => player?.PlayerID)
        .filter((playerId) => playerId !== undefined && playerId !== null)
        .map((playerId) => playerId.toString()))]

      if (!feedPlayerIds.length) {
        res.status(CODE.OK).send(Resp.Ok({ inserted: 0, matched: 0, missing: 0 }))
        return
      }

      const dbPlayers = await db
        .select({ id: players.id, playerId: players.playerId })
        .from(players)
        .where(inArray(players.playerId, feedPlayerIds))

      const dbPlayerIds        = dbPlayers.map((player) => player.id)
      const foundExternalIds   = new Set(dbPlayers.map((player) => player.playerId))
      const missingExternalIds = feedPlayerIds.filter((playerId) => !foundExternalIds.has(playerId))

      if (!dbPlayerIds.length) {
        res.status(CODE.OK).send(Resp.Ok({ inserted: 0, matched: 0, missing: missingExternalIds.length }))
        return
      }

      const rosterResult = await teamService.bulkAdd(team.teamId, dbPlayerIds)
      const newRoster    = {
        teamId,
        teamKey : team.key,
        inserted: rosterResult.inserted,
        matched : dbPlayerIds.length,
        missing : missingExternalIds.length,
      }
      res.status(CODE.CREATED).json(Resp.Created(newRoster))
    } catch (error) {
      Service.catchError(error, TAG, 'addPlayerToRosterBulk', res)
    }
  }

  static async syncRoster(req: Request, res: Response) {
    try {
      const { teamId } = req.params

      if (!teamId) {
        res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.no_id'), CODE.BAD_REQUEST))
        return
      }

      const [team] = await db.select({ id: teams.id, teamId: teams.teamId, key: teams.key }).from(teams).where(eq(teams.teamId, teamId))

      if (!team) {
        res.status(CODE.NOT_FOUND).json(Resp.Error(transl('error.not_found', { field: 'team' }), CODE.NOT_FOUND))
        return
      }

      const playersFeed = await feedService.getPlayerAllByTeam(team.key as TeamAbbrNBA)

      if (!Array.isArray(playersFeed)) {
        res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.invalid_data_response')))
        return
      }

      const feedPlayerIds = [...new Set(playersFeed.map((_i) => _i?.PlayerID).filter(_id => _id !== undefined && _id !== null).map(_id => _id.toString()))]

      if (!feedPlayerIds.length) {
        const result = await teamService.syncRoster(team.id, [])
        res.status(CODE.OK).json(Resp.Ok({
          teamId, teamKey: team.key, matched: 0, upserted: result.upserted, removed: result.removed
        }))
        return
      }

      const dbPlayers          = await db.select({ id: players.id, playerId: players.playerId, salary: players.salary }).from(players).where(inArray(players.playerId, feedPlayerIds))
      const foundExternalIds   = new Set(dbPlayers.map((_p) => _p.playerId))
      const missingExternalIds = feedPlayerIds.filter((_id) => !foundExternalIds.has(_id))

      const items = dbPlayers.map((_p) => ({
        playerId   : _p.id,
        salary     : _p.salary ?? 0,
        contractYrs: 1,
        isActive   : true
      }))

      const result = await teamService.syncRoster(team.id, items)
      res.status(CODE.OK).json(Resp.Ok({
        teamId,
        teamKey : team.key,
        matched : items.length,
        upserted: result.upserted,
        removed : missingExternalIds.length
       }))

    } catch (error) {
      Service.catchError(error, TAG, 'syncRoster', res)
    }
  }

  static async removePlayer(req: Request, res: Response) {
    await teamService.removeFromRoster(req.params.id, req.params.playerId)
    res.status(CODE.OK).send(Resp.Ok({}))
  }

  static async deleteTeamAll(_req: Request, res: Response) {
    await teamService.deleteTeamAll()
    res.status(CODE.NO_CONTENT).send(Resp.Ok({}))
  }

  static async deleteRosterAll(_req: Request, res: Response) {
    await teamService.deleteRosterAll()
    res.status(CODE.NO_CONTENT).send(Resp.Ok({}))
  }
}

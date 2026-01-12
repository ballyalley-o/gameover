import { NextFunction, Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import { feedService } from 'service/feed.service'
import { getDrizzleDbClient } from 'db/client'
import { players } from 'db/schema'
import type { TeamAbbrNBA } from 'constant'
import { CODE, Resp, TEAM_ABBR_NBA } from 'constant'
import { transl } from 'utility'

import { Service } from './service.controller'

const TAG = 'Feed.Controller'
export class FeedController {
    // Player
    public static async getPlayerActiveAll(_req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const players = await feedService.getPlayerActiveAll()

            res.status(CODE.OK).json(Resp.Ok(players, Array.isArray(players) ? players.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getPlayerActiveAll', res)
        }
    }
    public static async getPlayerDetailAll(_req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const players = await feedService.getPlayerDetailAll()
            res.status(CODE.OK).json(Resp.Ok(players, Array.isArray(players) ? players.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getPlayerDetailAll', res)
        }
    }

    public static async getPlayerAllByTeam(req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const teamParam = typeof req.query.team === 'string' ? req.query.team.toUpperCase() : ''

            if (!teamParam || !(teamParam in TEAM_ABBR_NBA)) {
                res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.invalid_team_abbr'), CODE.BAD_REQUEST))
                return
            }
            const players = await feedService.getPlayerAllByTeam(teamParam as TeamAbbrNBA)
            res.status(CODE.OK).json(Resp.Ok(players, Array.isArray(players) ? players.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getPlayerAllByTeam', res)
        }
    }

    public static async getPlayerStatsBySeasonAndPlayerId(req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const { season, playerId } = req.query

            const seasonStr   = typeof season   === 'string' ? season : Array.isArray(season) ? String(season[0] ?? '') : ''
            const playerIdStr = typeof playerId === 'string' ? playerId : Array.isArray(playerId) ? String(playerId[0] ?? '') : ''

            if (!seasonStr || !playerIdStr) {
              res.status(CODE.BAD_REQUEST).json(Resp.Error('Invalid request: date or playerId not provided', CODE.BAD_REQUEST))
              return
            }
            const db       = await getDrizzleDbClient()
            const dbPlayer = await db.select().from(players).where(eq(players.playerId, playerIdStr)).limit(1)

            if (!dbPlayer || !Array.isArray(dbPlayer) || dbPlayer.length <= 0) {
                res.status(CODE.NOT_FOUND).json(Resp.Error('Not found: Player not found', CODE.NOT_FOUND))
                return
            }

            const stats = await feedService.getPlayerStatsBySeasonAndPlayerId(String(season), String(playerId))
            res.status(CODE.OK).json(Resp.Ok(stats, Array.isArray(stats) ? stats.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getPlayerStatsBySeasonAndPlayerId', res)
        }
    }

    public static async getInjuredPlayerAll(_req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const players = await feedService.getPlayerInjuredAll()
            res.status(CODE.OK).json(Resp.Ok(players, Array.isArray(players) ? players.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getInjuredPlayerAll', res)
        }
    }

    public static async getAllStarAll(req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const { season } = req.query
            const seasonRegex = /^\d{4}(PRE|POST|STAR)?$/
            if (!season || !seasonRegex.test(String(season))) {
                res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.invalid_season_format'), CODE.BAD_REQUEST))
                return
            }

            const allStars = await feedService.getAllStarAll(season as string)
            res.status(CODE.OK).json(Resp.Ok(allStars, Array.isArray(allStars) ? allStars.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getAllStarAll', res)
        }
    }

    // Team
    public static async getTeamAll(req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const teams = await feedService.getTeamAll()
            res.status(CODE.OK).json(Resp.Ok(teams, Array.isArray(teams) ? teams.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getTeamAll', res)
        }
    }

    public static async getTeamActiveAll(req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const activeTeams = await feedService.getTeamActiveAll()
            res.status(CODE.OK).json(Resp.Ok(activeTeams, Array.isArray(activeTeams) ? activeTeams.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getTeamActiveAll', res)
        }
    }

    // Score
    public static async getScoreAllByDate(req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const { date }  = req.query
            const dateRegex = /\d{4}-\d{2}-\d{2}/
            if (!date || !dateRegex.test(String(date))) {
                res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.invalie_date_format'), CODE.BAD_REQUEST))
                return
            }
            const scores = await feedService.getScoreAllByDate(date as string)
            res.status(CODE.OK).json(Resp.Ok(scores, Array.isArray(scores) ? scores.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getScoreAllByDate', res)
        }
    }

    public static async getScoreAllByDateFinal(req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const { date }  = req.query
            const dateRegex = /\d{4}-\d{2}-\d{2}/
            if (!date || !dateRegex.test(String(date))) {
                res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.invalie_date_format'), CODE.BAD_REQUEST))
                return
            }
            const scores = await feedService.getScoreAllByDate(date as string)
            res.status(CODE.OK).json(Resp.Ok(scores, Array.isArray(scores) ? scores.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getScoreAllByDateFinal', res)
        }
    }

    public static async getBoxscoreAllByDateFinal(req: Request, res: Response, _next: NextFunction): Promise<void> {
        try {
            const { date } =  req.query
            const dateRegex = /\d{4}-\d{2}-\d{2}/
            if (!date || !dateRegex.test(String(date))) {
                res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.invalie_date_format'), CODE.BAD_REQUEST))
                return
            }
            const boxscores = await feedService.getBoxscoreAllByDateFinal(date as string)
            res.status(CODE.OK).json(Resp.Ok(boxscores, Array.isArray(boxscores) ? boxscores.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getBoxscoreAllByDateFinal', res)
        }
    }

    public static async getScheduleAll(req: Request, res: Response, _next: NextFunction) {
        try {
            const { season } = req.query
            const seasonRegex = /^\d{4}(PRE|POST|STAR)?$/
            if (!season || !seasonRegex.test(String(season))) {
                res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.invalid_season_format'), CODE.BAD_REQUEST))
                return
            }
            const schedules = await feedService.getScheduleAll(season as string)
            res.status(CODE.OK).json(Resp.Ok(schedules, Array.isArray(schedules) ? schedules.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getScheduleAll', res)
        }
    }

    public static async getStanding(req: Request, res: Response, _next: NextFunction) {
        try {
            const { season } = req.query
            const seasonRegex = /^\d{4}(PRE)?$/
            if (!season || !seasonRegex.test(String(season))) {
                res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.invalid_season_format_short'), CODE.BAD_REQUEST))
                return
            }
            const standing = await feedService.getStanding(season as string)
            res.status(CODE.OK).json(Resp.Ok(standing, Array.isArray(standing) ? standing.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getStanding', res)
        }
    }


    public static async getNewsAll(_req: Request, res: Response, _next: NextFunction) {
        try {
            const news = await feedService.getNewsAll()
            res.status(CODE.OK).json(Resp.Ok(news, Array.isArray(news) ? news.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getNewsAll', res)
        }
    }

    public static async getTransactionAll(req: Request, res: Response, _next: NextFunction) {
        try {
            const { date }  = req.query
            const dateRegex = /\d{4}-\d{2}-\d{2}/
            if (!date || !dateRegex.test(String(date))) {
                res.status(CODE.BAD_REQUEST).json(Resp.Error(transl('error.invalie_date_format'), CODE.BAD_REQUEST))
                return
            }
            const news = await feedService.getNewsAll()
            res.status(CODE.OK).json(Resp.Ok(news, Array.isArray(news) ? news.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getNewsAll', res)
        }
    }

    public static async getFreeAgents(_req: Request, res: Response, _next: NextFunction) {
        try {
            const agents = await feedService.getFreeAgents()
            res.status(CODE.OK).json(Resp.Ok(agents, Array.isArray(agents) ? agents.length : undefined))
        } catch (error) {
            Service.catchError(error, TAG, 'getFreeAgents', res)
        }
    }
}

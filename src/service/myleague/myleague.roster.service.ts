import { db } from 'gameover'
import { and, eq, getTableColumns, sql } from 'drizzle-orm'
import { myLeaguePlayers, myLeagueRosters, myLeagues, myLeagueTeams } from 'db/schema'
import { ErrorResponse } from 'middleware'
import type { DrizzleMyLeagueRoster, DrizzleUser } from 'types/schema'
import { CODE, RESPONSE } from 'constant'
import { transl } from 'utility'

import { ensureLeague } from './membership.service'

const TAG = 'MyLeagueRoster.Service'
export const myLeagueRosterService = {
    async list(myLeagueId: string, actorUser: Pick<DrizzleUser, 'id' | 'role'>): Promise<DrizzleMyLeagueRoster[] | undefined> {
        try {
            const conditions = [] as any[]

            const [myLeague] = await db.select({ id: myLeagues.id, ownerUserId:  myLeagues.ownerUserId }).from(myLeagues).where(eq(myLeagues.id, myLeagueId))

            const where = conditions.length ? and(...conditions) : undefined
            return db.select().from(myLeagueRosters).where(where)
        } catch (error) {
            if (error instanceof Error) {
                throw new ErrorResponse(error.message, CODE.INTERNAL_SERVER_ERROR)
            }
            console.error(error)
        }
    },

    async listRosterPlayerAll(myLeagueId: string,  myLeagueTeamId: string) {
        try {
            if (!myLeagueId || !myLeagueTeamId) {
                throw new ErrorResponse(transl('error.no_id'), CODE.BAD_REQUEST)
            }

            const  myLeagueRosterPlayerAll = await db.select({ id: myLeagueRosters.id, playerId: myLeagueRosters.leaguePlayerId }).from(myLeagueRosters).where(and(eq(myLeagueRosters.leagueId, myLeagueId),  eq(myLeagueRosters.leagueTeamId, myLeagueTeamId)))

            if (!myLeagueRosterPlayerAll) {
                throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
            }

            let players = []

            for (const _p of myLeagueRosterPlayerAll) {
                const [rosterPlayer] = await db.select({ id: myLeaguePlayers.id, name:  sql`concat(${myLeaguePlayers.firstname}, ' ', ${myLeaguePlayers.lastname})`, overall: myLeaguePlayers.overall, position: myLeaguePlayers.positions }).from(myLeaguePlayers).where(eq(myLeaguePlayers.id, _p.playerId))
                players.push(rosterPlayer)
            }

            return players
        } catch (error) {
            if (error instanceof Error) {
                throw new ErrorResponse(error.message, CODE.INTERNAL_SERVER_ERROR)
            }
            console.error(error)
        }
    },

    async get(myLeagueId: string, myLeagueRosterId: string) {
        try {
            if (!myLeagueId || !myLeagueRosterId) {
                throw new ErrorResponse(transl('error.no_id'), CODE.BAD_REQUEST)
            }

            const myLeague = await ensureLeague(myLeagueId)
            if (!myLeague) {
                throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
            }

            const [myLeagueRoster] = await db.select().from(myLeagueRosters).where(and(eq(myLeagueRosters.leagueId, myLeagueId), eq(myLeagueRosters.id, myLeagueRosterId)))
            if (!myLeagueRoster) {
                throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
            }

            return myLeagueRoster
        } catch (error) {
            if (error instanceof Error) {
                throw new ErrorResponse(error.message, CODE.INTERNAL_SERVER_ERROR)
            }
            console.error(error)
        }
    },

    async removeRoster(myLeagueId: string, myLeagueRosterId: string, user: Pick<DrizzleUser, 'id' | 'role'>): Promise<void> {
        try {
            if (!myLeagueId || !myLeagueRosterId) {
              throw new ErrorResponse(transl('error.no_id'), CODE.BAD_GATEWAY)
            }

            const [roster] = await db.select({ id: myLeagueRosters.id, ownerUserId: myLeagueTeams.ownerUserId }).from(myLeagueRosters).leftJoin(myLeagueTeams, eq(myLeagueRosters.leagueTeamId, myLeagueTeams.id)).where(and(eq(myLeagueTeams.leagueId, myLeagueId) ,eq(myLeagueRosters.id, myLeagueRosterId)))
            if (!roster) {
                throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
            }

            if (roster.ownerUserId !== user.id) {
                throw new ErrorResponse(RESPONSE.ERROR[401], CODE.UNAUTHORIZED)
            }

            await db.delete(myLeagueRosters).where(eq(myLeagueRosters.id, myLeagueRosterId))
        } catch (error) {
            if (error instanceof Error) {
                throw new ErrorResponse(error.message, CODE.INTERNAL_SERVER_ERROR)
            }
            console.error(error)
        }
    }
}
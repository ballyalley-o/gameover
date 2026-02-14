import { boolean } from 'drizzle-orm/pg-core';
import { db, GLOBAL } from 'gameover'
import { and, eq, ilike, isNull } from 'drizzle-orm'
import { myLeagueMembership, myLeagues, myLeagueTeams, users } from 'db/schema'
import { ErrorResponse } from 'middleware'
import type { DrizzleMyLeagueTeam, DrizzleUser, NewDrizzleMyLeagueTeam } from 'types/schema'
import { CODE, RESPONSE } from 'constant'
import { transl } from 'utility'

import { ensureLeague } from './membership.service'

export const ensureMyLeagueOwnerOrAdmin = async (userId: string): Promise<{ isAdmin: boolean, isOwner: boolean }> => {
    if (!userId) throw new ErrorResponse(transl('error.no_id'),  CODE.BAD_REQUEST)

    const [myLeague] = await db.select({ id: myLeagues.id, ownerUserId: myLeagues.ownerUserId, role: users.role }).from(myLeagues).leftJoin(users, eq(myLeagues.ownerUserId, users.id)).where(eq(myLeagues.ownerUserId, userId))

    if (!myLeague) {
        throw new ErrorResponse(RESPONSE.ERROR[403], CODE.FORBIDDEN)
    }

    let isAdmin = false
    let isOwner = false

    if (myLeague.ownerUserId === userId) {
        isOwner = true
    }

    if (myLeague.role === 'admin') {
        isAdmin = true
    }

    return { isAdmin, isOwner }
}

const TAG = 'MyLeagueTeam.Service'
export const myLeagueTeamService = {
    async list(myLeagueId: string, actorUser: Pick<DrizzleUser, 'id' | 'role'>, filters: MyLeagueTeamFilterType = {}): Promise<DrizzleMyLeagueTeam[] | undefined> {
        try {
            const conditions = [] as any[]

            const [myLeague] = await db.select({ id: myLeagues.id, ownerUserId:  myLeagues.ownerUserId }).from(myLeagues).where(eq(myLeagues.id, myLeagueId))
            const isOwner    = myLeague.ownerUserId === actorUser.id

            if (filters.name) {
                conditions.push(ilike(myLeagueTeams.name, `%${filters.name}`))
            }

            if (filters.key) {
                conditions.push(eq(myLeagueTeams.key, filters.key))
            }

            if (filters.city) {
                conditions.push(eq(myLeagueTeams.city, filters.city))
            }

            const where = conditions.length ? and(...conditions) : undefined
            return db.select().from(myLeagueTeams).where(where)
        } catch (error) {
            if (error instanceof Error) {
                throw new ErrorResponse(error.message, CODE.INTERNAL_SERVER_ERROR)
            }
            console.error(error)
        }
    },

    async listAvailableTeamAll(myLeagueId: string, actorUserId: string) {
        if (!myLeagueId || !actorUserId) {
        throw new ErrorResponse(transl('error.no_id'), CODE.BAD_REQUEST)
        }

        const [actorMembership] = await db
            .select({ status: myLeagueMembership.status })
            .from(myLeagueMembership)
            .where(and(eq(myLeagueMembership.leagueId, myLeagueId), eq(myLeagueMembership.userId, actorUserId)))

        if (actorMembership?.status !== 'accepted') {
            throw new ErrorResponse(RESPONSE.ERROR[403], CODE.FORBIDDEN)
        }

        const availableTeams = await db
        .select({
            id        : myLeagueTeams.id,
            key       : myLeagueTeams.key,
            name      : myLeagueTeams.name,
            city      : myLeagueTeams.city,
            baseTeamId: myLeagueTeams.baseTeamId
        })
        .from(myLeagueTeams)
        .where(and(
            eq(myLeagueTeams.leagueId, myLeagueId),
            isNull(myLeagueTeams.ownerUserId),
            eq(myLeagueTeams.isCpu, false)
        ))

      return availableTeams
    },

    async get(myLeagueId: string, myLeagueTeamId: string) {
        try {
            if (!myLeagueId || !myLeagueTeamId) {
                throw new ErrorResponse(transl('error.no_id'), CODE.BAD_REQUEST)
            }

            const myLeague = await ensureLeague(myLeagueId)
            if (!myLeague) {
                throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
            }

            const [myLeagueTeam] = await db.select().from(myLeagueTeams).where(and(eq(myLeagueTeams.leagueId, myLeagueId), eq(myLeagueTeams.id, myLeagueTeamId)))
            if (!myLeagueTeam) {
                throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
            }

            return myLeagueTeam
        } catch (error) {
            if (error instanceof Error) {
                throw new ErrorResponse(error.message, CODE.INTERNAL_SERVER_ERROR)
            }
            console.error(error)
        }
    },

    async selectTeam(myLeagueId: string, actorUserId: string, teamKey: string, myLeagueTeamId: string) {
        if (!myLeagueId || !actorUserId || !myLeagueTeamId) {
          throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
        }

        const [membership] = await db
          .select({ status: myLeagueMembership.status })
          .from(myLeagueMembership)
          .where(and(eq(myLeagueMembership.leagueId, myLeagueId), eq(myLeagueMembership.userId, actorUserId)))

        if (!membership || membership.status !== 'accepted') {
          throw new ErrorResponse(RESPONSE.ERROR[401], CODE.UNAUTHORIZED)
        }

        const [existingTeam] = await db
          .select({ id: myLeagueTeams.id })
          .from(myLeagueTeams)
          .where(and(eq(myLeagueTeams.leagueId, myLeagueId), eq(myLeagueTeams.ownerUserId, actorUserId)))

        if (existingTeam) {
          throw new ErrorResponse(transl('error.user_has_team'), CODE.CONFLICT)
        }

        const [team] = await db
          .select({ id: myLeagueTeams.id, ownerUserId: myLeagueTeams.ownerUserId, isCpu: myLeagueTeams.isCpu, teamKey: myLeagueTeams.key })
          .from(myLeagueTeams)
          .where(and(eq(myLeagueTeams.leagueId, myLeagueId), eq(myLeagueTeams.id, myLeagueTeamId)))

        if (!team) {
          throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
        }

        if (team.ownerUserId) {
          throw new ErrorResponse(transl('error.team_already_selected'), CODE.CONFLICT)
        }

        if (team.isCpu) {
          throw new ErrorResponse(transl('error.cpu_cannot_be_selected'), CODE.CONFLICT)
        }

        const [updated] = await db
          .update(myLeagueTeams)
          .set({ ownerUserId: actorUserId, updatedAt: new Date() })
          .where(
            and(
              eq(myLeagueTeams.leagueId, myLeagueId),
              eq(myLeagueTeams.id, myLeagueTeamId),
              eq(myLeagueTeams.key, teamKey),
              isNull(myLeagueTeams.ownerUserId),
              eq(myLeagueTeams.isCpu, false),
            ),
          )
          .returning()


        if (!updated) {
          throw new ErrorResponse(transl('error.team_already_selected'), CODE.CONFLICT)
        }

        return updated
    },

    async removeTeam(myLeagueId: string, myLeagueTeamId: string, user: Pick<DrizzleUser, 'id' | 'role'>): Promise<void> {
        try {
            if (!myLeagueId || !myLeagueTeamId) {
                throw new ErrorResponse(transl('error.no_id'), CODE.BAD_GATEWAY)
            }

            const [teamToRemove] = await db.select({ id: myLeagueTeams.id, ownerUserId: myLeagueTeams.ownerUserId }).from(myLeagueTeams).where(and(eq(myLeagueTeams.leagueId, myLeagueId) ,eq(myLeagueTeams.id, myLeagueTeamId)))
            if (!teamToRemove) {
                throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
            }
            const { isOwner, isAdmin } = await ensureMyLeagueOwnerOrAdmin(user.id)

            if ((teamToRemove.ownerUserId !== null || !isOwner) && !isAdmin) {
                throw new ErrorResponse(RESPONSE.ERROR[403], CODE.UNAUTHORIZED)
            }

            await db.delete(myLeagueTeams).where(eq(myLeagueTeams.id, myLeagueTeamId))
        } catch (error) {
            if (error instanceof Error) {
                throw new ErrorResponse(error.message, CODE.INTERNAL_SERVER_ERROR)
            }
            console.error(error)
        }
    }
}
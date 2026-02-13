import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from 'gameover'
import { ErrorResponse } from 'middleware'
import { CODE, RESPONSE } from 'constant'
import { myLeagues, myLeagueMembership, myLeagueTeams, users } from 'db/schema'
import { transl } from 'utility'

export async function ensureLeague<T extends SelectedFields<any, any> = {}>(myLeagueId: string, extendSelect?: T) {
  const [league] = await db
    .select({
      id           : myLeagues.id,
      ownerUserId  : myLeagues.ownerUserId,
      isPrivate    : myLeagues.isPrivate,
      maxUser      : myLeagues.maxUser,
      draftStartAt : myLeagues.draftStartAt,
      seasonStartAt: myLeagues.seasonStartAt,
      ...(extendSelect ?? {})
    })
    .from(myLeagues)
    .where(eq(myLeagues.id, myLeagueId))

  if (!league) {
    throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
  }

  return league
}

const _ensureCapacity = async (leagueId: string, maxUser?: number | null) => {
  if (!maxUser) return

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(myLeagueMembership)
    .where(and(eq(myLeagueMembership.leagueId, leagueId), eq(myLeagueMembership.status, 'accepted')))

  if (Number(row?.count ?? 0) >= maxUser) {
    throw new ErrorResponse(transl('error.league_full'), CODE.UNPROCESSABLE_ENTITY)
  }
}

export const myLeagueMembershipService = {
  async getMemberAll(myLeagueId: string, actorUserId: string, status: MyLeagueMembershipStatus = 'accepted') {
    if (!myLeagueId || !actorUserId) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }

    const league  = await ensureLeague(myLeagueId)
    const isOwner = league.ownerUserId === actorUserId

    const [actorMembership] = await db
      .select({ status: myLeagueMembership.status })
      .from(myLeagueMembership)
      .where(and(eq(myLeagueMembership.leagueId, myLeagueId), eq(myLeagueMembership.userId, actorUserId)))

    const isAcceptedMember = actorMembership?.status === 'accepted'
    if (!isOwner && !isAcceptedMember) {
      throw new ErrorResponse(RESPONSE.ERROR[403], CODE.FORBIDDEN)
    }
    const conditions = [eq(myLeagueMembership.leagueId, myLeagueId)]
    if (status) conditions.push(eq(myLeagueMembership.status, status))

    return db
      .select({
       membershipId  : myLeagueMembership.id,
       status        : myLeagueMembership.status,
       role          : myLeagueMembership.role,
       source        : myLeagueMembership.source,
       joinedAt      : myLeagueMembership.createdAt,
       userId        : users.id,
       firstname     : users.firstname,
       lastname      : users.lastname,
       username      : users.username,
       email         : users.email,
       userRole      : users.role,
       myLeagueTeamId: myLeagueTeams.id,
       teamKey       : myLeagueTeams.key,
       teamName      : myLeagueTeams.name,
       teamCity      : myLeagueTeams.city,
       baseTeamId    : myLeagueTeams.baseTeamId,
       isCpu         : myLeagueTeams.isCpu,
      })
      .from(myLeagueMembership)
      .leftJoin(users, eq(myLeagueMembership.userId, users.id))
      .leftJoin(
        myLeagueTeams,
        and(
          eq(myLeagueTeams.leagueId, myLeagueMembership.leagueId),
          eq(myLeagueTeams.ownerUserId, myLeagueMembership.userId)
        )
      )
      .where(and(...conditions))
  },
  async invite(leagueId: string, ownerUserId: string, userId: string) {
    if (!leagueId || !ownerUserId || !userId) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }

    const league = await ensureLeague(leagueId)
    if (league.ownerUserId !== ownerUserId) {
      throw new ErrorResponse(RESPONSE.ERROR[403], CODE.FORBIDDEN)
    }

    await _ensureCapacity(leagueId, league.maxUser)

    const [existing] = await db
      .select({ id: myLeagueMembership.id, status: myLeagueMembership.status })
      .from(myLeagueMembership)
      .where(and(eq(myLeagueMembership.leagueId, leagueId), eq(myLeagueMembership.userId, userId)))

    if (existing) {
      if (existing.status === 'declined' || existing.status === 'expired') {
        const [updated] = await db
          .update(myLeagueMembership)
          .set({ status: 'pending', source: 'invite', updatedAt: new Date() })
          .where(eq(myLeagueMembership.id, existing.id))
          .returning()
        return updated
      }
      throw new ErrorResponse(RESPONSE.ERROR.DOCUMENT_EXISTS, CODE.CONFLICT)
    }

    const [created] = await db
      .insert(myLeagueMembership)
      .values({
        leagueId,
        userId,
        role  : 'member',
        status: 'pending',
        source: 'invite',
      })
      .returning()

    return created
  },

  async requestJoin(leagueId: string, userId: string) {
    if (!leagueId || !userId) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }

    const league = await ensureLeague(leagueId)
    if (league.isPrivate) {
      throw new ErrorResponse(RESPONSE.ERROR[403], CODE.FORBIDDEN)
    }

    await _ensureCapacity(leagueId, league.maxUser)

    const [existing] = await db
      .select({ id: myLeagueMembership.id, status: myLeagueMembership.status })
      .from(myLeagueMembership)
      .where(and(eq(myLeagueMembership.leagueId, leagueId), eq(myLeagueMembership.userId, userId)))

    if (existing) {
      if (existing.status === 'declined' || existing.status === 'expired') {
        const [updated] = await db
          .update(myLeagueMembership)
          .set({ status: 'pending', source: 'request', updatedAt: new Date() })
          .where(eq(myLeagueMembership.id, existing.id))
          .returning()
        return updated
      }
      throw new ErrorResponse(RESPONSE.ERROR.DOCUMENT_EXISTS, CODE.CONFLICT)
    }

    const [created] = await db
      .insert(myLeagueMembership)
      .values({
        leagueId,
        userId,
        role  : 'member',
        status: 'pending',
        source: 'request'
      })
      .returning()

    return created
  },

  async list(leagueId: string, actorUserId: string, status?: MyLeagueMembershipStatus) {
    if (!leagueId || !actorUserId) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }

    const league = await ensureLeague(leagueId)
    if (league.ownerUserId !== actorUserId) {
      throw new ErrorResponse(RESPONSE.ERROR[403], CODE.FORBIDDEN)
    }

    const conditions = [eq(myLeagueMembership.leagueId, leagueId)]
    if (status) {
      conditions.push(eq(myLeagueMembership.status, status))
    }

    return db.select().from(myLeagueMembership).where(and(...conditions))
  },

  async respond(leagueId: string, membershipId: string, actorUserId: string, action: MyLeagueMembershipActionType) {
    if (!leagueId || !membershipId || !actorUserId) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }

    const [membership] = await db
      .select({
        id      : myLeagueMembership.id,
        userId  : myLeagueMembership.userId,
        source  : myLeagueMembership.source,
        status  : myLeagueMembership.status,
        leagueId: myLeagueMembership.leagueId,
      })
      .from(myLeagueMembership)
      .where(and(eq(myLeagueMembership.id, membershipId), eq(myLeagueMembership.leagueId, leagueId)))

    if (!membership) {
      throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
    }

    if (membership.status !== 'pending') {
      throw new ErrorResponse('Membership already processed', CODE.CONFLICT)
    }

    const league   = await ensureLeague(leagueId)
    const isOwner  = league.ownerUserId === actorUserId
    const isMember = membership.userId  === actorUserId

    if (membership.source === 'invite' && !isMember) {
      throw new ErrorResponse(RESPONSE.ERROR[403], CODE.FORBIDDEN)
    }

    if (membership.source === 'request' && !isOwner) {
      throw new ErrorResponse(RESPONSE.ERROR[403], CODE.FORBIDDEN)
    }

    if (membership.source === 'system') {
      throw new ErrorResponse(RESPONSE.ERROR[403], CODE.FORBIDDEN)
    }

    const nextStatus = action === 'accept' ? 'accepted' : 'declined'
    const [updated]  = await db
      .update(myLeagueMembership)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(myLeagueMembership.id, membership.id))
      .returning()

    return updated
  }
}

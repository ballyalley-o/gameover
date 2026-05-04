import { db, GLOBAL } from 'gameover'
import { and, eq, getTableColumns, ilike, isNull, or, sql } from 'drizzle-orm'
import { myLeagues, myLeagueMembership, myLeaguePlayers, myLeagueRosters, myLeagueTeams, players, teams, users } from 'db/schema'
import { ErrorResponse } from 'middleware'
import type { DrizzleMyLeague, DrizzleUser, NewDrizzleMyLeague } from 'types/schema'
import { CODE, RESPONSE } from 'constant'
import { toNumber, transl } from 'utility'

const POSITION_ORDER: PlayerPositionType[]       = ['PG', 'SG', 'SF', 'PF', 'C']
const DEFAULT_TARGETS: Record<PlayerPositionType, number> = { PG: 2, SG: 2, SF: 2, PF: 2, C: 2 }
const MAX_TEAMS_PER_LEAGUE                       = GLOBAL.MY_LEAGUE.MAX_TEAM_PER_LEAGUE

const _shuffle = <T,>(items: T[]): T[] => {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const _buildTeamKey = (raw: string, used: Set<string>): string => {
  const normalized = raw.replace(/[^A-Za-z]/g, '').toUpperCase()
  const base       = (normalized || 'MLG').slice(0, 3).padEnd(3, 'X')
  let   key        = base
  while (used.has(key)) {
    key = `${base.slice(0, 2)}${Math.floor(Math.random() * 10)}`
  }
  used.add(key)
  return key
}

const _resolveTargets = (options: DraftOptionType) => {
  const overrides = options.positionTargets ?? {}
  return POSITION_ORDER.reduce((acc, pos) => {
    acc[pos] = Math.max(0, Math.floor(overrides[pos] ?? DEFAULT_TARGETS[pos]))
    return acc
  }, {} as Record<PlayerPositionType, number>)
}

const _coerceDate = (value?: string | Date | null) => {
  if (value === undefined) return undefined
  if (value === null) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new ErrorResponse(transl('error.invalie_date_format'), CODE.BAD_REQUEST)
  }
  return date
}

const _validateSchedule = (draftStartAt?: Date | null, seasonStartAt?: Date | null) => {
  if (draftStartAt && seasonStartAt && draftStartAt > seasonStartAt) {
    throw new ErrorResponse('Draft start date must be before season start date', CODE.BAD_REQUEST)
  }
}

const _deriveStatus = (draftStartAt?: Date | null, seasonStartAt?: Date | null, currentStatus?: MyLeagueStatusType) => {
  if (currentStatus === 'finished') return currentStatus
  const now = new Date()
  if (seasonStartAt && now >= seasonStartAt) return 'active'
  if (draftStartAt && now >= draftStartAt) return 'locked'
  return 'pending'
}

const _pickPlayer = (
  available   : DraftPlayerType[],
  teamStars   : Map<string, number>,
  teamId      : string,
  maxStars    : Map<string, number>,
  position   ?: PlayerPositionType,
  variance    : number  = 4,
  strictStars : boolean = true,
) => {
  const starLimit  = maxStars.get(teamId) ?? 0
  const candidates = available.filter((player) => {
    if (position && !player.positions.includes(position)) return false
    if (!strictStars) return true
    if (!player.isStar) return true
    return (teamStars.get(teamId) ?? 0) < starLimit
  })

  if (!candidates.length) return undefined

  const sorted = [...candidates].sort((a, b) => b.overall - a.overall)
  const slice  = sorted.slice(0, Math.max(1, variance))
  const picked = slice[Math.floor(Math.random() * slice.length)]

  const pickedIndex = available.findIndex((player) => player.id === picked.id)
  if (pickedIndex >= 0) {
    available.splice(pickedIndex, 1)
  }

  if (picked.isStar) {
    teamStars.set(teamId, (teamStars.get(teamId) ?? 0) + 1)
  }

  return picked
}

const TAG = 'MyLeague.Service'
export const myLeagueService = {
  async ownerLeagueCount(user: DrizzleUser): Promise<number> {
    try {
      const [row] = await db.select({ count: sql<number>`count(*)`}).from(myLeagues).where(eq(myLeagues.ownerUserId, user.id))
      return Number(row?.count ?? 0)
    } catch (error) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }
  },

  async list(user: Pick<DrizzleUser, 'id' | 'role'>, filters: MyLeagueFilterType = {}): Promise<DrizzleMyLeague[]> {
    try {
      const conditions = [] as any[]
      const isAdmin    = (user as any)?.role === 'admin'
      if (!isAdmin) {
        conditions.push(or(eq(myLeagues.isPrivate, false), eq(myLeagues.ownerUserId, user?.id)))
      }

      if (filters.name) {
        conditions.push(ilike(myLeagues.name, `%${filters.name}%`))
      }

      const memberAgg = db.select({
        myLeagueId: myLeagueMembership.leagueId,
        members: sql`
          json_agg(
            json_build_object(
              'userId', ${users.id},
              'firstname', ${users.firstname},
              'username', ${users.username},
              'email', ${users.email}
            )
          ) filter (where ${myLeagueMembership.status} = 'accepted')
        `.as('members'),
        memberCount: sql`
          count(*) filter (where ${myLeagueMembership.status} = 'accepted')
        `.as('memberCount'),
      })
        .from(myLeagueMembership)
        .leftJoin(users, eq(myLeagueMembership.userId, users.id))
        .groupBy(myLeagueMembership.leagueId)
        .as('memberAgg')

      const where = conditions.length ? and(...conditions) : undefined

      return await db
        .select({ ...getTableColumns(myLeagues), memberCount: memberAgg.memberCount, members: memberAgg.members })
        .from(myLeagues)
        .leftJoin(memberAgg, eq(memberAgg.myLeagueId, myLeagues.id))
        .where(where)
    } catch (error) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }
  },

  async getById(myLeagueId: string): Promise<DrizzleMyLeague> {
    try {
      const memberAgg = db.select({ myLeagueId: myLeagueMembership.leagueId, memberCount: sql`count(*) filter (where ${myLeagueMembership.status} = 'accepted')`.as('memberCount') }).from(myLeagueMembership).groupBy(myLeagueMembership.leagueId).as('memberAgg')
      const [myLeague] = await db.select({ ...getTableColumns(myLeagues), memberCount: memberAgg.memberCount }).from(myLeagues).leftJoin(memberAgg, eq(memberAgg.myLeagueId, myLeagues.id)).where(eq(myLeagues.id, myLeagueId))

      if (!myLeague) {
        throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
      }
      return myLeague
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error
      }
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }
  },

  async getMyLeagueAll(ownerId: string): Promise<DrizzleMyLeague[]> {
    try {
      return await db.select().from(myLeagues).where(eq(myLeagues.ownerUserId, ownerId))
    } catch (error) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }
  },

  async create(payload: CreateMyLeaguePayloadType) {
    const {
      name,
      isPrivate,
      includeBaseTeams = true,
      teamCount,
      ownerTeam,
      ownerUserId,
      draftStartAt,
      seasonStartAt,
    } = payload
    if (!name) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }

    if (ownerTeam && !ownerTeam.teamId && !ownerTeam.teamKey) {
      throw new ErrorResponse(RESPONSE.ERROR[422], CODE.UNPROCESSABLE_ENTITY)
    }

    const draftDate  = _coerceDate(draftStartAt)
    const seasonDate = _coerceDate(seasonStartAt)
    _validateSchedule(draftDate, seasonDate)

    const status = _deriveStatus(draftDate ?? undefined, seasonDate ?? undefined)

    const [league] = await db
        .insert(myLeagues)
        .values({ name, ownerUserId, isPrivate, draftStartAt: draftDate, seasonStartAt: seasonDate, status })
        .returning()

    if (ownerUserId) {
      await db
        .insert(myLeagueMembership)
        .values({
          leagueId: league.id,
          userId  : ownerUserId,
          role    : 'owner',
          status  : 'accepted',
          source  : 'system',
        })
        .onConflictDoNothing({ target: [myLeagueMembership.leagueId, myLeagueMembership.userId] })
    }

    const teamSelect = {
      id             : teams.id,
      city           : teams.city,
      name           : teams.name,
      key            : teams.key,
      conference     : teams.conference,
      division       : teams.division,
      primaryColor   : teams.primaryColor,
      secondaryColor : teams.secondaryColor,
      tertiaryColor  : teams.tertiaryColor,
      quaternaryColor: teams.quaternaryColor,
      logoUrl        : teams.logoUrl,
      wordmarkUrl    : teams.wordmarkUrl,
    }

    const ownerTeamRows =
      ownerTeam?.teamId || ownerTeam?.teamKey
        ? await db
            .select(teamSelect)
            .from(teams)
            .where(ownerTeam?.teamId ? eq(teams.teamId, ownerTeam.teamId) : eq(teams.key, String(ownerTeam?.teamKey ?? '').toUpperCase()))
        : []

    const ownerTeamRecord = ownerTeamRows[0]
    if (ownerTeam && !ownerTeamRecord) {
      throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)
    }

    const baseTeams      = includeBaseTeams ? await db.select(teamSelect).from(teams) : []
    const ownerTeamCount = ownerTeam ? 1 : 0
    const maxBaseTeams   = Math.max(0, MAX_TEAMS_PER_LEAGUE - ownerTeamCount)

    if (teamCount && teamCount > MAX_TEAMS_PER_LEAGUE) {
      throw new ErrorResponse(transl('error.max_count_per_myleague', { count: MAX_TEAMS_PER_LEAGUE }), CODE.UNPROCESSABLE_ENTITY)
    }

    const basePool = ownerTeamRecord ? baseTeams.filter((team) => team.id !== ownerTeamRecord.id) : baseTeams

    const totalAvailable = basePool.length + ownerTeamCount
    const desiredTotal   = Math.min(teamCount ?? totalAvailable, MAX_TEAMS_PER_LEAGUE)

    if (!includeBaseTeams && desiredTotal > ownerTeamCount) {
      throw new ErrorResponse('includeBaseTeams=false cannot exceed owner team count', CODE.UNPROCESSABLE_ENTITY)
    }

    const targetBaseCount   = includeBaseTeams ? Math.min(basePool.length, Math.max(0, desiredTotal - ownerTeamCount)) : 0
    const selectedBaseTeams = includeBaseTeams ? _shuffle(basePool).slice(0, targetBaseCount) : []

    const usedKeys = new Set(selectedBaseTeams.map((team) => team.key))
    const teamRows: Array<typeof myLeagueTeams.$inferInsert> = selectedBaseTeams.map((team) => ({
      leagueId       : league.id,
      baseTeamId     : team.id,
      ownerUserId    : null,
      city           : team.city,
      name           : team.name,
      key            : team.key,
      conference     : team.conference,
      division       : team.division,
      primaryColor   : team.primaryColor,
      secondaryColor : team.secondaryColor,
      tertiaryColor  : team.tertiaryColor,
      quaternaryColor: team.quaternaryColor,
      logoUrl        : team.logoUrl,
      wordmarkUrl    : team.wordmarkUrl,
    }))

    if (ownerTeamRecord) {
      const key = usedKeys.has(ownerTeamRecord.key) ? _buildTeamKey(ownerTeamRecord.key, usedKeys) : ownerTeamRecord.key
      usedKeys.add(key)
      teamRows.push({
        leagueId       : league.id,
        baseTeamId     : ownerTeamRecord.id,
        ownerUserId    : ownerUserId ?? null,
        city           : ownerTeamRecord.city,
        name           : ownerTeamRecord.name,
        key            ,
        conference     : ownerTeamRecord.conference,
        division       : ownerTeamRecord.division,
        primaryColor   : ownerTeamRecord.primaryColor ?? null,
        secondaryColor : ownerTeamRecord.secondaryColor ?? null,
        tertiaryColor  : ownerTeamRecord.tertiaryColor ?? null,
        quaternaryColor: ownerTeamRecord.quaternaryColor ?? null,
        logoUrl        : ownerTeamRecord.logoUrl ?? null,
        wordmarkUrl    : ownerTeamRecord.wordmarkUrl ?? null,
      })
    }

    if (teamRows.length > MAX_TEAMS_PER_LEAGUE) {
      throw new ErrorResponse(`Max ${MAX_TEAMS_PER_LEAGUE} teams per league`, CODE.UNPROCESSABLE_ENTITY)
    }

    if (!teamRows.length && !ownerTeamRecord) {
      throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
    }

    const insertedTeams = await db.insert(myLeagueTeams).values(teamRows).returning({ id: myLeagueTeams.id })

    const basePlayers = await db
      .select({
        id          : players.id,
        playerId    : players.playerId,
        firstname   : players.firstname,
        lastname    : players.lastname,
        archetype   : players.archetype,
        positions   : players.positions,
        status      : players.status,
        heightInches: players.heightInches,
        weightLbs   : players.weightLbs,
        overall     : players.overall,
        offense     : players.offense,
        defense     : players.defense,
        rebounding  : players.rebounding,
        passing     : players.passing,
        iq          : players.iq,
        pace        : players.pace,
        clutch      : players.clutch,
        stamina     : players.stamina,
        salary      : players.salary,
        injuryRisk  : players.injuryRisk,
      })
      .from(players)

    if (!basePlayers.length) {
      throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
    }

    const leaguePlayers = basePlayers.map((player) => ({
      leagueId    : league.id,
      basePlayerId: player.id,
      playerId    : player.playerId,
      firstname   : player.firstname,
      lastname    : player.lastname,
      archetype   : player.archetype,
      positions   : player.positions,
      status      : player.status,
      heightInches: player.heightInches,
      weightLbs   : player.weightLbs,
      overall     : player.overall,
      offense     : player.offense,
      defense     : player.defense,
      rebounding  : player.rebounding,
      passing     : player.passing,
      iq          : player.iq,
      pace        : player.pace,
      clutch      : player.clutch,
      stamina     : player.stamina,
      salary      : player.salary,
      injuryRisk  : player.injuryRisk,
    }))

    const insertedPlayers = await db.insert(myLeaguePlayers).values(leaguePlayers).returning({ id: myLeaguePlayers.id })

    return {
      league,
      teamsInserted  : insertedTeams.length,
      playersInserted: insertedPlayers.length,
    }
  },

  async updateMyLeague(myLeagueId: string, data: Partial<NewDrizzleMyLeague>): Promise<DrizzleMyLeague> {
    if (!myLeagueId || !data) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }

    const [existingMyLeague] = await db.select({ id: myLeagues.id, draftStartAt: myLeagues.draftStartAt, seasonStartAt: myLeagues.seasonStartAt, status: myLeagues.status }).from(myLeagues).where(eq(myLeagues.id, myLeagueId))
    if (!existingMyLeague) throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)

    const draftDate       = _coerceDate(data.draftStartAt as string | Date | null | undefined)
    const seasonDate      = _coerceDate(data.seasonStartAt as string | Date | null | undefined)
    const finalDraftDate  = draftDate  === undefined ? existingMyLeague.draftStartAt : draftDate
    const finalSeasonDate = seasonDate === undefined ? existingMyLeague.seasonStartAt : seasonDate
    _validateSchedule(finalDraftDate ?? undefined, finalSeasonDate ?? undefined)

    const updates: Partial<NewDrizzleMyLeague> = { ...data }
    if (draftDate !== undefined) updates.draftStartAt = draftDate as any
    if (seasonDate !== undefined) updates.seasonStartAt = seasonDate as any
    if (data.status === undefined && (draftDate !== undefined || seasonDate !== undefined)) {
      updates.status = _deriveStatus(finalDraftDate ?? undefined, finalSeasonDate ?? undefined, existingMyLeague.status)
    }

    const [updatedMyLeague] = await db.update(myLeagues).set(updates).where(eq(myLeagues.id, myLeagueId)).returning()
    if (!updatedMyLeague) {
      throw new ErrorResponse(transl('error.failed_update'), CODE.BAD_REQUEST)
    }

    return updatedMyLeague
  },

  async draft(leagueId: string, options: DraftOptionType = {}) {
    if (!leagueId) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }
    // const [myLeague]    = await db.select({ id: myLeagues.id, draftStartAt: myLeagues.draftStartAt, seasonStartAt: myLeagues.seasonStartAt }).from(myLeagues).where(eq(myLeagues.id, leagueId))

    // const now = new Date()
    // if (myLeague.draftStartAt !== null && myLeague.draftStartAt >= now) {
    //   throw new ErrorResponse(transl('error.draft_already_started'), CODE.BAD_REQUEST)
    // }

    const leagueTeams = await db.select({ id: myLeagueTeams.id }).from(myLeagueTeams).where(eq(myLeagueTeams.leagueId, leagueId))

    if (!leagueTeams.length) {
      throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
    }

    const unassignedMembers = await db
      .select({ userId: myLeagueMembership.userId })
      .from(myLeagueMembership)
      .leftJoin(
        myLeagueTeams,
        and(
          eq(myLeagueTeams.leagueId, myLeagueMembership.leagueId),
          eq(myLeagueTeams.ownerUserId, myLeagueMembership.userId)
        )
      )
      .where(and(
        eq(myLeagueMembership.leagueId, leagueId),
        eq(myLeagueMembership.status, 'accepted'),
        isNull(myLeagueTeams.id)
      ))

    // any invitation that is pending will be deleted when draft starts
    if (unassignedMembers.length) {
      throw new ErrorResponse(transl('error.user_select_team_required'), CODE.UNPROCESSABLE_ENTITY)
    }

    if (leagueTeams.length > MAX_TEAMS_PER_LEAGUE) {
      throw new ErrorResponse(`Max ${MAX_TEAMS_PER_LEAGUE} teams per league`, CODE.UNPROCESSABLE_ENTITY)
    }

    const leaguePlayers = await db
      .select({
        id       : myLeaguePlayers.id,
        positions: myLeaguePlayers.positions,
        overall  : myLeaguePlayers.overall,
      })
      .from(myLeaguePlayers)
      .where(eq(myLeaguePlayers.leagueId, leagueId))

    if (!leaguePlayers.length) {
      throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
    }

    const teamCount = leagueTeams.length
    const targets   = _resolveTargets(options)
    const required  = POSITION_ORDER.reduce((sum, pos) => sum + targets[pos], 0)

    let rosterSize = Math.max(1, Math.floor(options.rosterSize ?? 12))
    if (rosterSize < required) {
      rosterSize = required
    }
    const flexSlots = rosterSize - required

    if (leaguePlayers.length < rosterSize * teamCount) {
      throw new ErrorResponse(RESPONSE.ERROR[422], CODE.UNPROCESSABLE_ENTITY)
    }

    const starThreshold   = Math.max(0, Math.floor(options.starThreshold ?? 90))
    const maxStarsPerTeam = Math.max(0, Math.floor(options.maxStarsPerTeam ?? 1))

    const available: DraftPlayerType[] = leaguePlayers.map((player) => ({
      id       : player.id,
      positions: player.positions ?? [],
      overall  : toNumber(player.overall),
      isStar   : toNumber(player.overall) >= starThreshold,
    }))

    const starPoolCount     = available.filter((player) => player.isStar).length
    const defaultBonusTeams = Math.max(0, Math.floor(teamCount * 0.2))
    const bonusTeams        = Math.min(
      Math.max(0, Math.floor(options.bonusStarTeams ?? defaultBonusTeams)),
      teamCount,
      Math.max(0, starPoolCount - maxStarsPerTeam * teamCount)
    )
    const bonusTeamIds = new Set(
      _shuffle(leagueTeams)
        .slice(0, bonusTeams)
        .map((team) => team.id)
    )

    const teamStars      = new Map<string, number>()
    const teamStarLimits = new Map<string, number>()

    for (const team of leagueTeams) {
      teamStars.set(team.id, 0)
      teamStarLimits.set(team.id, maxStarsPerTeam + (bonusTeamIds.has(team.id) ? 1 : 0))
    }

    const variance = Math.max(1, Math.floor(options.draftVariance ?? 4))
    // create interface/type for this
    const rosterRows: Array<{
      leagueId      : string
      leagueTeamId  : string
      leaguePlayerId: string
      draftRound    : number
      draftPick     : number
    }> = []

    let pickNumber = 1
    const addPick = (teamId: string, playerId: string) => {
      rosterRows.push({
        leagueId,
        leagueTeamId  : teamId,
        leaguePlayerId: playerId,
        draftRound    : Math.ceil(pickNumber / teamCount),
        draftPick     : pickNumber
      })

      pickNumber += 1
    }

    const pickWithFallback = (teamId: string, position?: PlayerPositionType) => {
      return (
        _pickPlayer(available, teamStars, teamId, teamStarLimits, position, variance, true) ??
        _pickPlayer(available, teamStars, teamId, teamStarLimits, position, variance, false) ??
        _pickPlayer(available, teamStars, teamId, teamStarLimits, undefined, variance, true) ??
        _pickPlayer(available, teamStars, teamId, teamStarLimits, undefined, variance, false)
      )
    }

    // Fill required position slots first, then add flex slots.
    for (const position of POSITION_ORDER) {
      for (let round = 0; round < targets[position]; round += 1) {
        for (const team of _shuffle(leagueTeams)) {
          const player = pickWithFallback(team.id, position)
          if (player) addPick(team.id, player.id)
        }
      }
    }

    for (let round = 0; round < flexSlots; round += 1) {
      for (const team of _shuffle(leagueTeams)) {
        const player = pickWithFallback(team.id)
        if (player) addPick(team.id, player.id)
      }
    }

    const result = await db.transaction(async (tx) => {
      await tx.delete(myLeagueRosters).where(eq(myLeagueRosters.leagueId, leagueId))
      if (rosterRows.length) {
        await tx.insert(myLeagueRosters).values(rosterRows)
      }
      return rosterRows.length
    })

    return {
      leagueId,
      teams: teamCount,
      rosterSize,
      drafted       : result,
      unassigned    : Math.max(0, leaguePlayers.length - result),
      bonusStarTeams: bonusTeams,
    }
  },

  async updateMyLeagueById(myLeagueId: string, data: Partial<DrizzleMyLeague>) {
    try {
      if (!myLeagueId) {
        throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
      }

      const [myLeagueExist] = await db.select({ id: myLeagues.id, draftStartAt: myLeagues.draftStartAt, seasonStartAt: myLeagues.seasonStartAt, status: myLeagues.status }).from(myLeagues).where(eq(myLeagues.id, myLeagueId))
      if (!myLeagueExist) {
        throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
      }

      const { id, ownerUserId, createdAt, updatedAt, ...restOfUpdates } = (data ?? {}) as any

      const draftDate       = _coerceDate(restOfUpdates.draftStartAt)
      const seasonDate      = _coerceDate(restOfUpdates.seasonStartAt)
      const finalDraftDate  = draftDate  === undefined ? myLeagueExist.draftStartAt : draftDate
      const finalSeasonDate = seasonDate === undefined ? myLeagueExist.seasonStartAt : seasonDate

      _validateSchedule(finalDraftDate ?? undefined, finalSeasonDate ?? undefined)

      const cleanUpdates = Object.fromEntries(Object.entries(restOfUpdates).filter(([, v]) => v !== undefined)) as Partial<DrizzleMyLeague>
      if (draftDate !== undefined) cleanUpdates.draftStartAt = draftDate as any
      if (seasonDate !== undefined) cleanUpdates.seasonStartAt = seasonDate as any
      if (restOfUpdates.status === undefined && (draftDate !== undefined || seasonDate !== undefined)) {
        cleanUpdates.status = _deriveStatus(finalDraftDate ?? undefined, finalSeasonDate ?? undefined, myLeagueExist.status)
      }

      const [updatedMyLeague] = await db
        .update(myLeagues)
        .set({ ...cleanUpdates, updatedAt: new Date() } as any)
        .where(eq(myLeagues.id, myLeagueId))
        .returning()

      if (!updatedMyLeague) {
        throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)
      }

      return updatedMyLeague
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error
      }
      throw new ErrorResponse(RESPONSE.ERROR[500], CODE.INTERNAL_SERVER_ERROR)
    }
  },

  async remove(myLeagueId: string, actorUser: Partial<DrizzleUser>): Promise<void> {
    try {
      if (!myLeagueId || !actorUser?.id) {
        throw new ErrorResponse(transl('error.no_id'), CODE.BAD_REQUEST)
      }

      const [myLeague] = await db.select({ id: myLeagues.id, ownerUserId: myLeagues.ownerUserId }).from(myLeagues).where(eq(myLeagues.id, myLeagueId))

      const isAdmin = actorUser?.role === 'admin'
      const isOwner = actorUser?.id   === myLeague.ownerUserId
      if (!isAdmin || !isOwner) {
        throw new ErrorResponse(RESPONSE.ERROR[403], CODE.UNAUTHORIZED)
      }

      await db.delete(myLeagues).where(eq(myLeagues.id, myLeagueId))
    } catch (error) {
      throw new ErrorResponse((error as ErrorResponse)?.message, CODE.INTERNAL_SERVER_ERROR, CODE.INTERNAL_SERVER_ERROR)
    }
  },

   async removeAll(): Promise<void> {
    try {
      await db.delete(myLeagues)
    } catch (error) {
      throw new ErrorResponse((error as ErrorResponse)?.message, CODE.INTERNAL_SERVER_ERROR, CODE.INTERNAL_SERVER_ERROR)
    }
  }
}

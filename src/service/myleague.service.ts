import { db } from 'gameover'
import { eq } from 'drizzle-orm'
import { myLeagues, myLeaguePlayers, myLeagueRosters, myLeagueTeams, players, teams } from 'db/schema'
import { ErrorResponse } from 'middleware'
import { CODE, RESPONSE } from 'constant'


const POSITION_ORDER: PlayerPositionType[]       = ['PG', 'SG', 'SF', 'PF', 'C']
const DEFAULT_TARGETS: Record<PlayerPositionType, number> = { PG: 2, SG: 2, SF: 2, PF: 2, C: 2 }
const MAX_TEAMS_PER_LEAGUE                       = 30

const toNumber = (value: number | null | undefined) => (typeof value === 'number' ? value : 0)

const shuffle = <T,>(items: T[]): T[] => {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const buildTeamKey = (raw: string, used: Set<string>): string => {
  const normalized = raw.replace(/[^A-Za-z]/g, '').toUpperCase()
  const base       = (normalized || 'MLG').slice(0, 3).padEnd(3, 'X')
  let   key        = base
  while (used.has(key)) {
    key = `${base.slice(0, 2)}${Math.floor(Math.random() * 10)}`
  }
  used.add(key)
  return key
}

const resolveTargets = (options: DraftOptionType) => {
  const overrides = options.positionTargets ?? {}
  return POSITION_ORDER.reduce((acc, pos) => {
    acc[pos] = Math.max(0, Math.floor(overrides[pos] ?? DEFAULT_TARGETS[pos]))
    return acc
  }, {} as Record<PlayerPositionType, number>)
}

const pickPlayer = (
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

export const myLeagueService = {
  async create(payload: CreateMyLeaguePayloadType) {
    const { name, ownerUserId, includeBaseTeams = true, teamCount, ownerTeam } = payload
    if (!name) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }

    const [league] = await db.insert(myLeagues).values({ name, ownerUserId }).returning()

    const baseTeams = includeBaseTeams
      ? await db
          .select({
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
          })
          .from(teams)
      : []

    const ownerTeamCount = ownerTeam ? 1 : 0
    const maxBaseTeams   = Math.max(0, MAX_TEAMS_PER_LEAGUE - ownerTeamCount)

    if (includeBaseTeams && teamCount && teamCount > maxBaseTeams) {
      throw new ErrorResponse(`Max ${maxBaseTeams} base teams per league`, CODE.UNPROCESSABLE_ENTITY)
    }

    const targetBaseCount = includeBaseTeams
      ? Math.min(teamCount ?? baseTeams.length, maxBaseTeams)
      : 0
    const selectedBaseTeams = includeBaseTeams
      ? shuffle(baseTeams).slice(0, targetBaseCount)
      : []

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

    if (ownerTeam) {
      if (!ownerTeam.city || !ownerTeam.name) {
        throw new ErrorResponse(RESPONSE.ERROR[422], CODE.UNPROCESSABLE_ENTITY)
      }

      const keySource = ownerTeam.key ?? `${ownerTeam.city}${ownerTeam.name}`
      const key       = buildTeamKey(keySource, usedKeys)
      teamRows.push({
        leagueId       : league.id,
        baseTeamId     : null,
        ownerUserId    : ownerUserId ?? null,
        city           : ownerTeam.city,
        name           : ownerTeam.name,
        key,
        conference     : ownerTeam.conference as ConferenceType,
        division       : ownerTeam.division as DivisionType,
        primaryColor   : ownerTeam.primaryColor ?? null,
        secondaryColor : ownerTeam.secondaryColor ?? null,
        tertiaryColor  : ownerTeam.tertiaryColor ?? null,
        quaternaryColor: ownerTeam.quaternaryColor ?? null,
        logoUrl        : ownerTeam.logoUrl ?? null,
        wordmarkUrl    : ownerTeam.wordmarkUrl ?? null,
      })
    }

    if (teamRows.length + ownerTeamCount > MAX_TEAMS_PER_LEAGUE) {
      throw new ErrorResponse(`Max ${MAX_TEAMS_PER_LEAGUE} teams per league`, CODE.UNPROCESSABLE_ENTITY)
    }

    if (!teamRows.length && !ownerTeam) {
      throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
    }

    const insertedTeams = await db.insert(myLeagueTeams).values(teamRows).returning({ id: myLeagueTeams.id })

    const basePlayers = await db
      .select({
        id         : players.id,
        playerId   : players.playerId,
        firstname  : players.firstname,
        lastname   : players.lastname,
        archetype  : players.archetype,
        positions  : players.positions,
        status     : players.status,
        heightInches: players.heightInches,
        weightLbs  : players.weightLbs,
        overall    : players.overall,
        offense    : players.offense,
        defense    : players.defense,
        rebounding : players.rebounding,
        passing    : players.passing,
        iq         : players.iq,
        pace       : players.pace,
        clutch     : players.clutch,
        stamina    : players.stamina,
        salary     : players.salary,
        injuryRisk : players.injuryRisk,
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

  async draft(leagueId: string, options: DraftOptionType = {}) {
    if (!leagueId) {
      throw new ErrorResponse(RESPONSE.ERROR[400], CODE.BAD_REQUEST)
    }

    const leagueTeams = await db
      .select({ id: myLeagueTeams.id })
      .from(myLeagueTeams)
      .where(eq(myLeagueTeams.leagueId, leagueId))

    if (!leagueTeams.length) {
      throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
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
    const targets   = resolveTargets(options)
    const required  = POSITION_ORDER.reduce((sum, pos) => sum + targets[pos], 0)

    let rosterSize = Math.max(1, Math.floor(options.rosterSize ?? 12))
    if (rosterSize < required) {
      rosterSize = required
    }
    const flexSlots = rosterSize - required

    if (leaguePlayers.length < rosterSize * teamCount) {
      throw new ErrorResponse(RESPONSE.ERROR[422], CODE.UNPROCESSABLE_ENTITY)
    }

    const starThreshold = Math.max(0, Math.floor(options.starThreshold ?? 90))
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
      Math.max(0, starPoolCount - maxStarsPerTeam * teamCount),
    )
    const bonusTeamIds = new Set(shuffle(leagueTeams).slice(0, bonusTeams).map((team) => team.id))

    const teamStars      = new Map<string, number>()
    const teamStarLimits = new Map<string, number>()
    for (const team of leagueTeams) {
      teamStars.set(team.id, 0)
      teamStarLimits.set(team.id, maxStarsPerTeam + (bonusTeamIds.has(team.id) ? 1 : 0))
    }

    const variance = Math.max(1, Math.floor(options.draftVariance ?? 4))
    const rosterRows: Array<{
      leagueId: string
      leagueTeamId: string
      leaguePlayerId: string
      draftRound: number
      draftPick: number
    }> = []

    let pickNumber = 1
    const addPick = (teamId: string, playerId: string) => {
      rosterRows.push({
        leagueId,
        leagueTeamId  : teamId,
        leaguePlayerId: playerId,
        draftRound    : Math.ceil(pickNumber / teamCount),
        draftPick     : pickNumber,
      })
      pickNumber += 1
    }

    const pickWithFallback = (teamId: string, position?: PlayerPositionType) => {
      return (
        pickPlayer(available, teamStars, teamId, teamStarLimits, position, variance, true) ??
        pickPlayer(available, teamStars, teamId, teamStarLimits, position, variance, false) ??
        pickPlayer(available, teamStars, teamId, teamStarLimits, undefined, variance, true) ??
        pickPlayer(available, teamStars, teamId, teamStarLimits, undefined, variance, false)
      )
    }

    // Fill required position slots first, then add flex slots.
    for (const position of POSITION_ORDER) {
      for (let round = 0; round < targets[position]; round += 1) {
        for (const team of shuffle(leagueTeams)) {
          const player = pickWithFallback(team.id, position)
          if (player) addPick(team.id, player.id)
        }
      }
    }

    for (let round = 0; round < flexSlots; round += 1) {
      for (const team of shuffle(leagueTeams)) {
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
      teams     : teamCount,
      rosterSize,
      drafted   : result,
      unassigned: Math.max(0, leaguePlayers.length - result),
      bonusStarTeams: bonusTeams,
    }
  },
}

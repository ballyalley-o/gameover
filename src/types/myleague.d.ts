declare type OwnerTeamInputType = {
  city            : string
  name            : string
  key            ?: string
  conference     ?: string | null
  division       ?: string | null
  primaryColor   ?: string | null
  secondaryColor ?: string | null
  tertiaryColor  ?: string | null
  quaternaryColor?: string | null
  logoUrl        ?: string | null
  wordmarkUrl    ?: string | null
}

declare type CreateMyLeaguePayloadType = {
  name             : string
  ownerUserId     ?: string
  includeBaseTeams?: boolean
  teamCount       ?: number
  ownerTeam       ?: OwnerTeamInputType
}

declare type DraftOptionType = {
  rosterSize     ?: number
  positionTargets?: Partial<Record<PlayerPositionType, number>>
  starThreshold  ?: number
  maxStarsPerTeam?: number
  bonusStarTeams ?: number
  draftVariance  ?: number
}

declare type DraftPlayerType = {
  id       : string
  overall  : number
  positions: PlayerPositionType[]
  isStar   : boolean
}

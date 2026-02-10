declare type MyLeagueFilter = {
  name?: string
}

declare type MyLeagueTeamFilter = {
  name?: string
  key ?: string
  city?: string
}

declare type OwnerTeamInputType = {
  teamId ?: string
  teamKey?: string
}

declare type CreateMyLeaguePayloadType = {
  name             : string
  ownerUserId     ?: string
  isPrivate       ?: boolean
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

declare type MyLeagueMembershipRole       = 'owner' | 'member'
declare type MyLeagueMembershipStatus     = 'pending' | 'accepted' | 'declined' | 'expired'
declare type MyLeagueMembershipSource     = 'invite' | 'request' | 'system'
declare type MyLeagueMembershipActionType = 'accept' | 'decline'
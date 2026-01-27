export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

export type Archetype =
  | 'playmaker'
  | 'sharpshooter'
  | 'slasher'
  | 'two_way'
  | 'rim_protector'
  | 'stretch_big'
  | 'rebounder'
  | 'utility'

export type StyleTagType = 'pace' | 'defense' | 'spacing' | 'iso' | 'motion' | 'switchable' | 'half_court' | 'transition'

export interface Ratings {
  overall   ?: number
  offense   ?: number
  defense   ?: number
  rebounding?: number
  passing   ?: number
  iq        ?: number
  pace      ?: number
  clutch    ?: number
  stamina   ?: number
}

export interface Player {
  id           : string
  name         : string
  positions    : PlayerPositionType[]
  archetype    : Archetype
  heightInches?: number
  weightLbs   ?: number
  ratings      : Ratings
  pace        ?: number
  injuryRisk  ?: 'low' | 'medium' | 'high'
}

export interface Team {
  id          : string
  ownerUserId?: string | null
  name        : string
  market     ?: string
  styleTags  ?: StyleTagType[]
}

export interface RosterEntry {
  id          : string
  teamId      : string
  playerId    : string
  contractYrs?: number
  salary     ?: number
  isActive   ?: boolean
}

export interface LineupSlot {
  position  : PlayerPositionType
  playerId  : string
  minutesPct: number
}

export interface Lineup {
  id        : string
  teamId    : string
  name      : string
  slots     : LineupSlot[]
  pacePref ?: number
  styleTags?: StyleTagType[]
}

export interface ChemistryLink {
  id        : string
  playerAId : string
  playerBId : string
  score     : number
  reason   ?: string
}

export interface LineupMetric {
  id        : string
  lineupId  : string
  overall   : number
  offense   : number
  defense   : number
  rebounding: number
  pace      : number
  chemistry : number
  computedAt: Date
}

export type GameStatus = 'scheduled' | 'completed' | 'simulated'

export interface Game {
  id           : string
  homeTeamId   : string
  awayTeamId   : string
  homeLineupId?: string
  awayLineupId?: string
  homeScore    : number
  awayScore    : number
  status       : GameStatus
  simSeed     ?: number
  playedAt    ?: Date
}

export interface GameEvent {
  id       : string
  gameId   : string
  clockSec : number
  teamId   : string
  playerId?: string
  type     : 'score' | 'foul' | 'turnover' | 'rebound' | 'assist' | 'block' | 'steal'
  value   ?: number
  note    ?: string
}

export interface SimulationInput {
  homeLineupId : string
  awayLineupId : string
  seed?        : number
  paceAdjust  ?: number
}

export interface SimulationResult {
  game     : Game
  breakdown: {
    home: LineupMetric
    away: LineupMetric
  }
  events?: GameEvent[]
}

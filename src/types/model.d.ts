declare global {
    namespace Mongoose {
       interface Schema {
         Types: {
           ObjectId: any
         }
       }
    }
}

declare type IndexType<T extends Record<string, number>> = {
    [K in typeof T]: IndexDirection }

declare type Role                 = 'user' | 'admin'
declare type ArchetypeType        = 'playmaker' | 'sharpshooter' | 'slasher' | 'two_way' | 'rim_protector' | 'stretch_big' | 'rebounder' | 'utility' | 'unknown'
declare type PlayerPositionType   = 'PG' | 'SG' | 'SF' | 'PF' | 'C'
declare type ConferenceType       = 'Eastern' | 'Western'
declare type DivisionType         = 'Southeast' | 'Central' | 'Atlantic' | 'Southwest' | 'Northwest' | 'Pacific'
declare type PasswordStrengthType = 'weak' | 'medium' | 'strong'

declare type PlayerStatsType = {
  points                       : number
  assists                      : number
  rebounds                     : number
  offensiveRebounds            : number
  defensiveRebounds            : number
  steals                       : number
  blockedShots                 : number
  turnovers                    : number
  minutes                      : number
  trueShootingPercentage       : number
  effectiveFieldGoalsPercentage: number
  usageRatePercentage          : number
  playerEfficiencyRating       : number
  assistsPercentage            : number
  plusMinus                    : number
  games                        : number
}

declare type PlayerRatingType = {
  positions ?: string[] | null
  overall   ?: number | null
  offense   ?: number | null
  defense   ?: number | null
  rebounding?: number | null
  passing   ?: number | null
  iq        ?: number | null
  pace      ?: number | null
  clutch    ?: number | null
  stamina   ?: number | null
}
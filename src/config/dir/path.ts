import { GLOBAL } from 'config/global'
import { combine } from 'utility'

export const MODULE = {
  AUTH     : 'auth',
  USER     : 'user',
  NBA      : 'nba',
  FEED     : 'feed',
  GAME     : 'game',
  MY_LEAGUE: 'myleague'
}

export const PATH_PARAM = {
  ROOT       : '/',
  ALL        : 'all',
  API        : 'api',
  ID         : ':id',
  PLAYER_ID  : ':playerId',
  TEAM_ID    : ':teamId',
  TEAM_KEY   : ':teamKey',
  // modules
  AUTH: 'auth',
  FEED: 'feed',
  NBA : 'nba',
  USER: 'user',
  GAME: 'game',
  // auth
  ACCOUNT : 'account',
  SIGN_IN : 'sign-in',
  SIGN_OUT: 'sign-out',
  SIGN_UP : 'sign-up',
  // nba
  ARCHETYPE    : 'archetype',
  AVAILABLE    : 'available',
  BULK         : 'bulk',
  CLASSIFY     : 'classify',
  CONTRACT     : 'contract',
  CREATE_LITE  : 'create-lite',
  EXECUTE      : 'execute',
  DRAFT        : 'draft',
  INVITE       : 'invite',
  HISTORY      : 'history',
  JSON         : 'json',
  LINEUP       : 'lineup',
  MY_LEAGUE    : 'myleague',
  MEMBER       : 'member',
  MEMBERSHIP   : 'membership',
  METRIC       : 'metric',
  OWNER        : 'owner',
  PLAYER       : 'player',
  PREVIEW      : 'preview',
  REQUEST      : 'request',
  SEED         : 'seed',
  SIM          : 'sim',
  STATS        : 'stats',
  SUGGEST      : 'suggest',
  SYNC         : 'sync',
  LEAGUE_ID    : ':leagueId',
  MEMBERSHIP_ID: ':membershipId',
  MY_LEAGUE_ID : ':myLeagueId',
  TEAM         : 'team',
  TRADE        : 'trade',
  ROSTER       : 'roster',
  ACCEPT       : 'accept',
  DECLINE      : 'decline'
} as const

type PathParamType = (typeof PATH_PARAM)[keyof typeof PATH_PARAM]

const _trim = (s: string) => s.replace(/^\/+|\/+$/g, '')
export const combinePathParam = (...parts: PathParamType[]): string => {
  const joined = parts.map(_trim).filter(Boolean).join(PATH_PARAM.ROOT)
  return `${PATH_PARAM.ROOT}${joined}`
}

export const PATH_DIR = {
  API_WELCOME: combine(PATH_PARAM.API, GLOBAL.API_VERSION),
  ID         : combinePathParam(':id'),
  ROOT       : combinePathParam('/'),
  ACCOUNT    : combinePathParam('account'),
  SIGN_IN    : combinePathParam('sign-in'),
  SIGN_OUT   : combinePathParam('sign-out'),
  SIGN_UP    : combinePathParam('sign-up'),
}

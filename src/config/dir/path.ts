import { GLOBAL } from 'config/global'
import { combine } from 'utility'

export const MODULE = {
  AUTH: 'auth',
  USER: 'user',
  NBA : 'nba',
  FEED: 'feed',
  GAME: 'game',
}

export const PATH_PARAM = {
  ROOT       : '/',
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
  ARCHETYPE   : 'archetype',
  BULK        : 'bulk',
  CLASSIFY    : 'classify',
  CONTRACT    : 'contract',
  CREATE_BASIC: 'create-basic',
  EXECUTE     : 'execute',
  JSON        : 'json',
  LINEUP      : 'lineup',
  METRIC      : 'metric',
  PLAYER      : 'player',
  PREVIEW     : 'preview',
  SEED        : 'seed',
  SIM         : 'sim',
  STATS       : 'stats',
  SUGGEST     : 'suggest',
  SYNC        : 'sync',
  TEAM        : 'team',
  TRADE       : 'trade',
  ROSTER      : 'roster'
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
import { GLOBAL } from 'config/global'
import { combine } from 'utility'

export const API = '/api'
export const ID = '/:id'
export const ROOT = '/'

export const MODULE = {
  AUTH: 'auth',
  USER: 'user',
  NBA : 'nba',
  FEED: 'feed'
}

const AUTH = {
  ACCOUNT : '/account',
  SIGN_IN : '/sign-in',
  SIGN_OUT: '/sign-out',
  SIGN_UP : '/sign-up',
}

export const PATH_DIR = {
  ACCOUNT    : combine(AUTH.ACCOUNT),
  API_WELCOME: combine(API, GLOBAL.API_VERSION),
  ID         : combine(ID),
  ROOT       : combine(ROOT),
  SIGN_IN    : combine(AUTH.SIGN_IN),
  SIGN_OUT   : combine(AUTH.SIGN_OUT),
  SIGN_UP    : combine(AUTH.SIGN_UP)
}
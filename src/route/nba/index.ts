import { Application, Router } from 'express'
import { MODULE, PATH_PARAM } from 'config/dir'
import { combine } from 'utility'

import teamRoute from './team'
import playerRoute from './player'
import lineupRoute from './lineup'
import gameRoute from './game'
import tradeRoute from './trade'

export const linkNBARoute = (app: Application, apiVer: string) => {
  const base = combine(apiVer, MODULE.NBA)
  app.use(combine(base, PATH_PARAM.PLAYER), playerRoute)
  app.use(combine(base, PATH_PARAM.TEAM), teamRoute)
  app.use(combine(base, PATH_PARAM.LINEUP), lineupRoute)
  app.use(combine(base, PATH_PARAM.GAME), gameRoute)
  app.use(combine(base, PATH_PARAM.TRADE), tradeRoute)
}

import { Application, Router } from 'express'
import { MODULE } from 'config/dir'
import { combine } from 'utility'
import playerRoute from './player'
import teamRoute from './team'
import lineupRoute from './lineup'
import simRoute from './sim'
import tradeRoute from './trade'

const router = Router({ mergeParams: true })

export const linkNBARoute = (app: Application, apiVer: string) => {
  const base = combine(apiVer, MODULE.NBA)
  router.use(combine(base, 'player'), playerRoute)
  router.use(combine(base, 'team'), teamRoute)
  router.use(combine(base, 'lineup'), lineupRoute)
  router.use(combine(base, 'games'), simRoute)
  router.use(combine(base, 'trades'), tradeRoute)

  app.use(router)
}

export default router

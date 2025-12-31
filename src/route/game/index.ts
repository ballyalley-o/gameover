import { Application, Router } from 'express'
import { MODULE } from 'config/dir'
import { connect } from 'utility'
import playerRoute from './player'
import teamRoute from './team'
import lineupRoute from './lineup'
import simRoute from './sim'
import tradeRoute from './trade'

const router = Router({ mergeParams: true })

export const linkGameRoute = (app: Application, apiVer: string) => {
  const base = connect(apiVer, MODULE.GAME)
  router.use(connect('player'), playerRoute)
  router.use(connect('team'), teamRoute)
  router.use(connect('lineup'), lineupRoute)
  router.use(connect('games'), simRoute)
  router.use(connect('trades'), tradeRoute)

  app.use(base, router)
}

export default router

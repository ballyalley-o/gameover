import { Router } from 'express'
import { combinePathParam } from 'config/dir'

import simRoute from './sim'

const router = Router({ mergeParams: true })

router.use(combinePathParam('sim'), simRoute)

/**
 * @path {apiURL}/nba/game
 */
export default router
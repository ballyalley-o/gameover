import { Router } from 'express'
import { combinePathParam, PATH_PARAM } from 'config/dir'

import playerRoute from './player'
import statsRoute from './stats'

const router = Router({ mergeParams: true })

router.use(PATH_PARAM.ROOT, playerRoute)
router.use(combinePathParam('stats'), statsRoute)

/**
 * @path {apiURL}/nba/player
 */
export default router

import { Router } from 'express'
import { combinePathParam, PATH_PARAM } from 'config/dir'

import teamRoute from './team'
import rosterRoute from './roster'

const router = Router({ mergeParams: true })

router.use(PATH_PARAM.ROOT, teamRoute)
router.use(combinePathParam(':teamId', 'roster'), rosterRoute)

/**
 * @path {apiURL}/nba/team
 */
export default router

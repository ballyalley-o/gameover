import { Router } from 'express'
import { combine } from 'utility'

import teamRoute from './team'
import rosterRoute from './roster'

const router = Router({ mergeParams: true })

router.use('/', teamRoute)
router.use(combine(':teamId', 'roster'), rosterRoute)

/**
 * @path {apiURL}/nba/team
 */
export default router

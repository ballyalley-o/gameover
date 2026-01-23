import { Router } from 'express'
import { PATH_PARAM } from 'config/dir'

import lineupRoute from './lineup'

const router = Router({ mergeParams: true })

router.use(PATH_PARAM.ROOT, lineupRoute)

/**
 * @path {apiURL}/nba/lineup
 */
export default router

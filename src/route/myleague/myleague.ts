import { Router } from 'express'
import { MyLeagueController } from 'controller'
import { combinePathParam, PATH_PARAM } from 'config/dir'

const router = Router({ mergeParams: true })

router.post(PATH_PARAM.ROOT, MyLeagueController.create)
router.post(combinePathParam(PATH_PARAM.LEAGUE_ID, PATH_PARAM.DRAFT), MyLeagueController.draft)


/**
 * @path {apiURL}/myleague
 */
export default router

import { Router } from 'express'
import { MyLeagueController } from 'controller'
import { combinePathParam, PATH_PARAM } from 'config/dir'
import { authorize, protect } from 'middleware'

const router = Router({ mergeParams: true })

router
    .route(PATH_PARAM.ROOT)
    .get(protect, MyLeagueController.list)
    .post(protect, MyLeagueController.create)
    .delete(protect, authorize('admin'), MyLeagueController.deleteAll)

router
    .route(combinePathParam(PATH_PARAM.MY_LEAGUE_ID))
    .get(protect, authorize('admin'), MyLeagueController.get)
    .put(protect, MyLeagueController.updateMyLeague)
    .delete(protect, MyLeagueController.deleteMyLeagueById)

router.post(combinePathParam(PATH_PARAM.MY_LEAGUE_ID, PATH_PARAM.DRAFT), MyLeagueController.draft)

router.get(combinePathParam(PATH_PARAM.OWNER, PATH_PARAM.ALL), protect, MyLeagueController.getMyLeagueAll)

/**
 * @path {apiURL}/myleague
 */
export default router

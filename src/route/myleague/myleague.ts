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
    .put(protect, authorize('admin'), MyLeagueController.update)
    .delete(protect, authorize('admin'), MyLeagueController.deleteMyLeagueById)

router.post(combinePathParam(PATH_PARAM.MY_LEAGUE_ID, PATH_PARAM.DRAFT), MyLeagueController.draft)


/**
 * @path {apiURL}/myleague
 */
export default router

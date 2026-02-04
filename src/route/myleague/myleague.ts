import { Router } from 'express'
import { MyLeagueController, MyLeagueMembershipController } from 'controller'
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
    .delete(protect, authorize('admin'), MyLeagueController.deleteMyLeagueById)

router.get(combinePathParam(PATH_PARAM.OWNER, PATH_PARAM.ALL), protect, MyLeagueController.getMyLeagueAll)
router.post(combinePathParam(PATH_PARAM.MY_LEAGUE_ID, PATH_PARAM.DRAFT), MyLeagueController.draft)
router.post(combinePathParam(PATH_PARAM.MY_LEAGUE_ID, PATH_PARAM.INVITE), protect, MyLeagueMembershipController.invite)
router.post(combinePathParam(PATH_PARAM.MY_LEAGUE_ID, PATH_PARAM.REQUEST), protect, MyLeagueMembershipController.requestJoin)

router.get(combinePathParam(PATH_PARAM.MY_LEAGUE_ID, PATH_PARAM.MEMBER, PATH_PARAM.ALL), protect, MyLeagueMembershipController.getMemberAll)
router.get(combinePathParam(PATH_PARAM.MY_LEAGUE_ID, PATH_PARAM.MEMBERSHIP), protect, MyLeagueMembershipController.list)
router.post(combinePathParam(PATH_PARAM.MY_LEAGUE_ID, PATH_PARAM.MEMBERSHIP, PATH_PARAM.MEMBERSHIP_ID, PATH_PARAM.ACCEPT), protect, MyLeagueMembershipController.accept)
router.post(combinePathParam(PATH_PARAM.MY_LEAGUE_ID, PATH_PARAM.MEMBERSHIP, PATH_PARAM.MEMBERSHIP_ID, PATH_PARAM.DECLINE), protect, MyLeagueMembershipController.decline)


/**
 * @path {apiURL}/myleague
 */
export default router

import { Router } from 'express'
import { MyLeagueMembershipController } from 'controller'
import { combinePathParam, PATH_PARAM } from 'config/dir'
import { protect } from 'middleware'

const router = Router({ mergeParams: true })

router.post(combinePathParam(PATH_PARAM.INVITE), protect, MyLeagueMembershipController.invite)
router.post(combinePathParam(PATH_PARAM.REQUEST), protect, MyLeagueMembershipController.requestJoin)

router.get(combinePathParam(PATH_PARAM.MEMBERSHIP), protect, MyLeagueMembershipController.list)
router.get(combinePathParam(PATH_PARAM.MEMBERSHIP, PATH_PARAM.MEMBER, PATH_PARAM.ALL), protect, MyLeagueMembershipController.getMemberAll)
router.post(combinePathParam(PATH_PARAM.MEMBERSHIP, PATH_PARAM.MEMBERSHIP_ID, PATH_PARAM.ACCEPT), protect, MyLeagueMembershipController.accept)
router.post(combinePathParam(PATH_PARAM.MEMBERSHIP, PATH_PARAM.MEMBERSHIP_ID, PATH_PARAM.DECLINE), protect, MyLeagueMembershipController.decline)

/**
 * @path {apiURL}/myleague/{:myLeagueId}
 */
export default router

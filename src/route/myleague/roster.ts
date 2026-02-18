import { Router } from 'express'
import { MyLeagueRosterController } from 'controller'
import { combinePathParam, PATH_PARAM } from 'config/dir'
import { protect } from 'middleware'

const router = Router({ mergeParams: true })

router
    .route(PATH_PARAM.ROOT)
    .get(protect, MyLeagueRosterController.list)

router
    .route(combinePathParam(PATH_PARAM.MY_LEAGUE_ROSTER_ID))
    .get(protect, MyLeagueRosterController.get)
    .delete(protect, MyLeagueRosterController.removeRoster)

router.get(combinePathParam(PATH_PARAM.MY_LEAGUE_TEAM_ID, PATH_PARAM.PLAYER), protect, MyLeagueRosterController.listRosterPlayerAll)

/**
 * @path {apiURL}/myleague/{:myLeagueId}/roster/...
 */
export default router

import { Router } from 'express'
import { MyLeagueTeamController } from 'controller'
import { combinePathParam, PATH_PARAM } from 'config/dir'
import { protect } from 'middleware'

const router = Router({ mergeParams: true })

router
    .route(PATH_PARAM.ROOT)
    .get(protect, MyLeagueTeamController.list)

router.get(combinePathParam(PATH_PARAM.AVAILABLE), protect, MyLeagueTeamController.listAvailableTeamAll)
router.put(combinePathParam(PATH_PARAM.SELECT), protect, MyLeagueTeamController.selectTeam)

router
    .route(combinePathParam(PATH_PARAM.MY_LEAGUE_TEAM_ID))
    .get(protect, MyLeagueTeamController.get)
    .delete(protect, MyLeagueTeamController.removeTeam)

/**
 * @path {apiURL}/myleague/{:myLeagueId}/team
 */
export default router

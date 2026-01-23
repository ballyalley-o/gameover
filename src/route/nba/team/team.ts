import { Router } from 'express'
import { TeamController } from 'controller'
import { protect, authorize } from 'middleware'
import { combinePathParam, PATH_PARAM } from 'config/dir'

const router = Router({ mergeParams: true })

router.route(PATH_PARAM.ROOT)
  .get(protect, TeamController.list)
  .post(protect, authorize('admin'), TeamController.create)
  .delete(protect, authorize('admin'), TeamController.deleteTeamAll)

router
  .post(combinePathParam('create-basic'), protect, authorize('admin'), TeamController.createBasic)

router.route(combinePathParam(':teamId'))
  .get(protect, TeamController.get)
  .put(protect, authorize('admin'),TeamController.update)


/**
 * @path {apiURL}/nba/team
 */
export default router

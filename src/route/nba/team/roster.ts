import { Router } from 'express'
import { combinePathParam, PATH_PARAM } from 'config/dir'
import { protect, authorize } from 'middleware'
import { TeamController } from 'controller'

const router = Router({ mergeParams: true })

router.route(PATH_PARAM.ROOT)
  .get(protect, TeamController.roster)
  .post(protect, authorize('admin'), TeamController.addPlayer)
  .delete(protect, authorize('admin'), TeamController.deleteRosterAll)

router.put(combinePathParam('sync'), protect, authorize('admin'), TeamController.syncRoster)
router.post(combinePathParam('bulk'), protect, authorize('admin'), TeamController.addPlayerToRosterBulk)

router.route(combinePathParam(':playerId')).delete(protect, authorize('admin'), TeamController.removePlayer)

/**
 * @path {apiUrl}/nba/team/:teamId/roster
 */
export default router
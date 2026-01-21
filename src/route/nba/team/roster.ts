import { Router } from 'express'
import { protect, authorize } from 'middleware'
import { TeamController } from 'controller'

const router = Router({ mergeParams: true })

router.route('/')
  .get(protect, TeamController.roster)
  .post(protect, authorize('admin'), TeamController.addPlayer)
  .delete(protect, authorize('admin'), TeamController.deleteRosterAll)

router.put('/sync', protect, authorize('admin'), TeamController.syncRoster)
router.post('/bulk', protect, authorize('admin'), TeamController.addPlayerToRosterBulk)

router.route('/:playerId').delete(protect, authorize('admin'), TeamController.removePlayer)

/**
 * @path {apiUrl}/nba/team/:key/roster
 */
export default router
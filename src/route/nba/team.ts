import { Router } from 'express'
import { TeamController } from 'controller'
import { protect, authorize } from 'middleware'

const router = Router({ mergeParams: true })

router.route('/')
  .get(protect, TeamController.list)
  .post(protect, TeamController.create)
  .delete(protect, authorize('admin'), TeamController.deleteTeam)

router.post('/create-basic', protect, authorize('admin'), TeamController.createBasic)

router.route('/:id').get(protect, TeamController.get)
  .put(protect, TeamController.update)

router.route('/:id/roster')
  .get(protect, TeamController.roster)
  .post(protect, TeamController.addPlayer)

router.route('/:id/roster/:playerId')
  .delete(protect, TeamController.removePlayer)

/**
 * @path {apiURL}/nba/team
 */
export default router

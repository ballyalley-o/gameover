import { Router } from 'express'
import { TeamController } from 'controller'
import { protect, authorize } from 'middleware'

const router = Router({ mergeParams: true })

router.route('/')
  .get(protect, TeamController.list)
  .post(protect, authorize('admin'), TeamController.create)
  .delete(protect, authorize('admin'), TeamController.deleteTeamAll)

router
  .post('/create-basic', protect, authorize('admin'), TeamController.createBasic)

router.route('/:teamId')
  .get(protect, TeamController.get)
  .put(protect, authorize('admin'),TeamController.update)


/**
 * @path {apiURL}/nba/team
 */
export default router

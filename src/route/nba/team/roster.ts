import { Router } from 'express'
import { protect } from 'middleware'
import { TeamController } from 'controller'

const router = Router({ mergeParams: true })

router.route('/')
  .get(protect, TeamController.roster)
  .post(protect, TeamController.addPlayer)

router.post('/bulk', protect, TeamController.addPlayerToRosterBulk)

router.route('/:playerId')
  .delete(protect, TeamController.removePlayer)

/**
 * @path {apiUrl}/nba/team/:key/roster
 */
export default router
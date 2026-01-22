import { Router } from 'express'
import { PlayerController } from 'controller'
import { authorize, protect } from 'middleware'

const router = Router({ mergeParams: true })

router.route('/')
  .get(PlayerController.list)
  .post(PlayerController.create)

router.post('/create-basic', protect, PlayerController.createBasic)

router.put('/archetype/refresh', protect, authorize('admin'), PlayerController.refreshArchetype)
router.put('/stats/refresh', protect, authorize('admin'), PlayerController.syncAllStats)

router.route('/:playerId')
  .get(PlayerController.get)
  .put(PlayerController.update)
  .delete(PlayerController.remove)

/**
 * @path {apiURL}/nba/player
 */
export default router

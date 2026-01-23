import { Router } from 'express'
import { PlayerController } from 'controller'
import { authorize, protect } from 'middleware'
import { combine } from 'utility'

const router = Router({ mergeParams: true })

router.route('/')
  .get(PlayerController.list)
  .post(PlayerController.create)

router.post('/create-basic', protect, PlayerController.createBasic)

router.put('/archetype/refresh', protect, authorize('admin'), PlayerController.refreshArchetype)
router.put(combine('/', 'archetype', 'refresh', ':playerId'), protect, authorize('admin'), PlayerController.refreshArchetypeByPlayerId)

router.put('/stats/refresh', protect, authorize('admin'), PlayerController.syncAllStats)
router.put(combine('/', 'stats', 'refresh', ':playerId'), protect, authorize('admin'), PlayerController.syncPlayerStatsByPlayerId)

router.route('/:playerId')
  .get(PlayerController.get)
  .put(PlayerController.update)
  .delete(PlayerController.remove)

/**
 * @path {apiURL}/nba/player
 */
export default router

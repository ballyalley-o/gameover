import { Router } from 'express'
import { combinePathParam } from 'config/dir'
import { StatsController } from 'controller'
import { protect, authorize } from 'middleware'

const router = Router({ mergeParams:  true })

router.put(combinePathParam('sync'), protect, authorize('admin'), StatsController.syncPlayerAllStats)
router.put(combinePathParam('sync', ':playerId'), protect, authorize('admin'), StatsController.syncPlayerStatsByPlayerId)

export default router
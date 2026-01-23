import { Router } from 'express'
import { combinePathParam } from 'config/dir'
import { protect, authorize } from 'middleware'
import { StatsController } from 'controller'

const router = Router({ mergeParams: true })

router.put(combinePathParam('archetype', 'classify'), protect, authorize('admin'), StatsController.classifyArchtype)
router.put(combinePathParam('archetype', 'classify', ':playerId'), protect, authorize('admin'), StatsController.classifyArchetypeByPlayerId)

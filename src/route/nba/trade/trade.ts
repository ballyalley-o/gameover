import { Router } from 'express'
import { TradeController } from 'controller'
import { combinePathParam } from 'config/dir'
import { authorize, protect } from 'middleware'

const router = Router({ mergeParams: true })

router.post(combinePathParam('preview'), TradeController.preview)
router.post(combinePathParam('execute'), TradeController.execute)
router.post(combinePathParam('suggest'), TradeController.suggest)
router.get(combinePathParam('history'), TradeController.history)
router.delete(combinePathParam('history'), protect, authorize('admin'), TradeController.resetHistory)

export default router

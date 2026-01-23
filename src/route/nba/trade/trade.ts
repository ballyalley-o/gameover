import { Router } from 'express'
import { TradeController } from 'controller'
import { combinePathParam } from 'config/dir'

const router = Router({ mergeParams: true })

router.post(combinePathParam('preview'), TradeController.preview)
router.post(combinePathParam('execute'), TradeController.execute)
router.post(combinePathParam('suggest'), TradeController.suggest)

export default router

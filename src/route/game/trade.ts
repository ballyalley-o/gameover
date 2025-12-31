import { Router } from 'express'
import { TradeController } from 'controller'

const router = Router({ mergeParams: true })

router.post('/preview', TradeController.preview)
router.post('/execute', TradeController.execute)

export default router

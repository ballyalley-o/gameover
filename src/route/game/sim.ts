import { Router } from 'express'
import { GameController } from 'controller'

const router = Router({ mergeParams: true })

router.post('/sim', GameController.simulate)

export default router

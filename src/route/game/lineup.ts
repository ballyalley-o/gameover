import { Router } from 'express'
import { LineupController } from 'controller'

const router = Router({ mergeParams: true })

router.route('/')
  .post(LineupController.create)

router.route('/:id')
  .get(LineupController.get)
  .put(LineupController.update)

router.route('/:id/metric')
  .post(LineupController.computeMetrics)

export default router

import { Router } from 'express'
import { PlayerController } from 'controller'

const router = Router({ mergeParams: true })

router.route('/')
  .get(PlayerController.list)
  .post(PlayerController.create)

router.route('/:id')
  .get(PlayerController.get)
  .put(PlayerController.update)
  .delete(PlayerController.remove)

export default router

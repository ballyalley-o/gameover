import { Router } from 'express'
import { PlayerController } from 'controller'
import { protect } from 'middleware'

const router = Router({ mergeParams: true })

router.route('/')
  .get(PlayerController.list)
  .post(PlayerController.create)

router.post('/create-basic', protect, PlayerController.createBasic)

router.route('/:id')
  .get(PlayerController.get)
  .put(PlayerController.update)
  .delete(PlayerController.remove)

export default router

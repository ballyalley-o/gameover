import { Router } from 'express'
import { combinePathParam, PATH_PARAM } from 'config/dir'
import { PlayerController } from 'controller'
import { protect } from 'middleware'

const router = Router({ mergeParams: true })

router.route(PATH_PARAM.ROOT)
  .get(PlayerController.list)
  .post(PlayerController.create)

router.post(combinePathParam('create-lite'), protect, PlayerController.createLite)

router.route(combinePathParam(':playerId'))
  .get(PlayerController.get)
  .put(PlayerController.update)
  .delete(PlayerController.remove)

/**
 * @path {apiURL}/nba/player
 */
export default router

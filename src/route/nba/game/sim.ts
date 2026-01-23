import { Router } from 'express'
import { PATH_PARAM } from 'config/dir'
import { GameController } from 'controller'

const router = Router({ mergeParams: true })

router.post(PATH_PARAM.ROOT, GameController.simulate)

/**
 * @path {apiURL}/nba/game/sim
 */
export default router

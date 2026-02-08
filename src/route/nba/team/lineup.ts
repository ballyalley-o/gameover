import { Router } from 'express'
import { combinePathParam, PATH_PARAM } from 'config/dir'
import { LineupController } from 'controller/nba'

const router = Router({ mergeParams: true })

router.route(PATH_PARAM.ROOT)
  .post(LineupController.create)

router.route(combinePathParam(':id'))
  .get(LineupController.get)
  .put(LineupController.update)

router.route(combinePathParam(':id', 'metric'))
  .post(LineupController.computeMetric)

/**
 * @path {apiURL}/nba/team/lineup
 */
export default router

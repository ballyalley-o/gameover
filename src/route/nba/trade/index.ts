import { Router } from 'express'
import { PATH_PARAM } from 'config/dir'

import tradeRoute from './trade'

const router = Router({ mergeParams: true })

router.use(PATH_PARAM.ROOT, tradeRoute)

export default router
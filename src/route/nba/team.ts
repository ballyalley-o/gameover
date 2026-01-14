import { Router } from 'express'
import { TeamController } from 'controller'

const router = Router({ mergeParams: true })

router.route('/')
  .get(TeamController.list)
  .post(TeamController.create)
  .delete(TeamController.deleteTeam)

router.post('/create-basic', TeamController.createBasic)

router.route('/:id')
  .get(TeamController.get)
  .put(TeamController.update)

router.route('/:id/roster')
  .get(TeamController.roster)
  .post(TeamController.addPlayer)

router.route('/:id/roster/:playerId')
  .delete(TeamController.removePlayer)

export default router

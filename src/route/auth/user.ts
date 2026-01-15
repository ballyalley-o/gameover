import { Router } from 'express'
import { UserController } from 'controller'
import { users } from 'db/schema'
import { advanceResult } from 'middleware'
import { authorize, protect } from 'middleware'

const router = Router({ mergeParams: true })

router.route('/')
.get(protect, authorize('admin'), advanceResult(users), UserController.getUsers)
.post(protect, authorize('admin'), UserController.createUser)

router.route('/:id')
.get(UserController.getUser)
.put(UserController.updateUser)
.delete(UserController.deleteUser)

/**
 * @path {apiURL}/auth/user
 */
const userRoute = router
export default userRoute

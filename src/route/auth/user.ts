import { Router } from 'express'
import { UserController } from 'controller'
import { users } from 'db/schema'
import { advanceResult } from 'middleware'
import { authorize, protect } from 'middleware'

const router = Router({ mergeParams: true })

const userSelect = {
  id           : users.id,
  firstname    : users.firstname,
  lastname     : users.lastname,
  email        : users.email,
  emailVerified: users.emailVerified,
  role         : users.role,
  createdAt    : users.createdAt,
  updatedAt    : users.updatedAt
}

router.route('/')
.get(protect, authorize('admin'), advanceResult(users, { select: userSelect, includeTotal: false }), UserController.getUsers)
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

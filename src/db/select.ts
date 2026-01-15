import { users } from "./schema"

export const userSelect = {
  id           : users.id,
  firstname    : users.firstname,
  lastname     : users.lastname,
  email        : users.email,
  emailVerified: users.emailVerified,
  role         : users.role,
  createdAt    : users.createdAt,
  updatedAt    : users.updatedAt
}
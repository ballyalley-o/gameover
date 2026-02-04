import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { users } from 'db/schema'
import { transl } from 'utility'

const roleEnum    = z.enum(['user', 'admin'])
const emailSchema = z.string().email(transl('validation.default.invalid', { field: 'email address' })).regex(z.regexes.unicodeEmail, transl('error.invalid_email_format'))

export const userSelectSchema = createSelectSchema(users)
export const userInsertSchema = createInsertSchema(users, {
  firstname    : (schema) => schema.min(1).max(255),
  lastname     : (schema) => schema.max(255).optional(),
  username     : (schema) => schema.max(255).optional(),
  role         : roleEnum.default('user'),
  email        : () => emailSchema,
  password     : (schema) => schema.min(8).max(255),
  emailVerified: () => z.coerce.date().optional()
})

export const userUpdateSchema = userInsertSchema.partial()

import { z } from 'zod'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { myLeagueMembership } from 'db/schema'

const roleEnum   = z.enum(['owner', 'member'])
const statusEnum = z.enum(['pending', 'accepted', 'declined', 'expired'])
const sourceEnum = z.enum(['invite', 'request', 'system'])

export const myLeagueMembershipSelectSchema = createSelectSchema(myLeagueMembership)
export const myLeagueMembershipInsertSchema = createInsertSchema(myLeagueMembership, {
  role  : roleEnum.default('member'),
  status: statusEnum.default('pending'),
  source: sourceEnum.default('system'),
})
export const myLeagueMembershipUpdateSchema = myLeagueMembershipInsertSchema.partial()

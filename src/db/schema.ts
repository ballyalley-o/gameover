import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('User', {
  id           : uuid('id').defaultRandom().primaryKey(),
  firstname    : varchar('firstname', { length: 255 }).notNull(),
  lastname     : varchar('lastname', { length: 255 }),
  email        : varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('emailVerified', { withTimezone: false, mode: 'date' }),
  password     : varchar('password', { length: 255 }),
  role         : varchar('role', { length: 32 }).$type<Role>().notNull().default('user'),
  createdAt    : timestamp('createdAt', { withTimezone: false, mode: 'date' }).notNull().defaultNow(),
  updatedAt    : timestamp('updatedAt', { withTimezone: false, mode: 'date' }).defaultNow().$onUpdate(() => new Date()),
})

export type DrizzleUser    = typeof users.$inferSelect
export type NewDrizzleUser = typeof users.$inferInsert

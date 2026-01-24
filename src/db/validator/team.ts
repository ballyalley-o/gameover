import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { teams } from 'db/schema'
import { z } from 'zod'

const conferenceEnum = z.enum(['Eastern', 'Western'])
const divisionEnum   = z.enum(['Southeast', 'Central', 'Atlantic', 'Southwest', 'Northwest', 'Pacific'])
const statusEnum     = z.enum(['Active', 'Inactive'])

export const teamSelectSchema = createSelectSchema(teams)
export const teamInsertSchema = createInsertSchema(teams, {
  teamId         : () => z.union([z.string(), z.number()]).transform((v) => v.toString()),
  ownerUserId    : () => z.union([z.string(), z.number()]).transform((v) => v.toString()).optional(),
  stadiumId      : () => z.union([z.string(), z.number()]).transform((v) => v.toString()).optional(),
  status         : statusEnum.default('Inactive'),
  city           : (schema) => schema.min(1).max(100),
  name           : (schema) => schema.min(1).max(255),
  key            : (schema) => schema.max(3),
  conference     : conferenceEnum,
  division       : divisionEnum,
  primaryColor   : (schema) => schema.max(8).optional(),
  secondaryColor : (schema) => schema.max(8).optional(),
  tertiaryColor  : (schema) => schema.max(8).optional(),
  quaternaryColor: (schema) => schema.max(8).optional(),
  logoUrl        : (schema) => schema.max(255).optional(),
  wordmarkUrl    : (schema) => schema.max(255).optional(),
  headcoach      : (schema) => schema.min(1).max(255),
  market         : (schema) => schema.min(1).max(255),
  styleTags      : () => z.array(z.string()),
  salaryCap      : () => z.number(),
  hardCapActive  : z.boolean().default(false),
  exceptionBudget: () => z.number().int().nonnegative().default(0),
  exceptionType  : (schema) => schema.max(32).optional(),
})

export const teamUpdateSchema = teamInsertSchema.partial()

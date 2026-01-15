import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { players } from 'db/schema'
import { z } from 'zod'

const positionEnum  = z.enum(['PG', 'SG', 'SF', 'PF', 'C'])
const archetypeEnum = z.enum([
  'playmaker',
  'sharpshooter',
  'slasher',
  'two_way',
  'rim_protector',
  'stretch_big',
  'rebounder',
  'utility',
  'unknown'
])

export const playerSelectSchema = createSelectSchema(players)
export const playerInsertSchema = createInsertSchema(players, {
 playerId    : () => z.union([z.string(), z.number()]).transform((v) => v.toString()),
 firstname   : (schema) => schema.min(1).max(255),
 lastname    : (schema) => schema.min(1).max(255),
 archetype   : archetypeEnum,
 positions   : () => z.array(positionEnum).min(1),
 heightInches: (schema) => schema.int().positive().optional() ?? z.number().optional(),
 weightLbs   : (schema) => schema.int().positive().optional() ?? z.number().optional(),
 overall     : () => z.number().int().min(0).max(100).optional(),
 offense     : () => z.number().int().min(0).max(100).optional(),
 defense     : () => z.number().int().min(0).max(100).optional(),
 rebounding  : () => z.number().int().min(0).max(100).optional(),
 passing     : () => z.number().int().min(0).max(100).optional(),
 iq          : () => z.number().int().min(0).max(100).optional(),
 pace        : () => z.number().int().min(0).max(100).optional(),
 clutch      : () => z.number().int().min(0).max(100).optional(),
 stamina     : () => z.number().int().min(0).max(100).optional(),
 injuryRisk  : (schema) => schema?.optional() ?? z.string().optional(),
})

export const playerUpdateSchema = playerInsertSchema.partial()

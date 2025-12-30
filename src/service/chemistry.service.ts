import { and, eq, inArray, or } from 'drizzle-orm'
import { db } from 'gameover'
import { chemistryLinks } from 'db/schema'

export const chemistryService = {
  async getPairScore(playerAId: string, playerBId: string): Promise<number | undefined> {
    const [link] = await db
      .select()
      .from(chemistryLinks)
      .where(
        or(
          and(eq(chemistryLinks.playerAId, playerAId), eq(chemistryLinks.playerBId, playerBId)),
          and(eq(chemistryLinks.playerAId, playerBId), eq(chemistryLinks.playerBId, playerAId))
        )
      )
    return link?.score
  },

  async computeLineupChemistry(playerIds: string[]): Promise<number> {
    if (playerIds.length < 2) return 0

    const links = await db
      .select()
      .from(chemistryLinks)
      .where(and(inArray(chemistryLinks.playerAId, playerIds), inArray(chemistryLinks.playerBId, playerIds)))

    const pairCount = (playerIds.length * (playerIds.length - 1)) / 2
    if (!pairCount) return 0

    const scoreSum = links.reduce((sum, link) => sum + (link.score ?? 0), 0)
    return scoreSum / pairCount
  },
}

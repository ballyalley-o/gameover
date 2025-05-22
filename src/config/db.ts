import { GLOBAL } from 'hoopin'
import goodlog from 'good-logs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TAG = 'DB.HealthCheck'
export const dbHealthCheck = async (isConnected: boolean) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    goodlog.db(GLOBAL.DB_HOST, GLOBAL.DB_NAME, isConnected)
  } catch (error: any) {
    goodlog.error(error.message, TAG, 'dbHealthCheck')
    process.exit()
  }
}
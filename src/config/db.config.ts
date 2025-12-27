import { GLOBAL } from './global'
import { drizzle } from 'drizzle-orm/node-postgres'
import goodlog from 'good-logs'
import { Pool } from 'pg'
import * as schema from '../db/schema'

const TAG = 'DB.HealthCheck'

export const pool = new Pool({
  connectionString: GLOBAL.DB_URI,
})

export const db = drizzle(pool, { schema })

export const dbHealthCheck = async (isConnected: boolean) => {
  try {
    await pool.query('SELECT 1')
    goodlog.db(GLOBAL.DB_HOST, GLOBAL.DB_NAME, isConnected)
  } catch (error: any) {
    goodlog.error(error.message, TAG, 'dbHealthCheck')
    process.exit()
  }
}

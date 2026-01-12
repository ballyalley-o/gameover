import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { SSM_GET } from 'config/ssm.global'

export async function getClientDb() {
    const dbUri = await SSM_GET.DB_URI
    const sql   = neon(dbUri || '')
    return sql
}

export async function getDrizzleDbClient() {
    const sql = await getClientDb()
    return drizzle(sql)
}
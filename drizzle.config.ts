import { SSM_GET } from './src/config/ssm.global';
import { defineConfig } from 'drizzle-kit'

const dbUri = await SSM_GET.DB_URI
if (!dbUri) {
  throw new Error('DB_URI is missing. Set it or fetch it from SSM before running drizzle.')
}

export default defineConfig({
  dialect      : 'postgresql',
  schema       : './src/db/schema.ts',
  out          : './drizzle',
  dbCredentials: { url: dbUri }
})

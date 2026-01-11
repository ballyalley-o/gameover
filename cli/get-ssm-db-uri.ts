import 'dotenv/config'
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'

const region  = process.env.AWS_REGION || 'ap-southeast-2'
const appName = process.env.APP_NAME || 'gameover'
const stage   = process.env.STAGE || 'development'

const trim      = (value: string) => value.replace(/^\/+|\/+$/g, '')
const paramName = `/${[appName, stage, 'db-uri'].map(trim).filter(Boolean).join('/')}`

const client  = new SSMClient({ region })
const command = new GetParameterCommand({ Name: paramName, WithDecryption: true })
const result  = await client.send(command)
const value   = result?.Parameter?.Value

if (!value) {
  console.error(`Missing SSM parameter: ${paramName}`)
  process.exit(1)
}

process.stdout.write(`${value}\n`)

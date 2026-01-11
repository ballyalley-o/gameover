import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import type { GetParameterCommandInput } from '@aws-sdk/client-ssm'

import { GLOBAL } from './global'

export async function getParamFromStore(param: GetParameterCommandInput) {
  const client      = new SSMClient({ region: GLOBAL.AWS.REGION })
  const command     = new GetParameterCommand(param)
  const result      = await client.send(command)
  const resultParam = result?.Parameter?.Value

  return resultParam
}


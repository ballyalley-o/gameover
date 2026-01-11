import { getParamFromStore } from './ssm.config'
import { SSM_DIR } from './dir/ssm'

export const SSM_GET = {
  DB_URI                : getParamFromStore({ Name: SSM_DIR.DB_URI, WithDecryption: true }),
  SPORTSDATA_APIKEY     : getParamFromStore({ Name: SSM_DIR.SPORTSDATA_APIKEY, WithDecryption: true }),
  SPORTSDATA_AUTH_HEADER: getParamFromStore({ Name: SSM_DIR.SPORTSDATA_AUTH_HEADER, WithDecryption: false })
}
import { GLOBAL } from "../global"
import { combine } from "../../utility"

const _STAGE    = GLOBAL.STAGE
const _APP_NAME = GLOBAL.APP_NAME

export const SSM_DIR = {
  DB_URI                : combine(_APP_NAME, _STAGE, 'db-uri'),
  SPORTSDATA_APIKEY     : combine(_APP_NAME, _STAGE, 'sportsdata-api-key'),
  SPORTSDATA_AUTH_HEADER: combine(_APP_NAME, _STAGE, 'sportsdata-auth-header')
}

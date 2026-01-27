import { Application } from 'express'
import { MODULE, PATH_PARAM } from 'config/dir'
import { combine } from 'utility'

import myLeagueRoute from './myleague'

export const linkMyLeagueRoute = (app: Application, apiVer: string) => {
    const base = combine(apiVer, MODULE.MY_LEAGUE)
    app.use(combine(base, PATH_PARAM.ROOT), myLeagueRoute)
}
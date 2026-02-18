import { Application } from 'express'
import { MODULE, PATH_PARAM } from 'config/dir'
import { combine } from 'utility'

import myLeagueRoute from './myleague'
import membershipRoute  from './membership'
import teamRoute from './team'
import rosterRoute from './roster'

export const linkMyLeagueRoute = (app: Application, apiVer: string) => {
    const base = combine(apiVer, MODULE.MY_LEAGUE)
    app.use(combine(base, PATH_PARAM.ROOT), myLeagueRoute)
    app.use(combine(base, PATH_PARAM.MY_LEAGUE_ID), membershipRoute)
    app.use(combine(base, PATH_PARAM.MY_LEAGUE_ID, PATH_PARAM.TEAM), teamRoute)
    app.use(combine(base, PATH_PARAM.MY_LEAGUE_ID, PATH_PARAM.ROSTER), rosterRoute)
}
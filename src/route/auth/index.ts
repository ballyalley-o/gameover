import { Application } from 'express'
import { MODULE, PATH_PARAM } from 'config/dir'
import userRoute from 'route/auth/user'
import authRoute from 'route/auth/auth'
import { combine } from 'utility'

export const linkAuthRoute = (app: Application, apiVer: string) => {
    const base = combine(apiVer, MODULE.AUTH)
    app.use(base, authRoute)
    app.use(combine(base, PATH_PARAM.USER), userRoute)
}

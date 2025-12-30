import { Application } from 'express'
import { linkAuthRoute } from 'route/auth'
import { linkGameRoute } from 'route/game'

export const mainRoute = (app: Application, apiVer: string) => {
    linkAuthRoute(app, apiVer)
    linkGameRoute(app, apiVer)
}

export { default as ServerStatic } from './server-static'

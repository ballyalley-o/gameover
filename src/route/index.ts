import { Application } from 'express'
import { linkAuthRoute } from 'route/auth'
import { linkNBARoute } from 'route/nba'
import { linkFeedRoute } from 'route/feed'

export const mainRoute = (app: Application, apiVer: string) => {
    linkAuthRoute(app, apiVer)
    linkNBARoute(app, apiVer)
    linkFeedRoute(app, apiVer)
}

export { default as ServerStatic } from './server-static'

import { Application } from 'express'
import { linkAuthRoute } from 'route/auth'
import { linkNBARoute } from 'route/nba'
import { linkFeedRoute } from 'route/feed'
import { linkMyLeagueRoute } from 'route/myleague'
import { ErrorResponse } from 'middleware'
import { CODE } from 'constant'
import { transl } from 'utility'

const ROUTE_LINKER_MAIN: readonly RouteLinkerType[] = [
    linkAuthRoute,
    linkNBARoute,
    linkMyLeagueRoute,
    linkFeedRoute
]

export const mainRoute = (app: Application, apiVer: string) => {
    if (!apiVer.trim()) {
        throw new ErrorResponse(transl('error.missing_or_invalid_api_version'), CODE.BAD_REQUEST)
    }
    for (const _link of ROUTE_LINKER_MAIN) {
        try {
            _link(app, apiVer)
        } catch (error) {
            const name = _link.name || '(anonymous linker)'
            console.error(transl('error.failed_link_route', { linker: name }))
            throw error
        }
    }
}

export { default as ServerStatic } from './server-static'

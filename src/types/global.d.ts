import { en, fr, es } from 'locale'
import { Request, Response, NextFunction } from 'express'

declare global {
    declare type RequestHandler = (req : Request, res : Response, next: NextFunction) => void

    declare type AppLocale = typeof en | typeof fr | typeof es

    declare interface IConnect { (...params: string[]): string }

    declare interface IPagination {
        prev?: { page: number, limit: number }
        next?: { page: number, limit: number }
    }
    declare type RouteLinkerType = (app: Application, apiVer: string) => void
    declare interface AdvancedResults {
      success    : boolean
      message   ?: string
      count      : number
      pagination : Pagination
      data       : unknown[]
    }

    declare interface DecodedToken {
      id : string
      iat: number,
      exp: number
    }

    declare type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>

    declare namespace Express {
        interface Request {
          user: {
            id  : string
            role: Role
          }
        }
        interface Response {
          advanceResult: AdvancedResults
        }
    }

}

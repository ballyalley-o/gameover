import { GLOBAL, db } from 'hoopin'
import { Response, NextFunction  } from 'express'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { users } from '../db/schema'
import { asyncHandler, ErrorResponse } from 'middleware'
import { CODE, KEY, RESPONSE } from 'constant'

const TAG = 'Auth.Protect'
export const protect = asyncHandler(async (req, _res, next) => {
    let token

    if (req.cookies.token) {
        token = req.cookies.token
    } else if (req.headers.authorization && req.headers.authorization.startsWith(KEY.BEARER)) {
        token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
        return next(new ErrorResponse(RESPONSE.ERROR[401], CODE.UNAUTHORIZED))
    }

    try {
        const decoded  = jwt.verify(token, GLOBAL.JWT_SECRET as string) as DecodedToken
        const [user]   = await db.select().from(users).where(eq(users.id, decoded.id))

        if (!user) {
          return next(new ErrorResponse(RESPONSE.ERROR[401], CODE.UNAUTHORIZED))
        }

        req.user = { id: user.id, role: user.role }
        next()
    } catch (error: any) {
        return next(error)
    }
})

export const authorize = (...roles: string[]) => {
    return async (req: any, _res: Response, next: NextFunction): Promise<void> => {
        const role = req.user.role
        if (!roles.includes(role)) {
            return next(new ErrorResponse(RESPONSE.ERROR[401], CODE.UNAUTHORIZED))
        }
        next()
    }
}

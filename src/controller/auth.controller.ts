import { Request, Response, NextFunction } from 'express'
import { eq } from 'drizzle-orm'
import { GLOBAL, db } from 'hoopin'
import bcrypt from 'bcryptjs'
import { Service } from 'controller'
import { CODE, fiveSecFromNow, Resp, RESPONSE } from 'constant'
import { users } from '../db/schema'

const TAG = 'Auth.Controller'
export class AuthController {
    public static async signIn(req: Request, res: Response, _next: NextFunction) {
        try {
            const { email, password }  = req.body

            if (!email || !password) Service.invalid()
            const [user]  = await db.select().from(users).where(eq(users.email, email))

            if (!user) Service.invalid()
            const isMatch = await bcrypt.compare(password, user.password || '')

            if (!isMatch) Service.invalid()

            await Service.sendTokenResponse(user, CODE.OK, res)
        } catch (error: any) {
            Service.catchError(error, TAG, 'signIn', res)
        }
    }

    public static async signUp(req: Request, res: Response, _next: NextFunction) {
        try {
            const { email }  = req.body
            const [userExists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))

            if (userExists) Service.alreadyExist(email)
            const hashedPassword = await bcrypt.hash(req.body.password, GLOBAL.HASH.SALT_ROUNDS)
            const [newUser]      = await db.insert(users).values({ ...req.body, password: hashedPassword }).returning()
            await Service.sendTokenResponse(newUser, CODE.CREATED, res)
        } catch (error: any) {
            Service.catchError(error, TAG, 'signUp', res)
        }
    }

    public static async signOut(_req: Request, res: Response, _next: NextFunction) {
        res.cookie(GLOBAL.COOKIE.NAME, "none", {
            expires : fiveSecFromNow,
            httpOnly: true
        })

        try {
            res.status(CODE.OK).send(Resp.TokenResponse('', {}))
        } catch (error: any) {
            Service.catchError(error, TAG, 'signOut', res)
        }
    }

    public static async myAccount(req: Request, res: Response, _next: NextFunction) {
        try {
            if (!req.user?.id) {
                return Service.invalid(RESPONSE.ERROR[401], CODE.UNAUTHORIZED)
            }
            const [user] = await db.select().from(users).where(eq(users.id, req.user.id))
            if (!user) Service.notFound()
            res.status(CODE.OK).send(Resp.Ok(user))
        } catch (error: any) {
            Service.catchError(error, TAG, 'myAccount', res)
        }
    }

    public static async updateAccount(req: Request, res: Response, _next: NextFunction) {
        try {
            const [updatedUser] = await db.update(users).set(req.body).where(eq(users.id, req.user.id)).returning()
            if (!updatedUser) Service.notFound()
            res.status(CODE.OK).send(Resp.Ok(updatedUser))
        } catch (error: any) {
            Service.catchError(error, TAG, 'updateAccount', res)
        }
    }
}

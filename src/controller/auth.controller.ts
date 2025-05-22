import { Request, Response, NextFunction } from 'express'
import { GLOBAL } from 'hoopin'
import { Service } from 'controller'
import { PrismaClient } from '@prisma/client'
import { CODE, fiveSecFromNow, Resp, RESPONSE } from 'constant'

const prisma = new PrismaClient()

const TAG = 'Auth.Controller'
export class AuthController {
    public static async signIn(req: Request, res: Response, _next: NextFunction) {
        try {
            const { email, password }  = req.body

            if (!email || !password) Service.invalid()
            const user    = await prisma.user.findUnique({ where: { email } }) || Service.invalid()
            const isMatch = await Service.matchPassword(user.password || '', password)

            if (!isMatch) Service.invalid()

            await Service.sendTokenResponse(user, CODE.OK, res)
        } catch (error: any) {
            Service.catchError(error, TAG, 'signIn', res)
        }
    }

    public static async signUp(req: Request, res: Response, _next: NextFunction) {
        try {
            const { email }  = req.body
            const userExists = await prisma.user.findUnique({ where: { email }})

            if (userExists) Service.alreadyExist(email)
            const hashedPassword = await Service.hashPassword(req.body.password)
            const newUser        = await prisma.user.create({ data: { ...req.body, password: hashedPassword }})
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
            const user = await prisma.user.findUnique({ where: { id: req.body.id }}) || Service.notFound()
            res.status(CODE.OK).send(Resp.Ok(user))
        } catch (error: any) {
            Service.catchError(error, TAG, 'myAccount', res)
        }
    }

    public static async updateAccount(req: Request, res: Response, _next: NextFunction) {
        try {
            const updatedUser = await prisma.user.update({ where: { id: req.user.id }, data: req.body })|| Service.notFound()
            res.status(CODE.OK).send(Resp.Ok(updatedUser))
        } catch (error: any) {
            Service.catchError(error, TAG, 'updateAccount', res)
        }
    }
}
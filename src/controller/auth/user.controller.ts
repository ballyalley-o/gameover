import { Request, Response, NextFunction } from 'express'
import { db } from 'gameover'
import { eq } from 'drizzle-orm'
import { users } from 'db/schema'
import { Service } from 'controller'
import { CODE, Resp, RESPONSE } from 'constant'

const TAG = 'User.Controller'
export class UserController {
    public static async getUserAll(_req: Request, res: Response, _next:NextFunction) {
        try {
            res.status(CODE.OK).json(res.advanceResult)
        } catch (error: any) {
            Service.catchError(error, TAG, 'getUserAll', res)
        }
    }

    public static async getUser(req:Request, res: Response, _next: NextFunction) {
        try {
            const [user] = await db.select().from(users).where(eq(users.id, req.params.id))
            res.status(CODE.OK).send(Resp.Ok(user))
        } catch (error: any) {
            Service.catchError(error, TAG, 'getUser', res)
        }
    }

    public static async createUser(req: Request, res: Response, _next: NextFunction) {
        try {
            const newUser = await Service.createUser(req.body)
            res.status(CODE.CREATED).send(Resp.Created(newUser))
        } catch (error: any) {
            Service.catchError(error, TAG, 'createUser', res)
        }
    }

    public static async updateUser(req: Request, res: Response, _next: NextFunction) {
        try {
            const updatedUser = await Service.updateUser(req.params.id, req.body)
            res.status(CODE.OK).send(Resp.Ok(updatedUser))
        } catch (error: any) {
            Service.catchError(error, TAG, 'updateUser', res)
        }
    }

    public static async removeUser(req: Request, res: Response, _next: NextFunction) {
        try {
            const userId      = req.params.id

            const removedUser = await Service.removeUser(userId)
            res.status(CODE.OK).send(Resp.Ok(removedUser, 0, RESPONSE.SUCCESS.DELETED))
        } catch (error: any) {
            Service.catchError(error, TAG, 'removedUser', res)
        }
    }
}

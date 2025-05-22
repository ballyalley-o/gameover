import { Response } from 'express'
import { GLOBAL } from 'hoopin'
import argon2 from 'argon2'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import goodlog from 'good-logs'
import { ErrorResponse } from 'middleware'
import { CODE, KEY, RESPONSE, Resp, oneDayFromNow } from 'constant'

const prisma = new PrismaClient()

export class Service {
  public static getSignedJwtToken(userId: string) {
    return jwt.sign({ id: userId }, GLOBAL.JWT_SECRET, { expiresIn: GLOBAL.JWT_EXP })
  }

  public static async matchPassword(hash: string, raw: string) {
    return argon2.verify(hash, raw)
  }

  public static async hashPassword(password: string) {
     const hashedPassword = await argon2.hash(password, {
       type       : argon2.argon2id,
       memoryCost : GLOBAL.HASH.MEMORY_COST,
       timeCost   : GLOBAL.HASH.TIME_COST,
       parallelism: GLOBAL.HASH.PARALLELISM,
     })
     return hashedPassword
  }

  public static async getResetPasswordToken() {
    const resetToken = crypto.randomBytes(20).toString(GLOBAL.ENCRYPTION.ENCODING as BufferEncoding)
    const hashed     = crypto.createHash(GLOBAL.ENCRYPTION.ALG).update(resetToken).digest(GLOBAL.ENCRYPTION.ENCODING as crypto.BinaryToTextEncoding)
    const expires    = oneDayFromNow
    return { resetToken, hashed, expires }
  }

  public static async sendTokenResponse(user: any, code: CODE, res: Response) {
    const token   = user.getSignedJwtToken()
    const options = {
      expires : GLOBAL.COOKIE.EXP,
      httpOnly: true,
      secure  : false
    }

    if (GLOBAL.ENV === KEY.PRODUCTION) {
      options.secure = true
    }

    res.status(code).cookie(GLOBAL.COOKIE.NAME, token, options).send(Resp.TokenResponse(token, user))
  }

  public static notFound(): never {
    throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
  }

  public static invalid(message: string = RESPONSE.ERROR.INVALID_CREDENTIALS, code: CODE = CODE.UNAUTHORIZED): never {
    throw new ErrorResponse(message, code)
  }

  public static alreadyExist(email: string): never {
    throw new ErrorResponse(RESPONSE.ERROR.EMAIL(email), CODE.CONFLICT)
  }

  public static catchError(error: any, tag: string, target: string, res: Response) {
      goodlog.error(error?.message || error?.stack, tag, target)
      const code = error instanceof ErrorResponse ? error?.code : CODE.BAD_REQUEST
      res.status(code).send(Resp.Error(error?.message, code, error?.details))
  }

  public static async createUser(data: any) {
    const hashedPassword = await Service.hashPassword(data.password)
    const newUser        = prisma.user.create({ data: { password: hashedPassword, ...data } })
    return newUser
  }

  public static async updateUser(userId: string, data: any) {
    const updatedUser = await prisma.user.update({ where: { id: userId }, data })
    if (!updatedUser) {
      throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)
    }
    return updatedUser
  }

  public static async deleteUser(userId: string) {
    const deletedUser = await prisma.user.delete({ where: { id: userId }})
    if (!deletedUser) {
      throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)
    }
    return {}
  }
}
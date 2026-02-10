import { Response } from 'express'
import argon2 from 'argon2'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import goodlog from 'good-logs'
import bcrypt from 'bcryptjs'
import { GLOBAL, db } from 'gameover'
import { users } from '../db/schema'
import { ErrorResponse } from 'middleware'
import { CODE, KEY, REGEX, RESPONSE, Resp, oneDayFromNow } from 'constant'
import { transl } from 'utility'

export class Service {
  public static getSignedJwtToken(userId: string) {
    return jwt.sign({ id: userId }, GLOBAL.JWT_SECRET, { expiresIn: GLOBAL.JWT_EXP })
  }

  public static getAuthUserId(req: AppRequestAuthType): string | undefined {
    const r = req
    return r.user?.id ?? r.userId
  }

  public static async getAuthUser(userId: string) {
    try {
      const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId))
      return user
    } catch (error) {
      throw new ErrorResponse(RESPONSE.ERROR[404], CODE.NOT_FOUND)
    }
  }

  public static async matchPassword(hash: string, raw: string) {
    return argon2.verify(hash, raw)
  }

  public static async hashPassword(password: string) {
    const hashedPassword = await argon2.hash(password, {
      type       : argon2.argon2id,
      memoryCost : GLOBAL.HASH.MEMORY_COST,
      timeCost   : GLOBAL.HASH.TIME_COST,
      parallelism: GLOBAL.HASH.PARALLELISM
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
    const token   = Service.getSignedJwtToken(user.id)
    const options = {
      expires : GLOBAL.COOKIE.EXP,
      httpOnly: true,
      secure  : false
    }

    if (GLOBAL.STAGE === KEY.PRODUCTION) {
      options.secure = true
    }

    const { id, ...rest } = user
    res.status(code).cookie(GLOBAL.COOKIE.NAME, token, options).send(Resp.TokenResponse(token, rest))
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
    const apiErrorMessage = error?.response?.data?.message || error?.data?.message || error?.message || RESPONSE.ERROR[400]
    const statusCode      = error?.response?.status || error?.response?.data?.statusCode || error?.code || CODE.BAD_REQUEST

    goodlog.error(apiErrorMessage || error?.stack, tag, target)

    if (error?.response?.data) {
      goodlog.error(JSON.stringify(error.response.data), tag, target)
    }
    res.status(statusCode).send(Resp.Error(apiErrorMessage, statusCode, error?.response?.data))
  }

  public static async createUser(data: any) {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email))
    if (existing) {
      throw new ErrorResponse(RESPONSE.ERROR.DOCUMENT_EXISTS, CODE.CONFLICT)
    }

    if (!data.password) {
      throw new ErrorResponse(RESPONSE.ERROR.INVALID_CREDENTIALS, CODE.BAD_REQUEST)
    }

    /**
     * Password Requirements:
        - Minimum of 8 characters
        - At least one uppercase letter (A–Z)
        - At least one lowercase letter (a–z)
        - At least one number (0–9)
        - At least one special character (e.g., !, @, #, $)
     */
    const dataPassword = String(data.password)
    const PASSWORD_REGEX = new RegExp(REGEX.PASSWORD)

    if (!PASSWORD_REGEX.test(dataPassword)) {
      throw new Error(transl('validation.password'))
    }

    const hashedPassword = await bcrypt.hash(data.password, GLOBAL.HASH.SALT_ROUNDS)
    const [newUser]      = await db.insert(users).values({ ...data, password: hashedPassword }).returning()
    return newUser
  }

  public static async updateUser(userId: string, data: any) {
    const [updatedUser] = await db.update(users).set({ ...data }).where(eq(users.id, userId)).returning()
    if (!updatedUser) {
      throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)
    }
    return updatedUser
  }

  public static async removeUser(userId: string) {
    const [deletedUser] = await db.delete(users).where(eq(users.id, userId)).returning()
    if (!deletedUser) {
      throw new ErrorResponse(RESPONSE.ERROR.FAILED_FIND, CODE.NOT_FOUND)
    }
    return {}
  }
}

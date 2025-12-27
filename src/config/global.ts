import dotenv from 'dotenv'
dotenv.config()

export const GLOBAL = {
  APP_NAME       : process.env.APP_NAME || 'hoopin',
  ENV            : process.env.ENV || 'development',
  PORT           : process.env.PORT || 3007,
  API_URL        : process.env.API_URL || '',
  API_VERSION    : process.env.API_VERSION || 'v1',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()): [],
  COOKIE         : {
    NAME: process.env.COOKIE_NAME || '',
    EXP :  new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  DB_URI    : `${process.env.DB_PROTOCOL}://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?sslmode=require` || '',
  DB_NAME   : process.env.DB_NAME || 'hoopin-db',
  DB_HOST   : process.env.DB_HOST || '',
  ENCRYPTION: {
    ENCODING: process.env.ENCRYPTION_ENCODING || '',
    ALG     : process.env.ENCRYPTION_ALG || '',
  },
  HASH   : {
    MEMORY_COST: parseInt(process.env.HASH_MEMORY_COST || '19456', 10),
    PARALLELISM: parseInt(process.env.HASH_PARALLELISM || '1', 10),
    SALT_ROUNDS: Number(process.env.SALT_ROUNDS) || 10,
    TIME_COST  : parseInt(process.env.HASH_TIME_COST || '2', 10),
    TYPE       : process.env.HASH_TYPE || 'argon2id',
  },
  RATE_LIMIT: {
    windowMs: 10 * 60 * 1000,
    max     : process.env.MAX_RATE_LIMIT
  },
  LOG_LEVEL        : 'info',
  LOG_FILENAME_ERR : 'log/error.log',
  LOG_FILENAME_COMB: 'log/combined.log',
  PAGINATION       : {
    DEFAULT_PAGE: 1,
    LIMIT       : 25,
  },
  JWT_EXP   : 24 * 60 * 60 * 1000,
  JWT_SECRET: process.env.JWT_SECRET || '',
}

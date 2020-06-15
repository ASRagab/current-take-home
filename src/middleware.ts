import { Request, Response, RequestHandler } from 'express'
import Logger from 'bunyan'
import morgan from 'morgan'

const logger: Logger = Logger.createLogger({ name: 'logger' })

export const asyncHandler = (fn: (...args: any[]) => any) => (
  req: Request,
  res: Response,
  next: (...args: any[]) => any
) => Promise.resolve(fn(req, res, next)).catch(next)

const unexpectedErrorCode = -99

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: (...args: any[]) => any
): void => {
  res.status(500).json({
    message: err.message || '',
    code: unexpectedErrorCode
  })
}

export const requestLogger = (): RequestHandler => {
  const format = process.env.NODE_ENV === 'production' ? 'common' : 'dev'
  const options = { stream: { write: (log: any) => logger.info(log) } }

  return morgan(format, options)
}

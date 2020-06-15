import { IBasicAuthedRequest } from 'express-basic-auth'
import { Either, right, left } from 'fp-ts/lib/Either'
import parse from 'date-fns/fp/parse'
import format from 'date-fns/fp/format'

export const isOfType = <T>(obj: any, ...properties: (keyof T)[]): obj is T =>
  properties.every(property => (obj as T)[property] !== undefined)

// I know, this way madness lies...
export const validateEmail = (email: string | undefined): boolean => {
  const regex = /^(\D)+(\w)*((\.(\w)+)?)+@(\D)+(\w)*((\.(\D)+(\w)*)+)?(\.)[a-z]{2,}$/
  return email ? regex.test(email) : false
}

export const validatePeriod = (start: string, end: string): Either<string, [string, string]> => {
  const startDate = parse(new Date())('yyyy-MM-dd')(start)
  const endDate = parse(new Date())('yyyy-MM-dd')(end)

  const formatted = !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())
  const startNotAfter = formatted && startDate.getTime() <= endDate.getTime()

  if (startNotAfter) {
    const formatter = format('yyyy-MM-dd')
    return right([formatter(startDate), formatter(endDate)])
  }

  return formatted
    ? left(`provided start is after provided end date`)
    : left(`start: ${start} or end: ${end} not formatted correctly`)
}

export const getUnauthorizedResponse = (req: IBasicAuthedRequest) => {
  return {
    code: -2,
    message: req.auth ? `Credentials for ${req.auth.user} rejected` : 'No credentials provided'
  }
}

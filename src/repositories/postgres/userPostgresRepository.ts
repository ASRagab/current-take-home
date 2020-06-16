import Knex, { Transaction } from 'knex'
import { Either, right, left, isLeft } from 'fp-ts/lib/Either'
import UserRepository from '../userRepository'
import { validateEmail } from '../../utils'
import { Tables } from '../../environment'

export default class UserPostgresRepository implements UserRepository {
  private readonly tableName: string

  constructor(private knex: Knex<any, unknown[]>, table: string) {
    this.tableName = table
  }

  private checkEmail = async (
    trx: Transaction,
    email: string,
    userId?: string
  ): Promise<Either<string, string>> => {
    if (!validateEmail(email)) {
      return left(`email: ${email} is not valid`)
    }

    return trx(this.tableName)
      .where({ email })
      .select('email', 'user_id')
      .first()
      .then(check => {
        const idempotentChange = userId && check?.userId === userId && check?.email === email

        if (!idempotentChange && check?.email) {
          const duplicate = `duplicate email ${email}`
          return left(duplicate)
        }

        return right('is unique and valid')
      })
  }

  create = async (
    email: string,
    firstName: string,
    lastName: string,
    password: string
  ): Promise<Either<string, string>> => {
    return this.knex.transaction(async trx => {
      return this.checkEmail(trx, email).then(checkEmail => {
        if (isLeft(checkEmail)) {
          return checkEmail
        }

        return trx(this.tableName)
          .returning('user_id')
          .insert<string>({
            email,
            firstName,
            lastName,
            password
          })
          .then(result => right(result))
      })
    })
  }

  updateEmail = async (userId: string, email: string): Promise<Either<string, string>> => {
    return this.knex.transaction(async trx => {
      return this.checkEmail(trx, email, userId).then(checkEmail => {
        if (isLeft(checkEmail)) {
          return checkEmail
        }

        return trx(this.tableName)
          .returning('user_id')
          .update<string>({
            email
          })
          .where({ userId })
          .then(result => {
            return result.length > 0
              ? right(result)
              : left(`userId: '${userId}' could not be found`)
          })
      })
    })
  }

  updatePassword = async (userId: string, password: string): Promise<Either<string, string>> => {
    return this.knex.transaction(async trx => {
      return trx(this.tableName)
        .returning('user_id')
        .update<string>({
          password
        })
        .where({ userId })
        .then(result => {
          return result.length > 0 ? right(result) : left(`userId: '${userId}' could not be found`)
        })
    })
  }

  updateName = async (
    userId: string,
    firstName: string | undefined,
    lastName: string | undefined
  ): Promise<Either<string, string>> => {
    return this.knex.transaction(async trx => {
      const result = await trx(this.tableName)
        .returning('user_id')
        .update<string>({
          firstName,
          lastName
        })
        .where({ userId })

      return result.length > 0 ? right(result) : left(`userId: '${userId}' could not be found`)
    })
  }

  getUserBalance = async (userId: string): Promise<Either<string, number>> => {
    const result = await this.knex(Tables.transaction)
      .sum('amount_in_cents')
      .where({ userId })
      .first()

    return result
      ? right(parseInt(result.sum, 10))
      : left(`user has no transactions or could not be found`)
  }
}

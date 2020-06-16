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
        // Allowing for a user to reset their email to the same value
        // Logic:
        // 1. Was I given a userId
        // 2. Did I find that userId for the email and does the email and userId match for the result
        // 3. if 2 is false and I found a result, then it's a duplicate, otherwise it's valid and unique
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
    return this.knex
      .transaction(async trx => {
        return this.checkEmail(trx, email).then(async checkEmail => {
          if (isLeft(checkEmail)) {
            return checkEmail // it's a dup
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
      .catch(err => {
        console.log(err)
        return left(`create query failed`)
      })
  }

  updateEmail = async (userId: string, email: string): Promise<Either<string, string>> => {
    return this.knex
      .transaction(async trx => {
        return this.checkEmail(trx, email, userId).then(checkEmail => {
          if (isLeft(checkEmail)) {
            return checkEmail // it's a dup
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
                : left(`userId: '${userId}' could not be found`) // not actually possibe (email would be seen as dup)
            })
        })
      })
      .catch(err => {
        console.log(err)
        return left(`updateEmail query failed`)
      })
  }

  updatePassword = async (userId: string, password: string): Promise<Either<string, string>> => {
    return this.knex
      .transaction(async trx => {
        return trx(this.tableName)
          .returning('user_id')
          .update<string>({
            password
          })
          .where({ userId })
          .then(result => {
            return result.length > 0
              ? right(result)
              : left(`userId: '${userId}' could not be found`)
          })
      })
      .catch(err => {
        console.log(err)
        return left(`updatePassword query failed`)
      })
  }

  updateName = async (
    userId: string,
    firstName: string | undefined,
    lastName: string | undefined
  ): Promise<Either<string, string>> => {
    return this.knex
      .transaction(async trx => {
        const result = await trx(this.tableName)
          .returning('user_id')
          .update<string>({
            firstName,
            lastName
          })
          .where({ userId })

        return result.length > 0 ? right(result) : left(`userId: '${userId}' could not be found`)
      })
      .catch(err => {
        console.log(err)
        return left(`updateName query failed`)
      })
  }

  getUserBalance = async (userId: string): Promise<Either<string, number>> => {
    try {
      const result = await this.knex(Tables.transaction)
        .sum('amount_in_cents')
        .where({ userId })
        .first()

      return result
        ? right(parseInt(result.sum, 10))
        : left(`user has no transactions or could not be found`)
    } catch (e) {
      console.error(e)
      return left(`getUserBalance query failed`)
    }
  }
}

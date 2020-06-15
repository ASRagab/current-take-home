import Knex from 'knex'
import { AsyncAuthorizerCallback } from 'express-basic-auth'
import UserAuthRepository from '../userAuthRepository'

export default class UserAuthPostgresRepository implements UserAuthRepository {
  private readonly tableName: string

  constructor(private knex: Knex<any[], unknown>, table: string) {
    this.tableName = table
  }

  private checkPassword = async (email: string, password: string): Promise<boolean> => {
    const result = await this.knex(this.tableName)
      .select('user_id')
      .where('email', email)
      .andWhereRaw(`password = crypt(?, password)`, [password])

    return result.length > 0
  }

  authorizer = (email: string, password: string, cb: AsyncAuthorizerCallback): Promise<void> => {
    return this.checkPassword(email, password)
      .then(authed => cb(null, authed))
      .catch(err => cb(err, false))
  }
}

import Knex from 'knex'
import { AsyncAuthorizerCallback } from 'express-basic-auth'
import UserAuthRepository from '../userAuthRepository'

export default class UserAuthPostgresRepository implements UserAuthRepository {
  private readonly tableName: string

  constructor(private knex: Knex<any[], unknown>, table: string) {
    this.tableName = table
  }

  /**
   * Checks the incoming password against the database using the email address (unique)
   * password is checked against incoming password `?` in the databse, if a result comes back
   * we've found a match
   */
  private checkPassword = async (email: string, password: string): Promise<boolean> => {
    try {
      const query = await this.knex(this.tableName)
        .select('id')
        .where('login', email)
        .andWhere('name', 'admin')
        .andWhereRaw(`password = crypt(?, password)`, [password])

      return query.length > 0
    } catch (e) {
      return false
    }
  }

  /**
   * basic auth middleware delegates to this call
   */
  authorizer = async (
    email: string,
    password: string,
    cb: AsyncAuthorizerCallback // the express callback, old school null err channel on success
  ): Promise<void> => {
    return this.checkPassword(email, password).then(authed => cb(null, authed))
    // .catch(err => cb(err, false))
  }
}

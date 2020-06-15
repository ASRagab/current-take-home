import Knex from 'knex'
import { knexSnakeCaseMappers } from 'objection'
import { DbConfiguration } from './environment'

const db = (config: DbConfiguration) => {
  const { user, password, host, database } = config
  return Knex({
    client: 'pg',
    connection: {
      host,
      user,
      password,
      database
    },
    ...knexSnakeCaseMappers() // maps underscore fields to camelCase models
  })
}

export default db

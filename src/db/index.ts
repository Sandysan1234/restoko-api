import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env'
import * as schema from './schema'

// Create the postgres connection
const client = postgres(env.DATABASE_URL)

// Create the Drizzle ORM instance with schema for type inference
export const db = drizzle(client, { schema })

export type Database = typeof db

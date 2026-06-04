import { eq, ilike, and } from 'drizzle-orm'
import { db } from '../db'
import { user } from '../db/schema'
import type { User, NewUser } from '../db/schema'

class UserRepository {
  /**
   * Find a user by their ID.
   */
  async findById(id: string): Promise<User | null> {
    const [result] = await db.select().from(user).where(eq(user.id, id)).limit(1)
    return result ?? null
  }

  /**
   * Find a user by their email address.
   */
  async findByEmail(email: string): Promise<User | null> {
    const [result] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1)
    return result ?? null
  }

  /**
   * List all users with optional pagination.
   */
  async findMany(opts: { limit?: number; offset?: number } = {}): Promise<User[]> {
    const { limit = 20, offset = 0 } = opts
    return db.select().from(user).limit(limit).offset(offset)
  }

  /**
   * Count total users.
   */
  async count(): Promise<number> {
    const result = await db.select({ count: user.id }).from(user)
    return result.length
  }

  /**
   * Update a user's profile fields.
   * Returns the updated user or null if not found.
   */
  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'image'>>,
  ): Promise<User | null> {
    const [updated] = await db
      .update(user)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning()
    return updated ?? null
  }

  /**
   * Delete a user by ID.
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(user).where(eq(user.id, id)).returning()
    return result.length > 0
  }
}

// Singleton export — import directly, no DI container needed
export const userRepository = new UserRepository()

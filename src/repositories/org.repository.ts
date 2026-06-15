import { eq, and } from "drizzle-orm";
import {  db } from "../db";
import { organization, member, invitation, user } from "../db/schema";
import type { Organization, Member, Invitation } from "../db/schema";

class OrgRepository {
  /**
   * Find an organization by ID.
   */
  async findById(id: string): Promise<Organization | null> {
    const [result] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, id))
      .limit(1);
    return result ?? null;
  }

  /**
   * Find an organization by its slug.
   */
  async findBySlug(slug: string): Promise<Organization | null> {
    const [result] = await db
      .select()
      .from(organization)
        .where(eq(organization.slug, slug))
      .limit(1);
    return result ?? null;
  }

  /**
   * Get all organizations a user belongs to.
   */
  async findByUserId(userId: string): Promise<Organization[]> {
    const rows = await db
      .select({ organization })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, userId));

    return rows.map((r) => r.organization);
  }

  /**
   * Get all members of an organization, including their user details.
   */
  async findMembers(organizationId: string): Promise<
    (Member & {
      user: { id: string; name: string; email: string; image: string | null };
    })[]
  > {
    const rows = await db
      .select({
        id: member.id,
        organizationId: member.organizationId,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, organizationId));
    return rows;
  }

  /**
   * Get a member record by organization and user.
   */
  async findMember(
    organizationId: string,
    userId: string,
  ): Promise<Member | null> {
    const [result] = await db
      .select()
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.userId, userId),
        ),
      )
      .limit(1);
    return result ?? null;
  }

  /**
   * List pending invitations for an organization.
   */
  async findInvitations(organizationId: string): Promise<Invitation[]> {
    return db
      .select()
      .from(invitation)
      .where(
        and(
          eq(invitation.organizationId, organizationId),
          eq(invitation.status, "pending"),
        ),
      );
  }
}

// Singleton export — import directly, no DI container needed
export const orgRepository = new OrgRepository();

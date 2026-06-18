import { Hono } from "hono";
import { successResponse } from "../lib/response";
import { db } from "../db";
import { items, itemVariations, member, user } from "../db/schema";
import { AppEnv } from "../lib/factory";
import { and, eq } from "drizzle-orm";
import z, { string } from "zod";
import { jsonValidator, paramValidator } from "../lib/validator";
import { orgRepository } from "../repositories/org.repository";
import { ForbiddenError, NotFoundError } from "../lib/errors";

const catalogRoutes = new Hono<AppEnv>();
// ─── Schemas ──────────────────────────────────────────────────────────────────

const itemIdParamSchema = z.object({
  itemId: z.number().positive(),
});
const itemVarIdParamSchema = z.object({
  itemId: z.number().positive(),
  itemVarId: z.number().positive(),
});

const createItemVariationSchema = z.object({
  itemId: z.coerce.number(),
  itemAttributeId: z.coerce.number(),
  name: z.string().min(1),
  price: z.string().refine((val) => !isNaN(Number(val))),

  caution: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});
const updateItemVariationSchema = createItemVariationSchema.partial();
// ─── Routes ───────────────────────────────────────────────────────────────────

catalogRoutes.post(
  "/:itemId/variations",
  paramValidator(itemIdParamSchema),
  jsonValidator(createItemVariationSchema),
  async (c) => {
    const user = c.var.user!;
    const { itemId } = c.req.valid("param");
    const item = await db
      .select()
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);
    if (!item) throw new NotFoundError("Items");

    const membership = await db
      .select()
      .from(member)
      .where(eq(member.userId, user.id));
    if (!membership) {
      throw new ForbiddenError("You are not a member");
    }
    const newItemVariation = c.req.valid("json");

    const itemVariation = await db
      .insert(itemVariations)
      .values(newItemVariation)
      .returning({ id: itemVariations.id });
    return successResponse(c, itemVariation);
  },
);
catalogRoutes.get(
  "/:itemId/variations",
  paramValidator(itemIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { itemId } = c.req.valid("param");
    const item = await db
      .select()
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);
    if (!item) throw new NotFoundError("Items");

    const membership = await db
      .select()
      .from(member)
      .where(eq(member.userId, user.id));
    if (!membership) {
      throw new ForbiddenError("You are not a member");
    }

    const itemVariationData = await db
      .select()
      .from(itemVariations)
      .where(eq(itemVariations.itemId, itemId))
      .limit(5);

    return successResponse(c, itemVariationData);
  },
);
catalogRoutes.get(
  "/:itemId/variations/:itemVarId",
  paramValidator(itemVarIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { itemId, itemVarId } = c.req.valid("param");
    const item = await db
      .select()
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);
    if (!item) throw new NotFoundError("Items");

    const membership = await db
      .select()
      .from(member)
      .where(eq(member.userId, user.id));
    if (!membership) {
      throw new ForbiddenError("You are not a member");
    }

    const itemVariationData = await db
      .select()
      .from(itemVariations)
      .where(
        and(
          eq(itemVariations.itemId, itemId),
          eq(itemVariations.id, itemVarId),
        ),
      )
      .limit(5);

    return successResponse(c, itemVariationData);
  },
);

catalogRoutes.patch(
  "/:itemId/variations/:itemVarId",
  paramValidator(itemVarIdParamSchema),
  jsonValidator(updateItemVariationSchema),
  async (c) => {
    const user = c.var.user!;
    const { itemId, itemVarId } = c.req.valid("param");
    const item = await db
      .select()
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);
    if (!item) throw new NotFoundError("Items");

    const membership = await db
      .select()
      .from(member)
      .where(eq(member.userId, user.id));
    if (!membership) {
      throw new ForbiddenError("You are not a member");
    }
    const updateItemVariationData = c.req.valid("json");
    const itemVariationData = await db
      .update(itemVariations)
      .set(updateItemVariationData)
      .returning({ id: itemVariations.id });
    return successResponse(c, itemVariationData);
  },
);
catalogRoutes.delete(
  "/:itemId/variations/:itemVarId",
  paramValidator(itemVarIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { itemId, itemVarId } = c.req.valid("param");
    const item = await db
      .select()
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);
    if (!item) throw new NotFoundError("Items");

    const membership = await db
      .select()
      .from(member)
      .where(eq(member.userId, user.id));
    if (!membership) {
      throw new ForbiddenError("You are not a member");
    }
    const itemVariationData = await db
      .delete(itemVariations)
      .where(
        and(
          eq(itemVariations.itemId, itemId),
          eq(itemVariations.id, itemVarId),
        ),
      );
    return successResponse(c, itemVariationData);
  },
);

export { catalogRoutes };

import { Hono } from "hono";
import { successResponse } from "../lib/response";
import { db } from "../db";
import { itemExtras, items, itemVariations, member, user } from "../db/schema";
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
const itemExtraIdParamSchema = z.object({
  itemId: z.number().positive(),
  extraId: z.number().positive(),
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

const createItemExtrasSchema = z.object({
  itemId: z.coerce.number(),
  name: z.string().min(1),
  price: z.string().refine((val) => !isNaN(Number(val))),
  status: z.enum(["active", "inactive"]).default("active"),
});

const updateItemExtraSchema = createItemExtrasSchema.partial();
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
catalogRoutes.post(
  "/:itemId/extras",
  paramValidator(itemIdParamSchema),
  jsonValidator(createItemExtrasSchema),
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
    const newItemExtras = c.req.valid("json");

    const itemExtra = await db
      .insert(itemExtras)
      .values(newItemExtras)
      .returning({ id: itemExtras.id });
    return successResponse(c, itemExtra);
  },
);

catalogRoutes.get(
  "/:itemId/extras",
  paramValidator(itemIdParamSchema),
  jsonValidator(createItemExtrasSchema),
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

    const itemExtra = await db
      .select()
      .from(itemExtras)
      .where(eq(itemExtras.itemId, itemId))
      .limit(5);
    return successResponse(c, itemExtra);
  },
);

catalogRoutes.get(
  "/:itemId/extras/:extraId",
  paramValidator(itemExtraIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { itemId, extraId } = c.req.valid("param");
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

    const extrasData = await db
      .select()
      .from(itemExtras)
      .where(and(eq(itemExtras.itemId, itemId), eq(itemExtras.id, extraId)));

    return successResponse(c, extrasData);
  },
);
catalogRoutes.patch(
  "/:itemId/extras/:extraId",
  paramValidator(itemExtraIdParamSchema),
  jsonValidator(updateItemExtraSchema),
  async (c) => {
    const user = c.var.user!;
    const { itemId, extraId } = c.req.valid("param");
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
    const updateExtra = c.req.valid("json");
    const extraData = await db
      .update(itemExtras)
      .set(updateExtra)
      .where(eq(itemExtras.id, extraId))
      .returning({ id: itemExtras.id });
    return successResponse(c, extraData);
  },
);

catalogRoutes.delete(
  ":/itemId/extras/:extraId",
  paramValidator(itemExtraIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { itemId, extraId } = c.req.valid("param");
    const item = await db.select().from(items).where(eq(items.id, itemId));
    if (!item) throw new NotFoundError("Items");
    const membership = await db
      .select()
      .from(member)
      .where(eq(member.userId, user.id));

    const extraData = await db
      .delete(itemExtras)
      .where(and(eq(itemExtras.itemId, itemId), eq(itemExtras.id, extraId)));
    return successResponse(c, extraData);
  },
);
export { catalogRoutes };

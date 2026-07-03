import { Hono } from "hono";
import z, { number } from "zod";
import { db } from "../db";
import { branches, diningTables, member } from "../db/schema";
import { AppEnv } from "../lib/factory";
import { successResponse } from "../lib/response";
import { jsonValidator, paramValidator } from "../lib/validator";
import { and, eq } from "drizzle-orm";
import { orgRepository } from "../repositories/org.repository";
import { ForbiddenError, NotFoundError } from "../lib/errors";

const branchRoutes = new Hono<AppEnv>();

// -----------------------schema------------
const branchIdParamSchema = z.object({
  branchId: z.coerce.number().positive(),
});
const tableIdParamSchema = z.object({
  branchId: z.coerce.number().positive(),
  tableId: z.coerce.number().positive(),
});

const createTablesSchema = z.object({
  // branchId: z.number().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  size: z.number().positive(),
  qrCode: z.string(),
  status: z.enum(["active", "inactive"]).default("active"),
});

const updateTablesSchema = createTablesSchema.partial();

////////////////masih pr
branchRoutes.post(
  "/:branchId/tables",
  paramValidator(branchIdParamSchema),
  jsonValidator(createTablesSchema),
  async (c) => {
    const user = c.var.user!;
    const { branchId } = c.req.valid("param");
    const [branch] = await db
      .select({
        branchId: branches.id,
      })
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);
    if (!branch) {
      throw new NotFoundError("branches");
    }
    const [membership] = await db
      .select()
      .from(member)
      .where(eq(member.userId, user.id))
      .limit(1);
    if (!membership) {
      throw new ForbiddenError("You are not a member");
    }

    const newTableData = c.req.valid("json");
    const [tableData] = await db
      .insert(diningTables)
      .values({
        branchId: branchId,
        ...newTableData,
      })
      .returning({ insertId: diningTables.id });
    return successResponse(c, tableData);
  },
);
branchRoutes.get(
  "/:branchId/tables",
  paramValidator(branchIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { branchId } = c.req.valid("param");
    const [branch] = await db
      .select({
        branchId: branches.id,
      })
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);
    if (!branch) {
      throw new NotFoundError("Branches");
    }
    const membership = await db
      .select()
      .from(member)
      .where(eq(member.userId, user.id));
    if (!membership) {
      throw new ForbiddenError("You are not a member");
    }
    const tabledata = await db.select().from(diningTables);
    return successResponse(c, tabledata);
  },
);
branchRoutes.get(
  "/:branchId/tables/:tableId",
  paramValidator(tableIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { branchId, tableId } = c.req.valid("param");
    const [branch] = await db
      .select({
        branchId: branches.id,
      })
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);
    if (!branch) {
      throw new NotFoundError("Branches");
    }
    const membership = await db
      .select()
      .from(member)
      .where(eq(member.userId, user.id));
    if (!membership) {
      throw new ForbiddenError("You are not a member");
    }
    const [tabledata] = await db
      .select()
      .from(diningTables)
      .where(
        and(eq(diningTables.branchId, branchId), eq(diningTables.id, tableId)),
      );

    return successResponse(c, tabledata);
  },
);
branchRoutes.patch(
  "/:branchId/tables/tableId",
  paramValidator(tableIdParamSchema),
  jsonValidator(updateTablesSchema),
  async (c) => {
    const user = c.var.user!;
    const { branchId, tableId } = c.req.valid("param");
    const updatetable = c.req.valid("json");
    const tabledata = await db
      .update(diningTables)
      .set(updatetable)
      .where(
        and(eq(diningTables.branchId, branchId), eq(diningTables.id, tableId)),
      );
    return successResponse(c, tabledata);
  },
);
branchRoutes.delete(
  "/:branchId/tables:/tableId",
  paramValidator(tableIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { branchId, tableId } = c.req.valid("param");
    const tabledata = await db
      .delete(diningTables)
      .where(
        and(eq(diningTables.branchId, branchId), eq(diningTables.id, tableId)),
      );
    return successResponse(c, tabledata);
  },
);

export { branchRoutes };

// table sudah dipakai

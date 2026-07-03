import { Hono } from "hono";
import z, { number } from "zod";
import { db } from "../db";
import { branches, diningTables, member } from "../db/schema";
import { AppEnv } from "../lib/factory";
import { successResponse } from "../lib/response";
import { jsonValidator, paramValidator } from "../lib/validator";
import { eq } from "drizzle-orm";
import { orgRepository } from "../repositories/org.repository";
import { ForbiddenError, NotFoundError } from "../lib/errors";

const branchRoutes = new Hono<AppEnv>();

// -----------------------schema------------
const branchIdParamSchema = z.object({
  branchId: z.coerce.number().positive(),
});

const createTablesSchema = z.object({
  branchId: z.number().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  size: z.number().positive(),
  qrCode: z.string(),
  status: z.enum(["active", "inactive"]).default("active"),
});

////////////////masih pr
branchRoutes.post(
  "/:branchId/tables",
  paramValidator(branchIdParamSchema),
  jsonValidator(createTablesSchema),
  async (c) => {
    const user = c.var.user!;
    const { branchId } = c.req.valid("param");
    const [membership] = await db
      .select()
      .from(member)
      .where(eq(member.userId, user.id))
      .limit(1);
    if (!membership) {
      throw new ForbiddenError("You are not a member");
    }
    const branch = await db
      .select({
        field1: branches.id,
      })
      .from(branches)
      .where(eq(branches.id, branchId));
    if (!branch) {
      throw new NotFoundError("branches");
    }
    const newTableData = c.req.valid("json");
    const tableData = await db
      .insert(diningTables)
      .values(newTableData)
      .returning({ insertTI: diningTables.id });
    return successResponse(c, tableData);
  },
);
branchRoutes.get(
  "/:branchId/tables",
  paramValidator(branchIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { branchId } = c.req.valid("param");
    return successResponse(c, `table data`);
  },
);
export { branchRoutes };

// table sudah dipakai

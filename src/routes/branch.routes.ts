import { Hono } from "hono";
import z, { number } from "zod";
import { db } from "../db";
import { diningTables } from "../db/schema";
import { AppEnv } from "../lib/factory";
import { successResponse } from "../lib/response";
import { jsonValidator, paramValidator } from "../lib/validator";

const branchRoutes = new Hono<AppEnv>();

// -----------------------schema------------
const branchIdParamSchema = z.object({
  branchId: z.string().min(1),
});

const createTablesSchema = z.object({
  branchId: z.number().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  size: z.number().positive(),
  qrCode: z.string(),
  status: z.enum(["active", "inactive"]).default("active"),
});

branchRoutes.post(
  "/:branchId/tables",
  paramValidator(branchIdParamSchema),
  jsonValidator(createTablesSchema),
  async (c) => {
    const user = c.var.user!;
    const { branchId } = c.req.valid("param");
    const newTableData = c.req.valid("json");
    const tableData = await db
      .insert(diningTables)
      .values(newTableData)
      .returning({ id: diningTables.id });
    return successResponse(c, `post branch`);
  },
);

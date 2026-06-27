import { Hono } from "hono";
import { AppEnv } from "../lib/factory";
import { and, eq } from "drizzle-orm";
import z, { string } from "zod";
import { jsonValidator, paramValidator } from "../lib/validator";
import { orders } from "../db/schema";
import { db } from "../db";

const orderRoutes = new Hono<AppEnv>();
const itemIdParamSchema = z.object({
  itemId: z.number().positive(),
});
const orderIdSchema = z.object({});
const createordersSchema = z.object({});

const orgIdParamSchema = z.object({
  orgId: z.string().min(1),
});

//====================================masuk file org.routes.ts============
orderRoutes.get(
  "/:itemId/public-menu",
  paramValidator(itemIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { itemId } = c.req.valid("param");
  },
);
orderRoutes.post(
  "/:orgId/orders",
  paramValidator(orgIdParamSchema),
  jsonValidator(),
  async (c) => {
    const user = c.var.user!;
    const { itemId } = c.req.valid("param");

    const newAddonData = c.req.valid("json");
    const data = await db.insert(orders);
  },
);
//============================================tutup========================

orderRoutes.get("/", paramValidator(itemIdParamSchema), async (c) => {
  const user = c.var.user!;
  const { itemId } = c.req.valid("param");
});
orderRoutes.get("/:orderId", paramValidator(itemIdParamSchema), async (c) => {
  const user = c.var.user!;
  const { itemId } = c.req.valid("param");
});

orderRoutes.patch(
  "/:orderId/status",
  paramValidator(itemIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { itemId } = c.req.valid("param");
  },
);
orderRoutes.patch(
  "/:orderId/transactions",
  paramValidator(itemIdParamSchema),
  async (c) => {
    const user = c.var.user!;
    const { itemId } = c.req.valid("param");
  },
);
export { orderRoutes };

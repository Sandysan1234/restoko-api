import { Hono } from "hono";
import { successResponse } from "../lib/response";
import { db } from "../db";
import { items, member, user } from "../db/schema";
import { AppEnv } from "../lib/factory";
import { eq } from "drizzle-orm";
import z, { string } from "zod";
import { jsonValidator } from "../lib/validator";
import { orgRepository } from "../repositories/org.repository";

const catalogRoutes = new Hono<AppEnv>();
// ─── Schemas ──────────────────────────────────────────────────────────────────

// ─── Routes ───────────────────────────────────────────────────────────────────

catalogRoutes.get("/", async (c) => {
  const user = c.var.user!;

  console.log(user.id);

  const cek = await db.select().from(member).where(eq(member.userId, user.id));
  const itemdata = await db.select().from(items);
  // console.log(itemdata);

  return successResponse(c, itemdata);
});
catalogRoutes.post("/", async (c) => {
  return successResponse(c, "post");
});
catalogRoutes.patch("/", (c) => {
  return successResponse(c, "patch");
});
catalogRoutes.delete("/", (c) => {
  return successResponse(c, "delete");
});

export { catalogRoutes };

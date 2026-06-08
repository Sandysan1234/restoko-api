import { Hono } from "hono";
import { successResponse } from "../lib/response";

const catalogRoutes = new Hono();

catalogRoutes.get("/", (c) => {
  return successResponse(c, "hello");
});

export { catalogRoutes };

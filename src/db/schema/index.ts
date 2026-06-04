// Re-export all schemas as a flat namespace.
// Better Auth's drizzleAdapter receives this entire object as the `schema` option.

// Auth (Better Auth managed — do not modify)
export * from "./auth.schema";

// Shared helpers & enums
export * from "./enums";
export * from "./_helpers";

// Business domains
export * from "./reference.schema";
export * from "./branch.schema";
export * from "./catalog.schema";
export * from "./order.schema";
export * from "./offer.schema";
export * from "./gateway.schema";
export * from "./cms.schema";
export * from "./notification.schema";
export * from "./system.schema";

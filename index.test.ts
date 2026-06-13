import { describe, expect, test } from "bun:test";
import { db } from "./src/db";
import { items, itemVariations, NewItem } from "./src/db/schema";
import { eq } from "drizzle-orm";

test("2 + 2", async () => {
  const data = await db.transaction(async (tx) => {
    const [item] = await tx
      .insert(items)
      .values({
        name: "Coffee Marinasi",
        slug: "coffee-marinasi",
        organizationId: `7a7a5e4c-33f4-45dd-9514-c78708abd7b6`,
        itemCategoryId: 1,
        price: `9000000`,
      })
      .returning();

    const [variation] = await tx
      .insert(itemVariations)
      .values({
        itemId: item.id,
        name: "Small",
        price: `18000`,
        itemAttributeId: 3,
      })
      .returning();

    return { item, variation };
  });

  expect(data).toBeDefined();
  expect(data.item.name).toBe("Coffee Marinasi");
  expect(data.variation.itemId).toBe(data.item.id);
  expect(data.variation.name).toBe("Small");
});
test("tes apapaun", async (c) => {
  const itemdata = await db.select().from(items);
  console.log(itemdata);
  expect(itemdata).toBe(itemdata);
});

import { expect, test } from "bun:test";
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

    await tx.insert(itemVariations).values({
      itemId: item.id,
      name: "Small",
      price: `18000`,
      itemAttributeId: 3,
    });

    await tx.insert(itemVariations).values({
      itemId: item.id,
      name: "Large",
      price: `22000`,
      itemAttributeId: 3,
    });
  });
  console.log(data);

  expect(data).toBe(data);
});

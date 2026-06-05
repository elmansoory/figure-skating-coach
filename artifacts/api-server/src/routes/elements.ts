import { Router } from "express";
import { db } from "@workspace/db";
import { elementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateElementBody,
  UpdateElementBody,
  UpdateElementParams,
  DeleteElementParams,
  ListElementsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/elements", async (req, res) => {
  const query = ListElementsQueryParams.safeParse(req.query);
  let elements = await db.select().from(elementsTable).orderBy(elementsTable.id);

  if (query.success) {
    if (query.data.sessionId) {
      elements = elements.filter((e) => e.sessionId === query.data.sessionId);
    }
  }

  res.json(elements.map((e) => ({
    ...e,
    executedScore: e.baseValue + e.goe,
    createdAt: e.createdAt.toISOString(),
  })));
});

router.post("/elements", async (req, res) => {
  const parsed = CreateElementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [element] = await db.insert(elementsTable).values(parsed.data).returning();
  res.status(201).json({
    ...element,
    executedScore: element.baseValue + element.goe,
    createdAt: element.createdAt.toISOString(),
  });
});

router.patch("/elements/:id", async (req, res) => {
  const params = UpdateElementParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateElementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [element] = await db
    .update(elementsTable)
    .set(parsed.data)
    .where(eq(elementsTable.id, params.data.id))
    .returning();
  if (!element) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    ...element,
    executedScore: element.baseValue + element.goe,
    createdAt: element.createdAt.toISOString(),
  });
});

router.delete("/elements/:id", async (req, res) => {
  const params = DeleteElementParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(elementsTable).where(eq(elementsTable.id, params.data.id));
  res.status(204).send();
});

export default router;

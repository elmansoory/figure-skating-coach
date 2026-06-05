import { Router } from "express";
import { db } from "@workspace/db";
import { athletesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateAthleteBody,
  UpdateAthleteBody,
  GetAthleteParams,
  UpdateAthleteParams,
  DeleteAthleteParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/athletes", async (_req, res) => {
  const athletes = await db.select().from(athletesTable).orderBy(athletesTable.id);
  res.json(athletes.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  })));
});

router.post("/athletes", async (req, res) => {
  const parsed = CreateAthleteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [athlete] = await db.insert(athletesTable).values(parsed.data).returning();
  res.status(201).json({ ...athlete, createdAt: athlete.createdAt.toISOString() });
});

router.get("/athletes/:id", async (req, res) => {
  const params = GetAthleteParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [athlete] = await db.select().from(athletesTable).where(eq(athletesTable.id, params.data.id));
  if (!athlete) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...athlete, createdAt: athlete.createdAt.toISOString() });
});

router.patch("/athletes/:id", async (req, res) => {
  const params = UpdateAthleteParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateAthleteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [athlete] = await db
    .update(athletesTable)
    .set(parsed.data)
    .where(eq(athletesTable.id, params.data.id))
    .returning();
  if (!athlete) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...athlete, createdAt: athlete.createdAt.toISOString() });
});

router.delete("/athletes/:id", async (req, res) => {
  const params = DeleteAthleteParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(athletesTable).where(eq(athletesTable.id, params.data.id));
  res.status(204).send();
});

export default router;

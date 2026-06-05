import { Router } from "express";
import { db } from "@workspace/db";
import { sessionsTable, athletesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateSessionBody,
  UpdateSessionBody,
  GetSessionParams,
  UpdateSessionParams,
  DeleteSessionParams,
  ListSessionsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/sessions", async (req, res) => {
  const query = ListSessionsQueryParams.safeParse(req.query);
  const sessions = await db.select().from(sessionsTable).orderBy(sessionsTable.id);
  const athletes = await db.select({ id: athletesTable.id, name: athletesTable.name }).from(athletesTable);
  const athleteMap = new Map(athletes.map((a) => [a.id, a.name]));

  const filtered = query.success && query.data.athleteId
    ? sessions.filter((s) => s.athleteId === query.data.athleteId)
    : sessions;

  res.json(filtered.map((s) => ({
    ...s,
    athleteName: athleteMap.get(s.athleteId) ?? null,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/sessions", async (req, res) => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db.insert(sessionsTable).values(parsed.data).returning();
  const [athlete] = await db.select({ name: athletesTable.name }).from(athletesTable).where(eq(athletesTable.id, session.athleteId));
  res.status(201).json({
    ...session,
    athleteName: athlete?.name ?? null,
    createdAt: session.createdAt.toISOString(),
  });
});

router.get("/sessions/:id", async (req, res) => {
  const params = GetSessionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, params.data.id));
  if (!session) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [athlete] = await db.select({ name: athletesTable.name }).from(athletesTable).where(eq(athletesTable.id, session.athleteId));
  res.json({
    ...session,
    athleteName: athlete?.name ?? null,
    createdAt: session.createdAt.toISOString(),
  });
});

router.patch("/sessions/:id", async (req, res) => {
  const params = UpdateSessionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db
    .update(sessionsTable)
    .set(parsed.data)
    .where(eq(sessionsTable.id, params.data.id))
    .returning();
  if (!session) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [athlete] = await db.select({ name: athletesTable.name }).from(athletesTable).where(eq(athletesTable.id, session.athleteId));
  res.json({
    ...session,
    athleteName: athlete?.name ?? null,
    createdAt: session.createdAt.toISOString(),
  });
});

router.delete("/sessions/:id", async (req, res) => {
  const params = DeleteSessionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(sessionsTable).where(eq(sessionsTable.id, params.data.id));
  res.status(204).send();
});

export default router;

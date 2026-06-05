import { Router } from "express";
import { db } from "@workspace/db";
import { trainingProgramsTable, athletesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateTrainingProgramBody,
  UpdateTrainingProgramBody,
  GetTrainingProgramParams,
  UpdateTrainingProgramParams,
  DeleteTrainingProgramParams,
  ListTrainingProgramsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/training-programs", async (req, res) => {
  const query = ListTrainingProgramsQueryParams.safeParse(req.query);
  let programs = await db.select().from(trainingProgramsTable).orderBy(trainingProgramsTable.id);
  const athletes = await db.select({ id: athletesTable.id, name: athletesTable.name }).from(athletesTable);
  const athleteMap = new Map(athletes.map((a) => [a.id, a.name]));

  if (query.success) {
    if (query.data.athleteId) {
      programs = programs.filter((p) => p.athleteId === query.data.athleteId);
    }
    if (query.data.type) {
      programs = programs.filter((p) => p.type === query.data.type);
    }
  }

  res.json(programs.map((p) => ({
    ...p,
    athleteName: p.athleteId ? (athleteMap.get(p.athleteId) ?? null) : null,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/training-programs", async (req, res) => {
  const parsed = CreateTrainingProgramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [program] = await db.insert(trainingProgramsTable).values(parsed.data).returning();
  const athlete = program.athleteId
    ? await db.select({ name: athletesTable.name }).from(athletesTable).where(eq(athletesTable.id, program.athleteId)).then((r) => r[0])
    : null;
  res.status(201).json({
    ...program,
    athleteName: athlete?.name ?? null,
    createdAt: program.createdAt.toISOString(),
  });
});

router.get("/training-programs/:id", async (req, res) => {
  const params = GetTrainingProgramParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [program] = await db.select().from(trainingProgramsTable).where(eq(trainingProgramsTable.id, params.data.id));
  if (!program) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const athlete = program.athleteId
    ? await db.select({ name: athletesTable.name }).from(athletesTable).where(eq(athletesTable.id, program.athleteId)).then((r) => r[0])
    : null;
  res.json({
    ...program,
    athleteName: athlete?.name ?? null,
    createdAt: program.createdAt.toISOString(),
  });
});

router.patch("/training-programs/:id", async (req, res) => {
  const params = UpdateTrainingProgramParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateTrainingProgramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [program] = await db
    .update(trainingProgramsTable)
    .set(parsed.data)
    .where(eq(trainingProgramsTable.id, params.data.id))
    .returning();
  if (!program) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const athlete = program.athleteId
    ? await db.select({ name: athletesTable.name }).from(athletesTable).where(eq(athletesTable.id, program.athleteId)).then((r) => r[0])
    : null;
  res.json({
    ...program,
    athleteName: athlete?.name ?? null,
    createdAt: program.createdAt.toISOString(),
  });
});

router.delete("/training-programs/:id", async (req, res) => {
  const params = DeleteTrainingProgramParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(trainingProgramsTable).where(eq(trainingProgramsTable.id, params.data.id));
  res.status(204).send();
});

export default router;

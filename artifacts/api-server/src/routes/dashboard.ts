import { Router } from "express";
import { db } from "@workspace/db";
import { athletesTable, sessionsTable, elementsTable, trainingProgramsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { GetAthleteProgressParams, GetElementStatsParams } from "@workspace/api-zod";

const router = Router();

router.get("/dashboard/summary", async (_req, res) => {
  const athletes = await db.select().from(athletesTable).orderBy(desc(athletesTable.personalBestScore));
  const sessions = await db.select().from(sessionsTable).orderBy(desc(sessionsTable.id));
  const programs = await db.select({ id: trainingProgramsTable.id }).from(trainingProgramsTable);

  const scoredSessions = sessions.filter((s) => s.totalScore != null);
  const avgScore = scoredSessions.length > 0
    ? scoredSessions.reduce((sum, s) => sum + (s.totalScore ?? 0), 0) / scoredSessions.length
    : 0;

  const athleteMap = new Map(athletes.map((a) => [a.id, a.name]));
  const recentSessions = sessions.slice(0, 5).map((s) => ({
    ...s,
    athleteName: athleteMap.get(s.athleteId) ?? null,
    createdAt: s.createdAt.toISOString(),
  }));

  const topAthletes = athletes
    .filter((a) => a.personalBestScore != null)
    .slice(0, 5)
    .map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }));

  res.json({
    totalAthletes: athletes.length,
    totalSessions: sessions.length,
    totalTrainingPrograms: programs.length,
    avgScore: Math.round(avgScore * 100) / 100,
    recentSessions,
    topAthletes,
  });
});

router.get("/dashboard/athlete-progress/:athleteId", async (req, res) => {
  const params = GetAthleteProgressParams.safeParse({ athleteId: Number(req.params.athleteId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid athleteId" });
    return;
  }
  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.athleteId, params.data.athleteId))
    .orderBy(sessionsTable.date);

  const points = sessions
    .filter((s) => s.totalScore != null)
    .map((s) => ({
      date: s.date,
      totalScore: s.totalScore ?? 0,
      technicalScore: s.technicalScore ?? null,
      componentScore: s.componentScore ?? null,
      sessionType: s.sessionType,
    }));

  res.json(points);
});

router.get("/dashboard/element-stats/:athleteId", async (req, res) => {
  const params = GetElementStatsParams.safeParse({ athleteId: Number(req.params.athleteId) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid athleteId" });
    return;
  }

  const sessions = await db
    .select({ id: sessionsTable.id })
    .from(sessionsTable)
    .where(eq(sessionsTable.athleteId, params.data.athleteId));

  const sessionIds = sessions.map((s) => s.id);
  if (sessionIds.length === 0) {
    res.json([]);
    return;
  }

  const elements = await db.select().from(elementsTable);
  const filtered = elements.filter((e) => sessionIds.includes(e.sessionId));

  const statsMap = new Map<string, { code: string; type: string; goeSum: number; baseSum: number; count: number; successCount: number }>();
  for (const el of filtered) {
    const key = el.elementCode;
    if (!statsMap.has(key)) {
      statsMap.set(key, { code: el.elementCode, type: el.elementType, goeSum: 0, baseSum: 0, count: 0, successCount: 0 });
    }
    const stat = statsMap.get(key)!;
    stat.count++;
    stat.goeSum += el.goe;
    stat.baseSum += el.baseValue;
    if (!el.isFallDown && !el.isUnderRotated) stat.successCount++;
  }

  const result = Array.from(statsMap.values()).map((s) => ({
    elementCode: s.code,
    elementType: s.type,
    attempts: s.count,
    successRate: Math.round((s.successCount / s.count) * 100),
    avgGoe: Math.round((s.goeSum / s.count) * 100) / 100,
    avgBaseValue: Math.round((s.baseSum / s.count) * 100) / 100,
  }));

  res.json(result);
});

export default router;

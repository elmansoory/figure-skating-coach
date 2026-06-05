import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionsTable = pgTable("performance_sessions", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  sessionType: text("session_type").notNull(),
  date: text("date").notNull(),
  totalScore: real("total_score"),
  technicalScore: real("technical_score"),
  componentScore: real("component_score"),
  deductions: real("deductions"),
  venue: text("venue"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;

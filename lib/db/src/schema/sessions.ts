import { pgTable, serial, integer, text, real, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { athletesTable } from "./athletes";

export const sessionsTable = pgTable("performance_sessions", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id")
    .notNull()
    .references(() => athletesTable.id, { onDelete: "cascade" }),
  sessionType: text("session_type").notNull(),
  date: text("date").notNull(),
  totalScore: real("total_score"),
  technicalScore: real("technical_score"),
  componentScore: real("component_score"),
  deductions: real("deductions"),
  venue: text("venue"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("performance_sessions_athlete_id_idx").on(t.athleteId)]);

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;

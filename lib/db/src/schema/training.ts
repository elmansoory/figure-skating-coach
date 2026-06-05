import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trainingProgramsTable = pgTable("training_programs", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id"),
  title: text("title").notNull(),
  type: text("type").notNull(),
  duration: integer("duration").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  focus: text("focus"),
  exercises: text("exercises").notNull().default("[]"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTrainingProgramSchema = createInsertSchema(trainingProgramsTable).omit({ id: true, createdAt: true });
export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;
export type TrainingProgram = typeof trainingProgramsTable.$inferSelect;

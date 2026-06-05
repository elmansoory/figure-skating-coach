import { pgTable, serial, integer, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const elementsTable = pgTable("skating_elements", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  elementCode: text("element_code").notNull(),
  elementType: text("element_type").notNull(),
  baseValue: real("base_value").notNull(),
  goe: real("goe").notNull().default(0),
  isUnderRotated: boolean("is_under_rotated").notNull().default(false),
  isFallDown: boolean("is_fall_down").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertElementSchema = createInsertSchema(elementsTable).omit({ id: true, createdAt: true });
export type InsertElement = z.infer<typeof insertElementSchema>;
export type Element = typeof elementsTable.$inferSelect;

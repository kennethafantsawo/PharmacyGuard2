import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const pharmacies = pgTable("pharmacies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weeklySchedules = pgTable("weekly_schedules", {
  id: serial("id").primaryKey(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pharmacySchedules = pgTable("pharmacy_schedules", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmacies.id),
  scheduleId: integer("schedule_id").notNull().references(() => weeklySchedules.id),
});

export const pharmaciesRelations = relations(pharmacies, ({ many }) => ({
  pharmacySchedules: many(pharmacySchedules),
}));

export const weeklySchedulesRelations = relations(weeklySchedules, ({ many }) => ({
  pharmacySchedules: many(pharmacySchedules),
}));

export const pharmacySchedulesRelations = relations(pharmacySchedules, ({ one }) => ({
  pharmacy: one(pharmacies, {
    fields: [pharmacySchedules.pharmacyId],
    references: [pharmacies.id],
  }),
  schedule: one(weeklySchedules, {
    fields: [pharmacySchedules.scheduleId],
    references: [weeklySchedules.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPharmacySchema = createInsertSchema(pharmacies).omit({
  id: true,
  createdAt: true,
});

export const insertWeeklyScheduleSchema = createInsertSchema(weeklySchedules).omit({
  id: true,
  createdAt: true,
});

export const insertPharmacyScheduleSchema = createInsertSchema(pharmacySchedules).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPharmacy = z.infer<typeof insertPharmacySchema>;
export type Pharmacy = typeof pharmacies.$inferSelect;
export type InsertWeeklySchedule = z.infer<typeof insertWeeklyScheduleSchema>;
export type WeeklySchedule = typeof weeklySchedules.$inferSelect;
export type InsertPharmacySchedule = z.infer<typeof insertPharmacyScheduleSchema>;
export type PharmacySchedule = typeof pharmacySchedules.$inferSelect;

export type PharmacyWithSchedule = Pharmacy & {
  schedules: WeeklySchedule[];
};

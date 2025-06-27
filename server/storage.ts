import { 
  users, pharmacies, weeklySchedules, pharmacySchedules,
  type User, type InsertUser, type Pharmacy, type InsertPharmacy,
  type WeeklySchedule, type InsertWeeklySchedule, type PharmacyWithSchedule
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, like, or, desc } from "drizzle-orm";

interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  // Pharmacy methods
  getPharmaciesForCurrentWeek(date: Date): Promise<Pharmacy[]>;
  searchPharmacies(query: string): Promise<Pharmacy[]>;
  getAllPharmacies(): Promise<Pharmacy[]>;
  createPharmacyWithSchedule(pharmacy: Omit<InsertPharmacy, 'id' | 'createdAt'>, schedule: InsertWeeklySchedule): Promise<void>;
  clearAllData(): Promise<void>;
  getPharmacyCount(): Promise<number>;
  getLastUpdateTime(): Promise<Date | null>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getPharmaciesForCurrentWeek(date: Date): Promise<Pharmacy[]> {
    const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const result = await db
      .select({
        id: pharmacies.id,
        name: pharmacies.name,
        location: pharmacies.location,
        phone: pharmacies.phone,
        whatsapp: pharmacies.whatsapp,
        latitude: pharmacies.latitude,
        longitude: pharmacies.longitude,
        createdAt: pharmacies.createdAt,
      })
      .from(pharmacies)
      .innerJoin(pharmacySchedules, eq(pharmacies.id, pharmacySchedules.pharmacyId))
      .innerJoin(weeklySchedules, eq(pharmacySchedules.scheduleId, weeklySchedules.id))
      .where(
        and(
          lte(weeklySchedules.startDate, currentDate.toISOString().split('T')[0]),
          gte(weeklySchedules.endDate, currentDate.toISOString().split('T')[0])
        )
      );

    return result;
  }

  async searchPharmacies(query: string): Promise<Pharmacy[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const result = await db
      .select()
      .from(pharmacies)
      .where(
        or(
          like(pharmacies.name, searchTerm),
          like(pharmacies.location, searchTerm)
        )
      );

    return result;
  }

  async getAllPharmacies(): Promise<Pharmacy[]> {
    return await db.select().from(pharmacies);
  }

  async createPharmacyWithSchedule(
    pharmacy: Omit<InsertPharmacy, 'id' | 'createdAt'>, 
    schedule: InsertWeeklySchedule
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Insert or get existing pharmacy
      const [existingPharmacy] = await tx
        .select()
        .from(pharmacies)
        .where(
          and(
            eq(pharmacies.name, pharmacy.name),
            eq(pharmacies.location, pharmacy.location)
          )
        );

      let pharmacyId: number;
      
      if (existingPharmacy) {
        pharmacyId = existingPharmacy.id;
      } else {
        const [newPharmacy] = await tx
          .insert(pharmacies)
          .values(pharmacy)
          .returning({ id: pharmacies.id });
        pharmacyId = newPharmacy.id;
      }

      // Insert or get existing schedule
      const [existingSchedule] = await tx
        .select()
        .from(weeklySchedules)
        .where(
          and(
            eq(weeklySchedules.startDate, schedule.startDate),
            eq(weeklySchedules.endDate, schedule.endDate)
          )
        );

      let scheduleId: number;
      
      if (existingSchedule) {
        scheduleId = existingSchedule.id;
      } else {
        const [newSchedule] = await tx
          .insert(weeklySchedules)
          .values(schedule)
          .returning({ id: weeklySchedules.id });
        scheduleId = newSchedule.id;
      }

      // Link pharmacy to schedule
      await tx
        .insert(pharmacySchedules)
        .values({
          pharmacyId,
          scheduleId
        })
        .onConflictDoNothing();
    });
  }

  async clearAllData(): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(pharmacySchedules);
      await tx.delete(weeklySchedules);
      await tx.delete(pharmacies);
    });
  }

  async getPharmacyCount(): Promise<number> {
    const result = await db
      .select({ count: pharmacies.id })
      .from(pharmacies);
    return result.length;
  }

  async getLastUpdateTime(): Promise<Date | null> {
    const [result] = await db
      .select({ createdAt: pharmacies.createdAt })
      .from(pharmacies)
      .orderBy(desc(pharmacies.createdAt))
      .limit(1);
    
    return result?.createdAt || null;
  }
}

export const storage = new DatabaseStorage();
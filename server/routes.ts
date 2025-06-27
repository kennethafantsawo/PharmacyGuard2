import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as XLSX from "xlsx";
import { z } from "zod";
import { insertPharmacySchema, insertWeeklyScheduleSchema } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

const xlsxRowSchema = z.object({
  nom: z.string(),
  localisation: z.string(),
  telephone: z.string(),
  whatsapp: z.string(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  dateDebut: z.string(),
  dateFin: z.string(),
});

// Simple admin authentication middleware
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const authenticateAdmin = (req: any, res: any, next: any) => {
  const { password } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin authentication endpoint
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true, message: "Connexion réussie" });
    } else {
      res.status(401).json({ error: "Mot de passe incorrect" });
    }
  });

  // Get current week's pharmacies
  app.get("/api/pharmacies/current-week", async (req, res) => {
    try {
      const now = new Date();
      const pharmacies = await storage.getPharmaciesForCurrentWeek(now);
      res.json(pharmacies);
    } catch (error) {
      console.error("Error fetching current week pharmacies:", error);
      res.status(500).json({ error: "Failed to fetch pharmacies" });
    }
  });

  // Search pharmacies
  app.get("/api/pharmacies/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }
      const pharmacies = await storage.searchPharmacies(q);
      res.json(pharmacies);
    } catch (error) {
      console.error("Error searching pharmacies:", error);
      res.status(500).json({ error: "Failed to search pharmacies" });
    }
  });

  // Upload XLSX file (protected)
  app.post("/api/admin/upload-xlsx", upload.single("file"), authenticateAdmin, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const processedData: Array<{
        pharmacy: {
          name: string;
          location: string;
          phone: string;
          whatsapp: string;
          latitude?: string;
          longitude?: string;
        };
        schedule: {
          startDate: string;
          endDate: string;
        };
      }> = [];

      for (const row of data) {
        try {
          const validatedRow = xlsxRowSchema.parse(row);
          processedData.push({
            pharmacy: {
              name: validatedRow.nom,
              location: validatedRow.localisation,
              phone: validatedRow.telephone,
              whatsapp: validatedRow.whatsapp,
              latitude: validatedRow.latitude,
              longitude: validatedRow.longitude,
            },
            schedule: {
              startDate: validatedRow.dateDebut,
              endDate: validatedRow.dateFin,
            },
          });
        } catch (error) {
          console.warn("Skipping invalid row:", row, error);
        }
      }

      if (processedData.length === 0) {
        return res.status(400).json({ error: "No valid data found in the uploaded file" });
      }

      // Clear existing data and insert new data
      await storage.clearAllData();
      
      for (const item of processedData) {
        await storage.createPharmacyWithSchedule(item.pharmacy, item.schedule);
      }

      res.json({ 
        message: "File processed successfully", 
        processedCount: processedData.length 
      });
    } catch (error) {
      console.error("Error processing XLSX file:", error);
      res.status(500).json({ error: "Failed to process file" });
    }
  });

  // Get all pharmacies (admin, protected)
  app.post("/api/admin/pharmacies", authenticateAdmin, async (req, res) => {
    try {
      const pharmacies = await storage.getAllPharmacies();
      res.json(pharmacies);
    } catch (error) {
      console.error("Error fetching all pharmacies:", error);
      res.status(500).json({ error: "Failed to fetch pharmacies" });
    }
  });

  // Get upload status (protected)
  app.post("/api/admin/status", authenticateAdmin, async (req, res) => {
    try {
      const count = await storage.getPharmacyCount();
      const lastUpdate = await storage.getLastUpdateTime();
      res.json({ 
        pharmacyCount: count,
        lastUpdate: lastUpdate?.toISOString() || null,
        isValid: count > 0
      });
    } catch (error) {
      console.error("Error fetching admin status:", error);
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
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

// WebSocket clients for real-time updates
let wsClients: Set<any> = new Set();

// Broadcast update to all connected clients
function broadcastDataUpdate(data: any) {
  const message = JSON.stringify({
    type: "PHARMACY_DATA_UPDATED",
    data: data,
    timestamp: new Date().toISOString()
  });
  
  wsClients.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server on a different port to avoid conflicts with Vite
  const wss = new WebSocketServer({ port: 8080 });
  
  wss.on('connection', (ws) => {
    wsClients.add(ws);
    console.log('New WebSocket connection. Total clients:', wsClients.size);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: "CONNECTION_ESTABLISHED",
      message: "Connexion établie pour les mises à jour en temps réel"
    }));
    
    ws.on('close', () => {
      wsClients.delete(ws);
      console.log('WebSocket connection closed. Total clients:', wsClients.size);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    });
  });
  
  console.log('WebSocket server running on port 8080');
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

      // Get updated data for broadcast
      const now = new Date();
      const updatedPharmacies = await storage.getPharmaciesForCurrentWeek(now);
      
      // Broadcast update to all connected clients
      broadcastDataUpdate(updatedPharmacies);

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

  return httpServer;
}

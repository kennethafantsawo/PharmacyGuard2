import * as XLSX from 'xlsx';

export interface PharmacyData {
  nom: string;
  localisation: string;
  telephone: string;
  whatsapp: string;
  dateDebut: string;
  dateFin: string;
  latitude?: string;
  longitude?: string;
}

export function processXLSXFile(file: File): Promise<PharmacyData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const processedData: PharmacyData[] = [];
        
        for (const row of jsonData) {
          try {
            // Validate required fields
            const pharmacy = row as any;
            if (
              pharmacy.nom &&
              pharmacy.localisation &&
              pharmacy.telephone &&
              pharmacy.whatsapp &&
              pharmacy.dateDebut &&
              pharmacy.dateFin
            ) {
              processedData.push({
                nom: String(pharmacy.nom).trim(),
                localisation: String(pharmacy.localisation).trim(),
                telephone: String(pharmacy.telephone).trim(),
                whatsapp: String(pharmacy.whatsapp).trim(),
                dateDebut: String(pharmacy.dateDebut).trim(),
                dateFin: String(pharmacy.dateFin).trim(),
                latitude: pharmacy.latitude ? String(pharmacy.latitude).trim() : undefined,
                longitude: pharmacy.longitude ? String(pharmacy.longitude).trim() : undefined,
              });
            }
          } catch (error) {
            console.warn('Skipping invalid row:', row, error);
          }
        }
        
        if (processedData.length === 0) {
          reject(new Error('Aucune donnée valide trouvée dans le fichier'));
        } else {
          resolve(processedData);
        }
      } catch (error) {
        reject(new Error('Erreur lors du traitement du fichier Excel'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
    
    reader.readAsBinaryString(file);
  });
}

export function validatePharmacyData(data: any[]): PharmacyData[] {
  const required = ['nom', 'localisation', 'telephone', 'whatsapp', 'dateDebut', 'dateFin'];
  
  return data.filter(item => {
    return required.every(field => item[field] && String(item[field]).trim());
  }).map(item => ({
    nom: String(item.nom).trim(),
    localisation: String(item.localisation).trim(),
    telephone: String(item.telephone).trim(),
    whatsapp: String(item.whatsapp).trim(),
    dateDebut: String(item.dateDebut).trim(),
    dateFin: String(item.dateFin).trim(),
    latitude: item.latitude ? String(item.latitude).trim() : undefined,
    longitude: item.longitude ? String(item.longitude).trim() : undefined,
  }));
}

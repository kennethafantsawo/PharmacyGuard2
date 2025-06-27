import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Upload, CheckCircle, AlertCircle, FileSpreadsheet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLogin from "@/components/admin-login";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  standalone?: boolean;
}

interface AdminStatus {
  pharmacyCount: number;
  lastUpdate: string | null;
  isValid: boolean;
}

export default function AdminPanel({ isOpen, onClose, standalone = false }: AdminPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, login, logout, getAuthenticatedApiRequest } = useAdminAuth();

  // Show login form if not authenticated
  if (!isAuthenticated) {
    if (standalone) {
      return (
        <div className="pwa-container">
          <AdminLogin onLogin={login} isLoading={authLoading} />
        </div>
      );
    }
    
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 z-50 admin-panel">
        <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Administration</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <AdminLogin onLogin={login} isLoading={authLoading} />
          </div>
        </div>
      </div>
    );
  }

  const { data: status } = useQuery<AdminStatus>({
    queryKey: ["/api/admin/status"],
    queryFn: async () => {
      const response = await getAuthenticatedApiRequest("POST", "/api/admin/status");
      return response.json();
    },
    enabled: (isOpen || standalone) && isAuthenticated,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await getAuthenticatedApiRequest("POST", "/api/admin/upload-xlsx", formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Succès",
        description: `Fichier traité avec succès. ${data.processedCount} pharmacies importées.`,
      });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/pharmacies/current-week"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du traitement du fichier",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: "Format invalide",
          description: "Veuillez sélectionner un fichier Excel (.xlsx ou .xls)",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  if (!isOpen && !standalone) return null;

  const content = (
    <div className="space-y-4">
      {/* Logout button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Panneau d'administration</h3>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span>Importer le fichier XLSX</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              Sélectionnez votre fichier Excel
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Formats acceptés: .xlsx, .xls
            </p>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="xlsx-upload" className="sr-only">
                  Fichier XLSX
                </Label>
                <Input
                  id="xlsx-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => document.getElementById('xlsx-upload')?.click()}
                  variant="outline"
                  className="w-full"
                >
                  Choisir le fichier
                </Button>
              </div>
              
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  <p>Fichier sélectionné: {selectedFile.name}</p>
                  <p>Taille: {(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              )}
              
              {selectedFile && (
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="w-full"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Importer
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statut des données</CardTitle>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Nombre de pharmacies:</span>
                <span className="text-sm">{status.pharmacyCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dernière mise à jour:</span>
                <span className="text-sm">
                  {status.lastUpdate 
                    ? new Date(status.lastUpdate).toLocaleString('fr-FR')
                    : 'Aucune'
                  }
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {status.isValid ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700">Données valides</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-700">Aucune donnée</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Format attendu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Colonnes requises:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>nom - Nom de la pharmacie</li>
              <li>localisation - Adresse ou quartier</li>
              <li>telephone - Numéro de téléphone</li>
              <li>whatsapp - Numéro WhatsApp</li>
              <li>dateDebut - Date de début (YYYY-MM-DD)</li>
              <li>dateFin - Date de fin (YYYY-MM-DD)</li>
              <li>latitude - Coordonnée latitude (optionnel)</li>
              <li>longitude - Coordonnée longitude (optionnel)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (standalone) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 admin-panel">
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Administration</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          {content}
        </div>
      </div>
    </div>
  );
}

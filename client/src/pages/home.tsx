import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Settings, MapPin, List, Map, Wifi, WifiOff } from "lucide-react";
import PharmacyCard from "@/components/pharmacy-card";
import PharmacyMap from "@/components/pharmacy-map";
import SearchBar from "@/components/search-bar";
import AdminPanel from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Pharmacy } from "@shared/schema";
import { getCurrentWeekText, scheduleWeeklyUpdate } from "@/lib/pharmacy-utils";
import { useWebSocketSync } from "@/hooks/useWebSocketSync";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapView, setIsMapView] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekText());
  
  // WebSocket sync for real-time updates
  const { isConnected, lastUpdate } = useWebSocketSync();

  const { data: pharmacies = [], isLoading, error } = useQuery<Pharmacy[]>({
    queryKey: ["/api/pharmacies/current-week"],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { data: searchResults = [] } = useQuery<Pharmacy[]>({
    queryKey: ["/api/pharmacies/search", searchQuery],
    queryFn: () => {
      if (!searchQuery.trim()) return Promise.resolve([]);
      return fetch(`/api/pharmacies/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json());
    },
    enabled: searchQuery.length > 2,
  });

  const displayedPharmacies = searchQuery.length > 2 ? searchResults : pharmacies;

  useEffect(() => {
    // Update current week display
    const updateWeek = () => setCurrentWeek(getCurrentWeekText());
    updateWeek();
    
    // Schedule weekly updates at 7:00 AM
    scheduleWeeklyUpdate(updateWeek);
    
    // Update every minute to check for 7:00 AM
    const interval = setInterval(updateWeek, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (whatsapp: string) => {
    window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`, '_blank');
  };

  if (error) {
    return (
      <div className="pwa-container">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <p className="text-destructive mb-4">Erreur lors du chargement des pharmacies</p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pwa-container">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-lg relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Pharmacies de Garde</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm opacity-90">{currentWeek}</p>
                <Badge 
                  variant={isConnected ? "secondary" : "outline"}
                  className="flex items-center gap-1 text-xs px-2 py-0.5"
                >
                  {isConnected ? (
                    <><Wifi className="w-3 h-3" /> En ligne</>
                  ) : (
                    <><WifiOff className="w-3 h-3" /> Hors ligne</>
                  )}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAdminOpen(true)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="p-4 bg-white shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Rechercher par nom ou localisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl border-border"
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-muted-foreground">
            {displayedPharmacies.length} pharmacies{searchQuery ? ' trouvées' : ' de garde'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMapView(!isMapView)}
            className="text-primary hover:text-primary/80"
          >
            {isMapView ? <List className="w-4 h-4 mr-2" /> : <Map className="w-4 h-4 mr-2" />}
            {isMapView ? 'Liste' : 'Carte'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isMapView ? (
        <PharmacyMap
          pharmacies={displayedPharmacies}
          onClose={() => setIsMapView(false)}
        />
      ) : (
        <div className="flex-1 overflow-y-auto pb-20 pharmacy-list">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : displayedPharmacies.length === 0 ? (
            <div className="text-center p-8">
              <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? 'Aucune pharmacie trouvée' : 'Aucune pharmacie de garde'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Essayez avec d\'autres termes de recherche'
                  : 'Vérifiez que les données sont à jour dans l\'administration'
                }
              </p>
            </div>
          ) : (
            displayedPharmacies.map((pharmacy) => (
              <PharmacyCard
                key={pharmacy.id}
                pharmacy={pharmacy}
                onCall={handleCall}
                onWhatsApp={handleWhatsApp}
              />
            ))
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-border px-4 py-2">
        <div className="flex items-center justify-around">
          <Button
            variant={!isMapView ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsMapView(false)}
            className="flex flex-col items-center space-y-1 p-2 h-auto"
          >
            <List className="w-4 h-4" />
            <span className="text-xs font-medium">Liste</span>
          </Button>
          <Button
            variant={isMapView ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsMapView(true)}
            className="flex flex-col items-center space-y-1 p-2 h-auto"
          >
            <Map className="w-4 h-4" />
            <span className="text-xs font-medium">Carte</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdminOpen(true)}
            className="flex flex-col items-center space-y-1 p-2 h-auto"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs font-medium">Admin</span>
          </Button>
        </div>
      </div>

      {/* Admin Panel */}
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
}

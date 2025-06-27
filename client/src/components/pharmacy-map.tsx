import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pharmacy } from "@shared/schema";

interface PharmacyMapProps {
  pharmacies: Pharmacy[];
  onClose: () => void;
}

export default function PharmacyMap({ pharmacies, onClose }: PharmacyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Import Leaflet dynamically
    import('leaflet').then((L) => {
      if (!mapRef.current) return;

      // Initialize map
      const map = L.map(mapRef.current).setView([33.5731, -7.5898], 13); // Casablanca coordinates
      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add pharmacy markers
      pharmacies.forEach((pharmacy) => {
        if (pharmacy.latitude && pharmacy.longitude) {
          const lat = parseFloat(pharmacy.latitude);
          const lng = parseFloat(pharmacy.longitude);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            const marker = L.marker([lat, lng]).addTo(map);
            
            marker.bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold text-sm mb-1">${pharmacy.name}</h3>
                <p class="text-xs text-gray-600 mb-2">${pharmacy.location}</p>
                <div class="flex space-x-2">
                  <a href="tel:${pharmacy.phone}" class="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                    📞 Appeler
                  </a>
                  <a href="https://wa.me/${pharmacy.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" class="text-xs bg-green-500 text-white px-2 py-1 rounded">
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            `);
          }
        }
      });

      // Try to get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            L.marker([latitude, longitude], {
              icon: L.divIcon({
                className: 'user-location-marker',
                html: '<div style="background: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                iconSize: [16, 16]
              })
            }).addTo(map).bindPopup('Votre position');
            
            // Center map on user location if no pharmacies have coordinates
            const hasCoordinates = pharmacies.some(p => p.latitude && p.longitude);
            if (!hasCoordinates) {
              map.setView([latitude, longitude], 15);
            }
          },
          (error) => {
            console.warn('Geolocation error:', error);
          }
        );
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pharmacies]);

  return (
    <div className="fixed inset-0 bg-white z-50 map-container">
      <div className="h-full flex flex-col">
        <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Carte des Pharmacies</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div ref={mapRef} className="flex-1" />
      </div>
    </div>
  );
}

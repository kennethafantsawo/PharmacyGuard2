import { Phone, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Pharmacy } from "@shared/schema";

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  onCall: (phone: string) => void;
  onWhatsApp: (whatsapp: string) => void;
}

export default function PharmacyCard({ pharmacy, onCall, onWhatsApp }: PharmacyCardProps) {
  return (
    <Card className="pharmacy-card border-b border-border last:border-b-0 rounded-none shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">{pharmacy.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{pharmacy.location}</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Phone className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{pharmacy.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-3 h-3 text-green-500" />
                <span className="text-sm text-muted-foreground">{pharmacy.whatsapp}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2 ml-4">
            <Button
              size="sm"
              onClick={() => onCall(pharmacy.phone)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground touch-button"
            >
              <Phone className="w-3 h-3 mr-1" />
              Appeler
            </Button>
            <Button
              size="sm"
              onClick={() => onWhatsApp(pharmacy.whatsapp)}
              className="bg-green-500 hover:bg-green-600 text-white touch-button"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              WhatsApp
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Link } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  capacity: number;
  available_spots?: number;
  imageUrl?: string;
}

export const EventCard = ({
  id,
  title,
  description,
  date,
  location,
  price,
  capacity,
  available_spots,
  imageUrl,
}: EventCardProps) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="aspect-video overflow-hidden bg-muted">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <Users className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{format(new Date(date), "PPP 'às' HH:mm", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span>{available_spots !== undefined ? available_spots : capacity} vagas</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-muted-foreground">A partir de</span>
            <p className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(price)}
            </p>
          </div>
          
          <Link to={`/event/${id}`}>
            <Button className="bg-gradient-to-r from-primary to-accent">
              Comprar Ingresso
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { EventCard } from "@/components/EventCard";
import { Loader2 } from "lucide-react";

const Events = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Eventos Crevin Lar de Idosos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Participe dos nossos eventos e ajude a fazer a diferença na vida de nossos idosos
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                description={event.description}
                date={event.date}
                location={event.location}
                price={Number(event.price)}
                capacity={event.capacity}
                imageUrl={event.image_url || undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">
              Nenhum evento disponível no momento
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Events;

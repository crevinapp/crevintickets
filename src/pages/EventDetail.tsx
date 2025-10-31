import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { generatePixData } from "@/lib/pix";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event || !buyerName || !buyerEmail || quantity < 1) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    // Verificar se há vagas suficientes
    const availableSpots = event.available_spots || event.capacity;
    if (quantity > availableSpots) {
      toast({
        title: "Erro",
        description: `Apenas ${availableSpots} vagas disponíveis`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate total amount
      const totalAmount = event.price * quantity;
      
      // Generate PIX data
      const pixData = await generatePixData(totalAmount, event.title);
      
      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          event_id: event.id,
          buyer_name: buyerName,
          buyer_email: buyerEmail,
          quantity: quantity,
          amount: totalAmount,
          total_amount: totalAmount,
          pix_payload: pixData.pixPayload,
          pix_qr_dataurl: pixData.qrCodeDataUrl,
          pix_txid: pixData.txid,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      toast({
        title: "Pedido criado!",
        description: "Aguardando pagamento...",
      });

      navigate(`/checkout/${orderData.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Evento não encontrado</h1>
          <Button onClick={() => navigate("/")}>Voltar para eventos</Button>
        </div>
      </div>
    );
  }

  const totalAmount = Number(event.price) * quantity;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video overflow-hidden rounded-xl mb-8 bg-muted">
            {event.image_url ? (
              <img 
                src={event.image_url} 
                alt={event.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <Users className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
          
          <div className="space-y-3 mb-6 text-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span>{format(new Date(event.date), "PPP 'às' HH:mm", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span>{event.available_spots || event.capacity} vagas disponíveis</span>
            </div>
          </div>

          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            {event.description}
          </p>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Comprar Ingresso</h2>
            
            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  required
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <Label htmlFor="quantity">Quantidade de ingressos</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={event.available_spots || event.capacity}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo: {event.available_spots || event.capacity} ingressos disponíveis
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg">Total:</span>
                  <span className="text-3xl font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(totalAmount)}
                  </span>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent"
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Prosseguir para pagamento"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EventDetail;

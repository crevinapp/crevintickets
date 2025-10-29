import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, events(*)")
        .eq("id", orderId)
        .single();
      
      if (error) throw error;
      return data;
    },
    refetchInterval: (query) => {
      if (!query.state.data) return false;
      return query.state.data.status === "paid" ? false : 5000;
    },
  });

  const handleCopyPix = () => {
    if (order?.pix_payload) {
      navigator.clipboard.writeText(order.pix_payload);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
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

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
          <Button onClick={() => navigate("/")}>Voltar para eventos</Button>
        </div>
      </div>
    );
  }

  if (order.status === "paid") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-green-100 p-6">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Pagamento confirmado!</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Seu pedido foi confirmado com sucesso. Enviamos os detalhes para {order.buyer_email}
            </p>
            <Button onClick={() => navigate("/")} size="lg">
              Voltar para eventos
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Finalize seu pagamento</h1>

          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Resumo do pedido</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Evento:</span>
                <span className="font-medium">{order.events?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantidade:</span>
                <span className="font-medium">{order.quantity} ingresso(s)</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(Number(order.amount))}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-center">PIX QR Code</h2>
            
            {order.pix_qr_dataurl && (
              <div className="flex justify-center mb-6">
                <img 
                  src={order.pix_qr_dataurl} 
                  alt="QR Code PIX"
                  className="max-w-sm w-full rounded-lg border-4 border-muted"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Ou copie o código PIX:
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={order.pix_payload}
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyPix}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Aguardando confirmação do pagamento...</p>
                <p className="mt-2">Esta página será atualizada automaticamente</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Checkout;

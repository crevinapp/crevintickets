import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, Copy, MessageCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minuto em segundos
  const [showThankYou, setShowThankYou] = useState(false);

  // Cronômetro de 2 minutos
  useEffect(() => {
    if (timeLeft <= 0) {
      setShowThankYou(true);
      // Redirecionar após 3 segundos mostrando a mensagem de agradecimento
      setTimeout(() => {
        navigate("/");
      }, 3000);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  // Formatar tempo para exibição (mm:ss)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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

  const handleSendWhatsApp = () => {
    const whatsappNumber = "5561996710018"; // Número da Crevin com código do país
    
    // Sanitizando o título do evento para evitar caracteres problemáticos
    const eventTitle = order?.events?.title?.replace(/[^\w\s]/g, '') || 'evento';
    
    const message = encodeURIComponent(
      `Olá! Acabei de efetuar o pagamento PIX para o evento "${eventTitle}". Segue o comprovante de pagamento.`
    );
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    
    // Log para debug
    console.log('WhatsApp URL:', whatsappUrl);
    
    window.open(whatsappUrl, '_blank');
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

  // Tela de agradecimento quando o tempo esgota
  if (showThankYou) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-blue-100 p-6">
                <Clock className="h-16 w-16 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Obrigado!</h1>
            <p className="text-xl text-muted-foreground mb-8">
              O tempo para escaneamento do QR Code expirou. Você será redirecionado para a página de eventos.
            </p>
            <div className="text-sm text-muted-foreground">
              Redirecionando em alguns segundos...
            </div>
          </div>
        </main>
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
          <h1 className="text-3xl font-bold mb-4 text-center">Finalize seu pagamento</h1>
          
          {/* Cronômetro */}
          <div className="mb-6">
            <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
              <div className="flex items-center justify-center gap-3">
                <Clock className="h-6 w-6 text-red-600" />
                <div className="text-center">
                  <p className="text-sm text-red-700 font-medium">Tempo restante para pagamento</p>
                  <p className="text-2xl font-bold text-red-600 font-mono">
                    {formatTime(timeLeft)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-red-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                  ></div>
                </div>
              </div>
            </Card>
          </div>

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
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 text-center">
                <strong>Atenção:</strong> Este QR Code PIX não possui valor fixo. 
                Você deve inserir o valor de <strong>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(Number(order.amount))}
                </strong> no momento do pagamento.
              </p>
            </div>
            
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

              {/* Botão de confirmação de pagamento e WhatsApp */}
              <div className="mt-6 pt-6 border-t">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">Já efetuou o pagamento?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Envie o comprovante para a Crevin via WhatsApp
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>WhatsApp da Crevin:</strong> 61 99671-0018
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Envie a mensagem "comprovante de pagamento" junto com a foto do comprovante
                    </p>
                  </div>
                  <Button 
                    onClick={handleSendWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Enviar Comprovante via WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Checkout;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, LogOut, CheckCircle2, Users, DollarSign, Calendar, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateEventForm } from "@/components/CreateEventForm";
import { EventsManagement } from "@/components/EventsManagement";
import { TicketGenerator } from "@/components/TicketGenerator";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    
    // Listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        navigate("/admin");
      } else if (event === 'SIGNED_IN' || session) {
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao verificar sessão:', error);
        navigate("/admin");
        return;
      }
      
      if (!session) {
        navigate("/admin");
        return;
      }
      
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      navigate("/admin");
    }
  };

  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, events(*)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/admin");
  };

  const handleMarkAsPaid = async (orderId: string) => {
    try {
      // Primeiro, buscar os detalhes do pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*, events(*)")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        throw new Error("Pedido não encontrado");
      }

      // Verificar se há vagas suficientes
      const currentAvailableSpots = order.events?.available_spots || order.events?.capacity || 0;
      if (currentAvailableSpots < order.quantity) {
        toast({
          title: "Erro",
          description: `Não há vagas suficientes. Disponível: ${currentAvailableSpots}, Solicitado: ${order.quantity}`,
          variant: "destructive",
        });
        return;
      }

      // Atualizar o status do pedido para "paid"
      const { error: updateOrderError } = await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("id", orderId);

      if (updateOrderError) {
        throw updateOrderError;
      }

      // Diminuir as vagas disponíveis no evento
      const newAvailableSpots = currentAvailableSpots - order.quantity;
      const { error: updateEventError } = await supabase
        .from("events")
        .update({ available_spots: newAvailableSpots })
        .eq("id", order.event_id);

      if (updateEventError) {
        // Se falhar ao atualizar o evento, reverter o status do pedido
        await supabase
          .from("orders")
          .update({ status: "pending" })
          .eq("id", orderId);
        throw updateEventError;
      }

      toast({
        title: "Pedido atualizado!",
        description: `O pedido foi marcado como pago. Vagas restantes: ${newAvailableSpots}`,
      });
    } catch (error) {
      console.error("Erro ao marcar pedido como pago:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pedido",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPresence = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ confirmed_presence: true })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar presença",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Presença confirmada!",
      description: "A presença foi registrada com sucesso",
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      // Primeiro, buscar os detalhes do pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*, events(*)")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        throw new Error("Pedido não encontrado");
      }

      // Atualizar o status do pedido para "cancelled"
      const { error: updateOrderError } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (updateOrderError) {
        throw updateOrderError;
      }

      // Se o pedido estava pago, devolver as vagas
      if (order.status === "paid") {
        const currentAvailableSpots = order.events?.available_spots || 0;
        const newAvailableSpots = currentAvailableSpots + order.quantity;
        
        const { error: updateEventError } = await supabase
          .from("events")
          .update({ available_spots: newAvailableSpots })
          .eq("id", order.event_id);

        if (updateEventError) {
          // Se falhar ao atualizar o evento, reverter o status do pedido
          await supabase
            .from("orders")
            .update({ status: "paid" })
            .eq("id", orderId);
          throw updateEventError;
        }

        toast({
          title: "Pedido cancelado!",
          description: `O pedido foi cancelado e ${order.quantity} vagas foram devolvidas. Vagas disponíveis: ${newAvailableSpots}`,
        });
      } else {
        toast({
          title: "Pedido cancelado!",
          description: "O pedido foi cancelado com sucesso",
        });
      }
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o pedido",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.")) {
      return;
    }

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o pedido",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Pedido excluído!",
      description: "O pedido foi excluído permanentemente",
    });
  };

  const handleGenerateTicket = async (order: any) => {
    try {
      // Gerar código consistente baseado no ID do pedido
      // Usar o ID do pedido para criar um código único e consistente
      const orderId = order.id || '';
      const ticketCode = `${String(orderId).padStart(9, '0')}`;
      
      // Criar dados do ingresso com informações reais do evento
      const ticketData = {
        eventName: order.events?.title || order.events?.name || 'Evento não informado',
        eventDate: order.events?.date ? format(new Date(order.events.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não informada',
        eventLocation: order.events?.location || 'Local não informado',
        buyerName: order.buyer_name || 'Nome não informado',
        ticketCode: ticketCode,
        quantity: order.quantity || 1,
        ticketType: 'Inteira',
        qrCodeData: `https://crevintickets.vercel.app/verify/${ticketCode}`,
        orderId: order.id || null
      };

      // Definir os dados do ingresso selecionado e abrir o modal
      setSelectedTicket(ticketData);
      setIsTicketModalOpen(true);

      toast({
        title: "Ingresso preparado!",
        description: "O ingresso está pronto para download",
      });
    } catch (error) {
      console.error("Error generating ticket:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o ingresso",
        variant: "destructive",
      });
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

  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.filter(order => order.status === 'paid').reduce((sum, order) => sum + Number(order.amount), 0) || 0;
  const totalConfirmed = orders?.filter(o => o.confirmed_presence).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          <div className="flex gap-3">
            <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Evento</DialogTitle>
                </DialogHeader>
                <CreateEventForm
                  onSuccess={() => setIsCreateEventOpen(false)}
                  onCancel={() => setIsCreateEventOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-accent/10 p-3">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalRevenue)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Presenças Confirmadas</p>
                <p className="text-2xl font-bold">{totalConfirmed}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Pedidos Recentes</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders && orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.buyer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.buyer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.events?.title}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(order.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === "paid"
                              ? "default"
                              : order.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {order.status === "paid"
                            ? "Pago"
                            : order.status === "cancelled"
                            ? "Cancelado"
                            : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {order.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsPaid(order.id)}
                              >
                                Marcar Pago
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelOrder(order.id)}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                          {order.status === "cancelled" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          )}
                          {order.status === "paid" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleGenerateTicket(order)}
                              >
                                Gerar Ingresso
                              </Button>
                              {!order.confirmed_presence && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleConfirmPresence(order.id)}
                                >
                                  Confirmar Presença
                                </Button>
                              )}
                            </>
                          )}
                          {order.confirmed_presence && (
                            <Badge variant="outline" className="text-green-600">
                              Presente ✓
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Gerenciamento de Eventos */}
        <div className="mt-8">
          <EventsManagement />
        </div>
      </main>

      {/* Modal de Geração de Ingresso */}
      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerar Ingresso</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <TicketGenerator ticketData={selectedTicket} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

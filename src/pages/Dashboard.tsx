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
import { Loader2, LogOut, CheckCircle2, Users, DollarSign, Calendar, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateEventForm } from "@/components/CreateEventForm";
import { EventsManagement } from "@/components/EventsManagement";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin");
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(false);
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
    const { error } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pedido",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Pedido atualizado!",
      description: "O pedido foi marcado como pago",
    });
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
  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.amount), 0) || 0;
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
                        <div className="flex gap-2">
                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsPaid(order.id)}
                            >
                              Marcar Pago
                            </Button>
                          )}
                          {order.status === "paid" && !order.confirmed_presence && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfirmPresence(order.id)}
                            >
                              Confirmar Presença
                            </Button>
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
    </div>
  );
};

export default Dashboard;

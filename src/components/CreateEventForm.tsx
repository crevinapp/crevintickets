import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, MapPinIcon, UsersIcon, DollarSignIcon, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ImageUpload } from "@/components/ui/image-upload";

interface CreateEventFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateEventForm = ({ onSuccess, onCancel }: CreateEventFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    price: "",
    capacity: "",
    image_url: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validação básica
      if (!formData.title || !formData.description || !formData.date || 
          !formData.location || !formData.price || !formData.capacity) {
        toast({
          title: "Erro de validação",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      // Preparar dados para inserção
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: new Date(formData.date).toISOString(),
        location: formData.location.trim(),
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        image_url: formData.image_url.trim() || null,
      };

      // Inserir evento no Supabase
      const { data, error } = await supabase
        .from("events")
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar evento:", error);
        toast({
          title: "Erro ao criar evento",
          description: error.message || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
        return;
      }

      // Sucesso
      toast({
        title: "Evento criado com sucesso!",
        description: `O evento "${eventData.title}" foi criado e está disponível para inscrições.`,
      });

      // Atualizar cache das queries
      queryClient.invalidateQueries({ queryKey: ["events"] });

      // Limpar formulário
      setFormData({
        title: "",
        description: "",
        date: "",
        location: "",
        price: "",
        capacity: "",
        image_url: "",
      });

      // Callback de sucesso
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error("Erro inesperado:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao criar o evento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Criar Novo Evento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Título do Evento *
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Ex: Workshop de Nutrição Esportiva"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição *
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva o evento, seus objetivos e o que os participantes podem esperar..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Data e Hora */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Data e Hora *
            </Label>
            <Input
              id="date"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Formato: Dia/Mês/Ano Hora:Minuto
            </p>
          </div>

          {/* Local */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" />
              Local *
            </Label>
            <Input
              id="location"
              type="text"
              placeholder="Ex: Centro de Convenções - São Paulo"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              required
            />
          </div>

          {/* Preço e Capacidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4" />
                Preço (R$) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-sm font-medium flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Capacidade *
              </Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder="50"
                value={formData.capacity}
                onChange={(e) => handleInputChange("capacity", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Imagem do Evento */}
          <div className="space-y-2">
            <ImageUpload
              label="Imagem do Evento (opcional)"
              value={formData.image_url}
              onChange={(url) => handleInputChange("image_url", url)}
              placeholder="Cole a URL da imagem ou faça upload de uma imagem"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Criando..." : "Criar Evento"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
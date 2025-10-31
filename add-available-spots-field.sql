-- Script para adicionar campo available_spots na tabela events
-- Este campo controlará as vagas disponíveis que diminuem a cada compra

-- Adicionar coluna available_spots
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS available_spots INTEGER;

-- Atualizar eventos existentes para que available_spots seja igual a capacity
UPDATE public.events 
SET available_spots = capacity 
WHERE available_spots IS NULL;

-- Adicionar constraint para garantir que available_spots não seja negativo
ALTER TABLE public.events 
ADD CONSTRAINT check_available_spots_non_negative 
CHECK (available_spots >= 0);

-- Adicionar constraint para garantir que available_spots não seja maior que capacity
ALTER TABLE public.events 
ADD CONSTRAINT check_available_spots_not_exceed_capacity 
CHECK (available_spots <= capacity);

-- Verificar se a coluna foi adicionada corretamente
SELECT id, title, capacity, available_spots 
FROM public.events 
LIMIT 5;
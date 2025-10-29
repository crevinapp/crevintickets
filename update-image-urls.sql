-- Atualizar URLs das imagens dos eventos existentes
UPDATE events 
SET image_url = '/images/rock-show.svg' 
WHERE image_url LIKE '%via.placeholder.com%' AND title LIKE '%Rock%';

UPDATE events 
SET image_url = '/images/electronic-festival.svg' 
WHERE image_url LIKE '%via.placeholder.com%' AND title LIKE '%Eletrônico%';

UPDATE events 
SET image_url = '/images/comedy-show.svg' 
WHERE image_url LIKE '%via.placeholder.com%' AND title LIKE '%Comedy%';

-- Atualizar qualquer outra URL de placeholder restante
UPDATE events 
SET image_url = '/images/default-event.svg' 
WHERE image_url LIKE '%via.placeholder.com%';
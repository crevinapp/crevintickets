import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate CRC16-CCITT checksum for PIX
function crc16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

// Format PIX payload field
function formatPixField(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

// Generate PIX BR Code payload
function generatePixPayload(
  pixKey: string,
  merchantName: string,
  merchantCity: string,
  amount: number,
  txid: string
): string {
  // Payload format indicator
  let payload = formatPixField('00', '01');
  
  // Merchant Account Information (GUI + Key)
  const gui = formatPixField('00', 'br.gov.bcb.pix');
  const key = formatPixField('01', pixKey);
  const merchantAccount = formatPixField('26', gui + key);
  payload += merchantAccount;
  
  // Merchant Category Code
  payload += formatPixField('52', '0000');
  
  // Transaction Currency (BRL = 986)
  payload += formatPixField('53', '986');
  
  // Transaction Amount
  payload += formatPixField('54', amount.toFixed(2));
  
  // Country Code
  payload += formatPixField('58', 'BR');
  
  // Merchant Name
  payload += formatPixField('59', merchantName);
  
  // Merchant City
  payload += formatPixField('60', merchantCity);
  
  // Additional Data Field (txid)
  const referenceLabel = formatPixField('05', txid);
  payload += formatPixField('62', referenceLabel);
  
  // CRC16 placeholder
  payload += '6304';
  
  // Calculate and append CRC16
  const checksum = crc16(payload);
  payload += checksum;
  
  return payload;
}

// Generate QR Code data URL
async function generateQRCode(payload: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(payload)}`
    );
    
    if (!response.ok) throw new Error("Failed to generate QR code");
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { eventId, buyerName, buyerEmail, quantity } = await req.json();

    console.log("Creating order:", { eventId, buyerName, buyerEmail, quantity });

    // Validate input
    if (!eventId || !buyerName || !buyerEmail || !quantity || quantity < 1) {
      throw new Error("Missing or invalid required fields");
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    // Calculate amount
    const amount = Number(event.price) * quantity;

    // Generate unique transaction ID
    const txid = `CREVIN${Date.now()}${Math.random().toString(36).substring(7)}`.substring(0, 25);

    // PIX configuration
    const pixKey = "crevinrcc@gmail.com"; // Email PIX key
    const merchantName = "CREVIN LAR DE IDOSOS";
    const merchantCity = "BRASILIA";

    // Generate PIX payload
    const pixPayload = generatePixPayload(pixKey, merchantName, merchantCity, amount, txid);
    console.log("Generated PIX payload:", pixPayload);

    // Generate QR Code
    const qrDataUrl = await generateQRCode(pixPayload);
    console.log("QR Code generated successfully");

    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        event_id: eventId,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        quantity,
        amount,
        pix_txid: txid,
        pix_payload: pixPayload,
        pix_qr_dataurl: qrDataUrl,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      throw new Error("Failed to create order");
    }

    console.log("Order created successfully:", order.id);

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount,
        pixPayload,
        pixQrDataUrl: qrDataUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in create-order function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

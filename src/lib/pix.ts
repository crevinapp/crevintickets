import QRCode from 'qrcode';

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

// Generate PIX payload
function generatePixPayload(
  pixKey: string,
  merchantName: string,
  merchantCity: string,
  amount: number,
  txid: string
): string {
  let payload = "";
  
  // Payload Format Indicator (obrigatório)
  payload += formatPixField("00", "01");
  
  // Point of Initiation Method (obrigatório para QR dinâmico)
  payload += formatPixField("01", "12");
  
  // Merchant Account Information (26-51) - usando 26 para chave PIX
  // Subcampo 00: GUI do PSP (obrigatório)
  let merchantAccountInfo = formatPixField("00", "BR.GOV.BCB.PIX");
  // Subcampo 01: Chave PIX
  merchantAccountInfo += formatPixField("01", pixKey);
  payload += formatPixField("26", merchantAccountInfo);
  
  // Merchant Category Code (obrigatório)
  payload += formatPixField("52", "0000");
  
  // Transaction Currency (obrigatório) - BRL = 986
  payload += formatPixField("53", "986");
  
  // Transaction Amount (condicional)
  if (amount > 0) {
    payload += formatPixField("54", amount.toFixed(2));
  }
  
  // Country Code (obrigatório)
  payload += formatPixField("58", "BR");
  
  // Merchant Name (obrigatório)
  payload += formatPixField("59", merchantName);
  
  // Merchant City (obrigatório)
  payload += formatPixField("60", merchantCity);
  
  // Additional Data Field Template (condicional)
  if (txid) {
    const additionalDataField = formatPixField("05", txid);
    payload += formatPixField("62", additionalDataField);
  }
  
  // CRC16 (obrigatório)
  const payloadForCrc = payload + "6304";
  const crcValue = crc16(payloadForCrc);
  payload += "6304" + crcValue;
  
  return payload;
}

// Generate QR Code data URL
export async function generateQRCode(payload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw error;
  }
}

// Generate QR Code from specific PIX code
export async function generateQRCodeFromPixCode(pixCode: string): Promise<string> {
  try {
    return await QRCode.toDataURL(pixCode, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw error;
  }
}

// Generate PIX data using specific PIX code
export async function generatePixDataFromCode(
  pixCode: string
): Promise<{ pixPayload: string; qrCodeDataUrl: string; txid: string }> {
  const qrCodeDataUrl = await generateQRCodeFromPixCode(pixCode);
  
  // Extract txid from PIX code if available, or generate a new one
  const txid = `CREVIN${Date.now()}${Math.random().toString(36).substring(7)}`.substring(0, 25);
  
  return {
    pixPayload: pixCode,
    qrCodeDataUrl,
    txid
  };
}

// Generate PIX data for payment
export async function generatePixData(
  amount: number,
  eventTitle: string
): Promise<{ pixPayload: string; qrCodeDataUrl: string; txid: string }> {
  // Código PIX específico fornecido
  const specificPixCode = "00020126360014BR.GOV.BCB.PIX0114+55619967100185204000053039865802BR5901N6001C62130509PGTCREVIN6304CD39";
  
  // Usar o código PIX específico fornecido
  return await generatePixDataFromCode(specificPixCode);
}
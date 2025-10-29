import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TicketProps {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  buyerName: string;
  ticketCode: string;
  quantity: number;
  ticketType: string;
  qrCodeData: string;
  orderId: string;
}

export const Ticket: React.FC<TicketProps> = ({
  eventName,
  eventDate,
  eventLocation,
  buyerName,
  ticketCode,
  quantity,
  ticketType,
  qrCodeData,
  orderId
}) => {
  return (
    <div className="max-w-2xl mx-auto bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden">
      {/* Header do Ingresso */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">CREVIN LAR DE IDOSOS</h1>
            <p className="text-blue-100">Ingresso Eletrônico</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Código do Ingresso</p>
            <p className="text-lg font-mono font-bold">{ticketCode || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Corpo do Ingresso */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações do Evento */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Dados do Evento</h2>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 font-semibold">Nome do Evento:</p>
              <p className="text-lg font-bold text-gray-800">{eventName || 'Evento não informado'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-semibold">Data e Horário:</p>
              <p className="text-lg text-gray-800">{eventDate || 'Data não informada'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-semibold">Local do Evento:</p>
              <p className="text-lg text-gray-800">{eventLocation || 'Local não informado'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Modalidade:</p>
                <p className="text-lg text-gray-800">{ticketType || 'Inteira'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Quantidade:</p>
                <p className="text-lg text-gray-800">{quantity || 1}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-semibold">Comprador/Portador:</p>
              <p className="text-lg font-bold text-gray-800">{buyerName || 'Nome não informado'}</p>
            </div>
          </div>

          {/* QR Code e Informações de Acesso */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <QRCodeSVG 
                value={qrCodeData || 'https://crevin.org'} 
                size={180}
                level="M"
                includeMargin={true}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 font-semibold">Código de Verificação</p>
              <p className="text-xs text-gray-500 mt-1">
                Apresente este QR Code na entrada do evento
              </p>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p><strong>ID do Pedido:</strong> {orderId || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Data de Emissão:</strong> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Informações Importantes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Este ingresso é pessoal e intransferível</li>
            <li>• Apresente um documento de identidade com foto na entrada</li>
            <li>• Chegue com antecedência para evitar filas</li>
            <li>• Em caso de dúvidas, entre em contato conosco</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 px-6 py-4 text-center">
        <p className="text-sm text-gray-600">
          CREVIN - Lar de Idosos | Brasília - DF | www.crevin.org
        </p>
      </div>
    </div>
  );
};
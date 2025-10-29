import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Ticket } from './Ticket';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

interface TicketData {
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

interface TicketGeneratorProps {
  ticketData: TicketData;
  onClose?: () => void;
}

export const TicketGenerator: React.FC<TicketGeneratorProps> = ({
  ticketData,
  onClose
}) => {
  const {
    eventName,
    eventDate,
    eventLocation,
    buyerName,
    ticketCode,
    quantity,
    ticketType,
    qrCodeData,
    orderId
  } = ticketData;
  const ticketRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!ticketRef.current) return;

    try {
      // Configurar html2canvas para melhor qualidade
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2, // Aumenta a resolução
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: ticketRef.current.scrollWidth,
        height: ticketRef.current.scrollHeight,
      });

      // Criar PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calcular dimensões para centralizar o ingresso no PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Proporção do canvas
      const canvasAspectRatio = canvas.width / canvas.height;
      
      // Calcular largura e altura mantendo proporção
      let imgWidth = pdfWidth - 20; // Margem de 10mm de cada lado
      let imgHeight = imgWidth / canvasAspectRatio;
      
      // Se a altura for maior que a página, ajustar pela altura
      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20;
        imgWidth = imgHeight * canvasAspectRatio;
      }
      
      // Centralizar na página
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      // Nome do arquivo
      const fileName = `ingresso-${ticketCode}.pdf`;
      
      // Baixar o PDF
      pdf.save(fileName);
      
      console.log('PDF gerado com sucesso:', fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Botões de ação */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ingresso Eletrônico</h2>
        <div className="flex gap-2">
          <Button onClick={generatePDF} className="flex items-center gap-2">
            <Download size={16} />
            Baixar PDF
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </div>

      {/* Ingresso para visualização e captura */}
      <div ref={ticketRef}>
        <Ticket
          eventName={eventName}
          eventDate={eventDate}
          eventLocation={eventLocation}
          buyerName={buyerName}
          ticketCode={ticketCode}
          quantity={quantity}
          ticketType={ticketType}
          qrCodeData={qrCodeData}
          orderId={orderId}
        />
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Como usar o ingresso:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. Clique em "Baixar PDF" para salvar o ingresso</li>
          <li>2. Imprima o ingresso ou mantenha-o no celular</li>
          <li>3. Apresente o QR Code na entrada do evento</li>
          <li>4. Tenha um documento de identidade em mãos</li>
        </ul>
      </div>
    </div>
  );
};
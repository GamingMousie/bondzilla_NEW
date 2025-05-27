
'use client';

import type { Shipment, Trailer } from '@/types';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import Barcode from 'react-barcode'; // Changed from named to default import
import { applyRecursivePrintStyles } from '@/lib/dom-to-image-style-utils';

interface ShipmentLabelProps {
  shipment: Shipment;
  trailer: Trailer;
  labelDate: string; // Expecting DD/MM/YYYY format
}

export default function ShipmentLabel({ shipment, trailer, labelDate }: ShipmentLabelProps) {
  const barcodeValue = shipment.id || 'error-no-id';
  const labelRef = useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (!labelRef.current) return;

    const DPI = 150;
    const MM_TO_INCH = 1 / 25.4;
    const LABEL_WIDTH_MM = 150; // 15cm
    const LABEL_HEIGHT_MM = 108; // 10.8cm

    const targetWidthPx = Math.round(LABEL_WIDTH_MM * MM_TO_INCH * DPI);
    const targetHeightPx = Math.round(LABEL_HEIGHT_MM * MM_TO_INCH * DPI);

    try {
      const canvas = await html2canvas(labelRef.current, {
        useCORS: true,
        backgroundColor: '#ffffff',
        width: targetWidthPx,
        height: targetHeightPx,
        scale: 2,
        logging: false,
        onclone: (documentClone) => {
          const clonedLabelRoot = documentClone.getElementById(labelRef.current?.id || '');
          if (clonedLabelRoot && labelRef.current) {
            clonedLabelRoot.style.width = `${targetWidthPx}px`;
            clonedLabelRoot.style.height = `${targetHeightPx}px`;
            clonedLabelRoot.style.border = '1px solid black';
            clonedLabelRoot.style.padding = `${0.375 * 16}px`; // Approx print:p-1.5
            clonedLabelRoot.style.display = 'flex';
            clonedLabelRoot.style.flexDirection = 'column';
            clonedLabelRoot.style.backgroundColor = '#ffffff';
            clonedLabelRoot.style.color = '#000000';
            clonedLabelRoot.style.boxSizing = 'border-box';
            applyRecursivePrintStyles(labelRef.current, clonedLabelRoot);
          }
        },
      });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `label-${trailer.id || 'unknown_trailer'}-${shipment.stsJob}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const trailerIdDisplay = trailer.id || 'N/A';
  const companyDisplay = trailer.company || 'N/A';

  return (
    <div className="flex flex-col items-center group">
      <div
        ref={labelRef}
        id={`shipment-label-${shipment.id}`}
        className="border border-foreground rounded-md shadow-sm w-full bg-background text-foreground
                   print:shadow-none print:border-black print:w-[150mm] print:h-[108mm] print:p-1.5
                   label-item flex flex-col print:page-break-after-always"
      >
        <div className="flex-grow flex flex-col p-1 print:p-0 print:leading-normal"> {/* Removed justify-around */}
          <div className="flex justify-between items-baseline print:mb-0.5">
            <span className="text-sm print:text-[28pt] print:font-semibold">Date:</span>
            <span className="text-sm print:text-[28pt] print:font-semibold text-right">{labelDate}</span>
          </div>

          <div className="flex justify-between items-baseline print:mb-0.5">
            <span className="text-sm print:text-[32pt] print:font-semibold">Agent:</span>
            <span className="text-sm print:text-[32pt] print:font-semibold text-right" title={companyDisplay}>{companyDisplay}</span>
          </div>

          <div className="flex justify-between items-baseline print:mb-0.5">
            <span className="text-sm print:text-[32pt] print:font-semibold">Importer:</span>
            <span className="text-sm print:text-[32pt] print:font-semibold text-right" title={shipment.importer}>{shipment.importer}</span>
          </div>
          
          <div className="flex justify-between items-baseline print:mb-2">
            <span className="text-sm print:text-[48pt] print:font-semibold">Pieces:</span>
            <span className="text-lg print:text-[48pt] print:font-bold text-right">{shipment.quantity}</span>
          </div>

          <p className="print:text-[100pt] print:font-bold text-center print:mb-2"> {/* Adjusted font size and margin */}
            {trailerIdDisplay} / {shipment.stsJob}
          </p>
        </div>

        <div className="mt-auto pt-1 border-t border-dashed border-muted-foreground print:border-black print:mt-1 print:pt-1 print:mb-0">
          <div className="flex justify-center items-center print:mt-0.5">
             <Barcode
                value={barcodeValue}
                format="CODE128"
                width={1.8} 
                height={100} 
                displayValue={false}
                background="transparent"
                lineColor="black"
                margin={0}
             />
          </div>
        </div>
      </div>
      <Button
        onClick={handleDownloadImage}
        variant="outline"
        size="sm"
        className="mt-2 no-print transition-opacity duration-150 individual-label-download-button"
        aria-label={`Download label for shipment ${shipment.stsJob} as image`}
      >
        <Download className="mr-2 h-4 w-4" />
        Download Image
      </Button>
    </div>
  );
}

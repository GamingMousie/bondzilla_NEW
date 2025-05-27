
'use client';

import { useState, useEffect } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Shipment, Trailer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, PackageSearch, Download } from 'lucide-react';
import ShipmentLabel from '@/components/label/ShipmentLabel';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { applyRecursivePrintStyles } from '@/lib/dom-to-image-style-utils';


export default function GenerateShipmentLabelsPage() {
  const { getTrailerById, getShipmentsByTrailerId } = useWarehouse();
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  const [trailerIdInput, setTrailerIdInput] = useState('');
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null);
  const [shipmentsToLabel, setShipmentsToLabel] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [labelDateForShipments, setLabelDateForShipments] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGenerateLabels = () => {
    if (!trailerIdInput.trim()) {
      setError('Please enter a Trailer ID.');
      setSelectedTrailer(null);
      setShipmentsToLabel([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    const trailer = getTrailerById(trailerIdInput.trim());
    if (trailer) {
      setSelectedTrailer(trailer);
      const shipments = getShipmentsByTrailerId(trailer.id);
      setShipmentsToLabel(shipments);
      if (shipments.length === 0) {
        setError(`No shipments found for Trailer ID: ${trailer.id}`);
      }
      const dateFormat = 'dd/MM/yyyy';
      if (trailer.arrivalDate) {
        try {
          setLabelDateForShipments(format(parseISO(trailer.arrivalDate), dateFormat));
        } catch {
          setLabelDateForShipments(format(new Date(), dateFormat));
        }
      } else {
        setLabelDateForShipments(format(new Date(), dateFormat));
      }
    } else {
      setError(`Trailer with ID: ${trailerIdInput.trim()} not found.`);
      setSelectedTrailer(null);
      setShipmentsToLabel([]);
    }
    setIsLoading(false);
  };

  const handleDownloadAllLabelsAsPdf = async () => {
    if (shipmentsToLabel.length === 0 || !selectedTrailer) {
      toast({
        title: "No Labels to Process",
        description: "Please generate labels first.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "PDF Generation Started",
      description: `Attempting to generate PDF with ${shipmentsToLabel.length} label(s). This may take a moment.`,
    });

    // Constants for label dimensions in mm and DPI for canvas rendering
    const LABEL_WIDTH_MM = 150;
    const LABEL_HEIGHT_MM = 108;
    const DPI = 150; 
    const MM_TO_INCH = 1 / 25.4;

    const targetWidthPx = Math.round(LABEL_WIDTH_MM * MM_TO_INCH * DPI);
    const targetHeightPx = Math.round(LABEL_HEIGHT_MM * MM_TO_INCH * DPI);
    
    const pdf = new jsPDF({
      orientation: 'landscape', // Since 150mm > 108mm
      unit: 'mm',
      format: [LABEL_WIDTH_MM, LABEL_HEIGHT_MM],
    });

    const labelElements = document.querySelectorAll('.label-item');

    for (let i = 0; i < labelElements.length; i++) {
      const labelElement = labelElements[i] as HTMLElement;
      if (!labelElement) continue;

      try {
        const canvas = await html2canvas(labelElement, {
          useCORS: true,
          backgroundColor: '#ffffff',
          width: targetWidthPx, 
          height: targetHeightPx,
          scale: 2, // Render at higher res, then scale down to targetWidth/Height for quality
          logging: false,
          onclone: (documentClone) => {
            const clonedLabelRoot = documentClone.getElementById(labelElement.id);
            if (clonedLabelRoot) {
              // Style the root of the cloned label for capture
              clonedLabelRoot.style.width = `${targetWidthPx}px`;
              clonedLabelRoot.style.height = `${targetHeightPx}px`;
              clonedLabelRoot.style.border = '1px solid black';
              clonedLabelRoot.style.padding = `${0.375 * 16}px`; // Approx print:p-1.5
              clonedLabelRoot.style.display = 'flex';
              clonedLabelRoot.style.flexDirection = 'column';
              clonedLabelRoot.style.backgroundColor = '#ffffff';
              clonedLabelRoot.style.color = '#000000';
              clonedLabelRoot.style.boxSizing = 'border-box';
              applyRecursivePrintStyles(labelElement, clonedLabelRoot);
            }
          },
        });
        const imageDataUrl = canvas.toDataURL('image/png', 1.0);
        
        if (i > 0) {
          pdf.addPage([LABEL_WIDTH_MM, LABEL_HEIGHT_MM], 'landscape');
        }
        pdf.addImage(imageDataUrl, 'PNG', 0, 0, LABEL_WIDTH_MM, LABEL_HEIGHT_MM);
        
        // Small delay to allow UI to update and prevent browser freezing on large jobs
        if (i < labelElements.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 250)); 
        }

      } catch (error) {
        console.error('Error generating image for PDF for label:', labelElement.id, error);
        toast({
          title: "Error Generating Image",
          description: `Could not process label for ${shipmentsToLabel[i]?.stsJob}. Skipping.`,
          variant: "destructive",
        });
      }
    }

    pdf.save(`labels_trailer_${selectedTrailer.id}.pdf`);
    toast({
      title: "PDF Generated",
      description: "The PDF with all labels has been downloaded.",
    });
  };


  return (
    <div className="space-y-6">
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <ClipboardList className="mr-3 h-7 w-7 text-primary" />
            Generate Shipment Labels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-grow">
              <Label htmlFor="trailerIdInput" className="text-lg font-semibold">Enter Trailer ID:</Label>
              <Input
                id="trailerIdInput"
                value={trailerIdInput}
                onChange={(e) => setTrailerIdInput(e.target.value)}
                placeholder="e.g., STS2990"
                className="mt-1 text-base"
              />
            </div>
            <Button onClick={handleGenerateLabels} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Generating...' : 'Generate Labels'}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-8 print:block print:space-y-0 print:gap-0 label-grid" style={{ '--label-width': '150mm' } as React.CSSProperties}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-dashed rounded-md p-4 h-[108mm] w-[150mm] flex flex-col items-center justify-center bg-muted/50">
              <Skeleton className="h-1/3 w-2/3" />
              <Skeleton className="h-8 w-1/2 mt-4" />
            </div>
          ))}
        </div>
      )}

      {isClient && !isLoading && shipmentsToLabel.length > 0 && selectedTrailer && (
        <>
          <div className="flex justify-end gap-2 no-print mb-4">
            <Button onClick={handleDownloadAllLabelsAsPdf} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Download All Labels as PDF
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-10 print:block print:space-y-0 print:gap-0 label-grid" style={{ '--label-width': '150mm' } as React.CSSProperties}>
            {shipmentsToLabel.map((shipment) => (
              <ShipmentLabel
                key={shipment.id}
                shipment={shipment}
                trailer={selectedTrailer!}
                labelDate={labelDateForShipments}
              />
            ))}
          </div>
        </>
      )}

      {isClient && !isLoading && !error && shipmentsToLabel.length === 0 && selectedTrailer && (
        <Card className="mt-6">
          <CardContent className="pt-6 text-center">
            <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-xl text-muted-foreground">
              No shipments found for Trailer ID: <span className="font-semibold">{selectedTrailer.id}</span>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

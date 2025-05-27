
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

  const handleDownloadAllImages = async () => {
    const renderedLabelElements = document.querySelectorAll('.label-item');
    if (renderedLabelElements.length === 0 || !selectedTrailer) {
      toast({
        title: "No Labels to Download",
        description: "Please generate labels first.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Composite Image Download Started",
      description: `Attempting to download labels in groups. This may take a moment.`,
    });

    const LABELS_PER_PAGE = 2; // Number of labels per image page
    const DPI = 150;
    const MM_TO_INCH = 1 / 25.4;
    const LABEL_WIDTH_MM = 150;
    const LABEL_HEIGHT_MM = 108;

    const labelWidthPx = Math.round(LABEL_WIDTH_MM * MM_TO_INCH * DPI);
    const labelHeightPx = Math.round(LABEL_HEIGHT_MM * MM_TO_INCH * DPI);

    const CONTAINER_PADDING_PX = Math.round(5 * MM_TO_INCH * DPI); // ~5mm padding
    const LABEL_GAP_PX = Math.round(5 * MM_TO_INCH * DPI);       // ~5mm gap

    // Container dimensions for LABELS_PER_PAGE labels stacked vertically
    const containerWidthPx = labelWidthPx + (CONTAINER_PADDING_PX * 2);
    const containerHeightPx = (labelHeightPx * LABELS_PER_PAGE) + (LABEL_GAP_PX * (LABELS_PER_PAGE - 1)) + (CONTAINER_PADDING_PX * 2);

    const labelElementsArray = Array.from(renderedLabelElements);

    for (let i = 0; i < labelElementsArray.length; i += LABELS_PER_PAGE) {
      const chunk = labelElementsArray.slice(i, i + LABELS_PER_PAGE);
      const pageNum = Math.floor(i / LABELS_PER_PAGE) + 1;

      const captureContainer = document.createElement('div');
      captureContainer.id = `capture-container-page-${pageNum}`;
      captureContainer.style.position = 'absolute';
      captureContainer.style.left = '-9999px';
      captureContainer.style.top = '-9999px';
      captureContainer.style.width = `${containerWidthPx}px`;
      captureContainer.style.height = `${containerHeightPx}px`;
      captureContainer.style.backgroundColor = '#ffffff';
      captureContainer.style.display = 'flex';
      captureContainer.style.flexDirection = 'column';
      captureContainer.style.alignItems = 'center';
      captureContainer.style.justifyContent = 'flex-start';
      captureContainer.style.padding = `${CONTAINER_PADDING_PX}px`;
      captureContainer.style.gap = `${LABEL_GAP_PX}px`;
      captureContainer.style.boxSizing = 'border-box';
      captureContainer.style.border = '1px dashed #ccc'; // Optional: for debugging visibility

      chunk.forEach(originalLabelNode => {
        const clonedLabel = originalLabelNode.cloneNode(true) as HTMLElement;
        
        // Style the cloned label itself for its placement within the capture container
        clonedLabel.style.width = `${labelWidthPx}px`;
        clonedLabel.style.height = `${labelHeightPx}px`;
        clonedLabel.style.border = '1px solid black';
        clonedLabel.style.boxSizing = 'border-box';
        clonedLabel.style.backgroundColor = '#ffffff';
        clonedLabel.style.color = '#000000';
        clonedLabel.style.display = 'flex'; // Ensure flex properties are on the cloned label
        clonedLabel.style.flexDirection = 'column';
        // Remove print-page-break-after-always if it exists, as it's not needed for composite image
        clonedLabel.classList.remove('print-page-break-after-always');

        // Apply print-like styles to the content OF the cloned label
        applyRecursivePrintStyles(originalLabelNode as HTMLElement, clonedLabel);
        
        captureContainer.appendChild(clonedLabel);
      });

      document.body.appendChild(captureContainer);

      try {
        const canvas = await html2canvas(captureContainer, {
          useCORS: true,
          backgroundColor: '#ffffff',
          width: containerWidthPx,
          height: containerHeightPx,
          scale: 2, // Render at 2x and then scale down by html2canvas to canvas width/height
          logging: false,
        });
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `labels-page-${pageNum}-trailer-${selectedTrailer.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: `Page ${pageNum} Downloaded`,
          description: `Image with ${chunk.length} label(s) generated.`,
        });
      } catch (error) {
        console.error(`Error generating composite image for page ${pageNum}:`, error);
        toast({
          title: "Image Generation Error",
          description: `Failed to generate image for page ${pageNum}.`,
          variant: "destructive",
        });
      } finally {
        if (document.body.contains(captureContainer)) {
            document.body.removeChild(captureContainer);
        }
      }

      if (i + LABELS_PER_PAGE < labelElementsArray.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
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
            <Button onClick={handleDownloadAllImages} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Download All Labels as Images
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
          {/* This print-only block might not be relevant if we are not using browser print for labels */}
          <div className="print-only-block text-center mt-4">
            <p className="text-xs text-muted-foreground">
              Labels generated for Trailer ID: {selectedTrailer.id} on {new Date().toLocaleDateString()}
            </p>
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


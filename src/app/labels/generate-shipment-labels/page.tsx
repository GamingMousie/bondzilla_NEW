
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
// html2canvas and applyRecursivePrintStyles are not directly used here anymore for "Download All"
// but ShipmentLabel still uses them.

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
    const downloadButtons = document.querySelectorAll('.individual-label-download-button');
    if (downloadButtons.length === 0) {
      toast({
        title: "No Labels to Download",
        description: "Please generate labels first.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Image Downloads Started",
      description: `Attempting to download ${downloadButtons.length} label(s). This may take a moment.`,
    });

    for (let i = 0; i < downloadButtons.length; i++) {
      (downloadButtons[i] as HTMLElement).click();
      // Add a small delay to help browsers manage multiple downloads
      // and to give each html2canvas instance time to complete.
      if (i < downloadButtons.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
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

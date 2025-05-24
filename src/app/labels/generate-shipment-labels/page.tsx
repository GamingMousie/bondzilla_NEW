
'use client';

import React, { useState, useEffect } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Trailer, Shipment } from '@/types';
import ShipmentLabel from '@/components/label/ShipmentLabel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Search, Printer, AlertTriangle, PackageSearch } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function GenerateShipmentLabelsPage() {
  const [trailerIdInput, setTrailerIdInput] = useState('');
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null);
  const [shipmentsToLabel, setShipmentsToLabel] = useState<Shipment[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { getTrailerById, getShipmentsByTrailerId } = useWarehouse();

  const handleGenerateLabels = () => {
    if (!trailerIdInput.trim()) {
      setErrorMessage('Please enter a Trailer ID.');
      setSelectedTrailer(null);
      setShipmentsToLabel([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSelectedTrailer(null);
    setShipmentsToLabel([]);

    const trailer = getTrailerById(trailerIdInput.trim());

    if (!trailer) {
      setErrorMessage(`Trailer with ID "${trailerIdInput.trim()}" not found.`);
      setIsLoading(false);
      return;
    }

    const shipments = getShipmentsByTrailerId(trailer.id);

    if (shipments.length === 0) {
      setErrorMessage(`No shipments found for Trailer ID "${trailer.id}".`);
      setSelectedTrailer(trailer); 
      setShipmentsToLabel([]);
      setIsLoading(false);
      return;
    }

    setSelectedTrailer(trailer);
    setShipmentsToLabel(shipments);
    setIsLoading(false);
  };

  const handlePrintLabels = () => {
    if (shipmentsToLabel.length > 0 && selectedTrailer) {
      window.print();
    }
  };

  const getLabelDate = (trailer: Trailer | null): string => {
    if (!isClient) return '';
    // Format date as DD/MM/YYYY
    const dateFormat = 'dd/MM/yyyy'; 
    if (trailer && trailer.arrivalDate) {
      try {
        return format(parseISO(trailer.arrivalDate), dateFormat);
      } catch (e) {
        console.error("Error formatting trailer arrival date:", e);
        return format(new Date(), dateFormat);
      }
    }
    return format(new Date(), dateFormat);
  };
  
  const labelDateForShipments = selectedTrailer ? getLabelDate(selectedTrailer) : getLabelDate(null);

  return (
    <div className="space-y-6">
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            Generate Shipment Labels
          </CardTitle>
          <CardDescription>
            Enter a Trailer ID to generate labels for all its shipments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 items-end">
            <div className="flex-grow">
              <label htmlFor="trailerId" className="block text-sm font-medium text-muted-foreground mb-1">
                Trailer ID
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="trailerId"
                  value={trailerIdInput}
                  onChange={(e) => setTrailerIdInput(e.target.value)}
                  placeholder="Enter Trailer ID (e.g., STS2910)"
                  className="pl-10"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateLabels();}}
                />
              </div>
            </div>
            <Button onClick={handleGenerateLabels} disabled={isLoading || !isClient} className="w-full sm:w-auto">
              {isLoading ? 'Generating...' : 'Generate Labels'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 no-print">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border border-border rounded-lg shadow-sm bg-background h-[200px] flex flex-col justify-between">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-8 w-full mt-2" />
            </div>
          ))}
        </div>
      )}

      {errorMessage && !isLoading && (
        <Alert variant="destructive" className="no-print">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {selectedTrailer && shipmentsToLabel.length === 0 && !errorMessage && !isLoading && (
         <div className="text-center py-10 bg-card rounded-lg shadow no-print">
            <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-xl text-muted-foreground">No shipments found for Trailer ID "{selectedTrailer.id}".</p>
         </div>
      )}

      {/* On-screen title for generated labels */}
      {selectedTrailer && shipmentsToLabel.length > 0 && !isLoading && (
        <div className="no-print">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-foreground">
              Labels for Trailer: {selectedTrailer.name || 'N/A'} (ID: {selectedTrailer.id}) - {shipmentsToLabel.length} Shipment(s)
            </h2>
            <Button onClick={handlePrintLabels} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print All Displayed Labels
            </Button>
          </div>
        </div>
      )}
      
      {/* Section for labels - visible on screen and for printing */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 printable-area label-grid ${(!isLoading && selectedTrailer && shipmentsToLabel.length > 0) ? '' : 'hidden print:hidden'}`} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150mm, 1fr))' }}>
        {isClient && selectedTrailer && shipmentsToLabel.length > 0 && !isLoading &&
          shipmentsToLabel.map((shipment) => (
            <ShipmentLabel
              key={shipment.id}
              shipment={shipment}
              trailer={selectedTrailer!}
              labelDate={labelDateForShipments}
            />
          ))}
      </div>

      {/* Title that only appears on the printed page */}
       {selectedTrailer && shipmentsToLabel.length > 0 && (
         <div className="hidden print:block print-only-block mb-4 text-center">
            <h2 className="text-2xl font-bold text-foreground">
                Shipment Labels for Trailer: {selectedTrailer.name || 'N/A'} (ID: {selectedTrailer.id})
            </h2>
            <p className="text-lg text-muted-foreground">{shipmentsToLabel.length} Shipment(s)</p>
         </div>
       )}
    </div>
  );
}


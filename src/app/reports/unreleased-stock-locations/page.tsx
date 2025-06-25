
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Shipment, Trailer } from '@/types'; // LocationInfo is part of Shipment
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Warehouse, PackageSearch, Printer, Info, Truck, CalendarDays, Hash, Briefcase, MapPin, Box as BoxIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

interface UnreleasedStockLocationItem {
  shipmentId: string;
  stsJob: number;
  customerJobNumber?: string;
  trailerId: string;
  trailerName?: string;
  trailerCompany?: string;
  trailerArrivalDateRaw?: string; // Store raw date for sorting
  trailerArrivalDateFormatted: string; // Formatted for display
  shipmentQuantity: number;
  locationName: string;
  locationPallets?: number;
}

export default function UnreleasedStockLocationsReportPage() {
  const { shipments, getTrailerById } = useWarehouse();
  const [isClient, setIsClient] = useState(false);
  const [clientGeneratedDate, setClientGeneratedDate] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    setClientGeneratedDate(new Date().toLocaleDateString());
  }, []);

  const formatDateSafe = (dateString?: string, dateFormat = 'PP') => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), dateFormat);
    } catch (error) {
      return "Invalid Date";
    }
  };

  const reportData = useMemo((): UnreleasedStockLocationItem[] => {
    if (!isClient) return [];

    const expandedReportItems: UnreleasedStockLocationItem[] = [];

    shipments
      .filter(shipment => !shipment.releasedAt) // Filter for unreleased shipments
      .forEach(shipment => {
        const trailer = getTrailerById(shipment.trailerId);
        const shipmentLocations = shipment.locations && shipment.locations.length > 0
          ? shipment.locations
          : [{ name: 'Pending Assignment', pallets: undefined }];

        shipmentLocations.forEach(loc => {
          expandedReportItems.push({
            shipmentId: shipment.id,
            stsJob: shipment.stsJob,
            customerJobNumber: shipment.customerJobNumber,
            trailerId: shipment.trailerId,
            trailerName: trailer?.name,
            trailerCompany: trailer?.company,
            trailerArrivalDateRaw: trailer?.arrivalDate, // Store raw date
            trailerArrivalDateFormatted: formatDateSafe(trailer?.arrivalDate),
            shipmentQuantity: shipment.quantity,
            locationName: loc.name,
            locationPallets: loc.pallets,
          });
        });
      });

    return expandedReportItems.sort((a, b) => {
      // Sort "Pending Assignment" to the end
      if (a.locationName === 'Pending Assignment' && b.locationName !== 'Pending Assignment') return 1;
      if (a.locationName !== 'Pending Assignment' && b.locationName === 'Pending Assignment') return -1;
      
      // Primary sort by locationName (A-Z)
      if (a.locationName.toLowerCase() < b.locationName.toLowerCase()) return -1;
      if (a.locationName.toLowerCase() > b.locationName.toLowerCase()) return 1;
      
      // Secondary sort by trailerArrivalDateRaw (newest first)
      const dateA = a.trailerArrivalDateRaw ? parseISO(a.trailerArrivalDateRaw).getTime() : 0;
      const dateB = b.trailerArrivalDateRaw ? parseISO(b.trailerArrivalDateRaw).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;

      // Tertiary sort by trailerId (A-Z)
      if (a.trailerId.toLowerCase() < b.trailerId.toLowerCase()) return -1;
      if (a.trailerId.toLowerCase() > b.trailerId.toLowerCase()) return 1;

      // Quaternary sort by stsJob (ascending)
      return a.stsJob - b.stsJob;
    });
  }, [shipments, getTrailerById, isClient]);

  const handlePrintReport = () => {
    window.print();
  };

  const pageTitle = 'Unreleased Warehouse Stock by Location';
  const cardDescriptionText = 'Detailed view of all unreleased shipments, their current locations, quantities, and associated trailer arrival dates. Each location is listed separately and sorted by location name.';
  const printTitleText = 'Unreleased Warehouse Stock by Location Report';

  const ReportSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Location</TableHead>
          <TableHead>Trailer ID</TableHead>
          <TableHead>STS Job</TableHead>
          <TableHead>Trailer Company</TableHead>
          <TableHead>Trailer Arrival</TableHead>
          <TableHead>Cust. Job No.</TableHead>
          <TableHead className="text-right">Pieces</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(7)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow no-print">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Warehouse className="mr-3 h-8 w-8 text-primary" />
          {pageTitle}
        </h1>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrintReport} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
          <Button variant="outline" asChild>
            <Link href="/reports">
                Back to Reports
            </Link>
          </Button>
        </div>
      </div>

      <Card className="shadow-lg printable-area">
        <CardHeader className="no-print">
          <CardTitle className="text-xl sm:text-2xl text-primary">{pageTitle}</CardTitle>
          <CardDescription>{cardDescriptionText}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="print-only-block mb-4">
            <h2 className="text-xl font-semibold text-foreground">{printTitleText}</h2>
            {clientGeneratedDate && <p className="text-xs text-muted-foreground">Date Generated: {clientGeneratedDate}</p>}
          </div>

          {!isClient ? (
            <ReportSkeleton />
          ) : reportData.length === 0 ? (
            <div className="min-h-[200px] flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-md p-8">
              <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">
                No unreleased shipments found in the warehouse.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                All current stock has been marked as released.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap"><MapPin className="inline-block mr-1 h-4 w-4 print:hidden"/>Location</TableHead>
                    <TableHead className="whitespace-nowrap"><Truck className="inline-block mr-1 h-4 w-4 print:hidden"/>Trailer ID</TableHead>
                    <TableHead className="whitespace-nowrap"><Hash className="inline-block mr-1 h-4 w-4 print:hidden"/>STS Job</TableHead>
                    <TableHead className="whitespace-nowrap"><Briefcase className="inline-block mr-1 h-4 w-4 print:hidden"/>Trailer Company</TableHead>
                    <TableHead className="whitespace-nowrap"><CalendarDays className="inline-block mr-1 h-4 w-4 print:hidden"/>Trailer Arrival</TableHead>
                    <TableHead className="whitespace-nowrap"><Briefcase className="inline-block mr-1 h-4 w-4 print:hidden"/>Cust. Job No.</TableHead>
                    <TableHead className="text-right whitespace-nowrap"><BoxIcon className="inline-block mr-1 h-4 w-4 print:hidden"/>Pieces</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item, index) => ( 
                    <TableRow key={`${item.shipmentId}-${item.locationName}-${index}`}>
                      <TableCell className="font-semibold">
                        {item.locationName}
                        {item.locationPallets !== undefined ? ` (${item.locationPallets} plts)` : ''}
                      </TableCell>
                      <TableCell>
                        <Link href={`/trailers/${item.trailerId}`} className="text-primary hover:underline print:text-foreground print:no-underline">
                          {item.trailerId}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/shipments/${item.shipmentId}`} className="text-primary hover:underline print:text-foreground print:no-underline">
                          {item.stsJob}
                        </Link>
                      </TableCell>
                      <TableCell>{item.trailerCompany || 'N/A'}</TableCell>
                      <TableCell>{item.trailerArrivalDateFormatted}</TableCell>
                      <TableCell>{item.customerJobNumber || 'N/A'}</TableCell>
                      <TableCell className="text-right font-semibold">{item.shipmentQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
         {isClient && reportData.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground border-t pt-4 no-print">
                <Info className="h-4 w-4 mr-2 text-primary" />
                Displaying {reportData.length} unreleased shipment location entries.
            </CardFooter>
        )}
      </Card>
    </div>
  );
}


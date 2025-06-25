
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Shipment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, PackageSearch, Printer, Info, Truck, CalendarDays, Users, Send, Hash, Briefcase, ArrowLeft, ArrowRight, Undo2, Fingerprint, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  addMonths,
  subMonths,
} from 'date-fns';

interface MonthlyReleasedReportItem {
  shipmentId: string;
  stsJob: number;
  customerJobNumber?: string;
  trailerId: string;
  trailerName?: string;
  trailerCompany?: string;
  releasedAt: string; // ISO string
  releasedAtFormatted: string;
  importer: string;
  exporter: string;
  clearanceDate?: string | null; // ISO string or null
  clearanceDateFormatted?: string;
  mrn?: string;
}

export default function MonthlyReleasedReportPage() {
  const { shipments, getTrailerById } = useWarehouse();
  const [isClient, setIsClient] = useState(false);
  const [displayDate, setDisplayDate] = useState(new Date()); // Date to determine the month to display
  const [clientGeneratedDate, setClientGeneratedDate] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
    setClientGeneratedDate(new Date().toLocaleDateString());
  }, []);
  
  const currentPeriodStart = useMemo(() => {
    return startOfMonth(displayDate);
  }, [displayDate]);

  const currentPeriodEnd = useMemo(() => {
    return endOfMonth(displayDate);
  }, [displayDate]);

  const formatDateSafe = (dateString?: string | null, dateFormat = 'PPpp') => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), dateFormat);
    } catch (error) {
      return "Invalid Date";
    }
  };

  const reportData = useMemo((): MonthlyReleasedReportItem[] => {
    if (!isClient) return [];

    return shipments
      .filter(shipment => {
        if (!shipment.releasedAt) return false;
        try {
          const releasedDate = parseISO(shipment.releasedAt);
          return isWithinInterval(releasedDate, { start: currentPeriodStart, end: currentPeriodEnd });
        } catch (error) {
          return false;
        }
      })
      .map(shipment => {
        const trailer = getTrailerById(shipment.trailerId);
        return {
          shipmentId: shipment.id,
          stsJob: shipment.stsJob,
          customerJobNumber: shipment.customerJobNumber,
          trailerId: shipment.trailerId,
          trailerName: trailer?.name,
          trailerCompany: trailer?.company,
          releasedAt: shipment.releasedAt!,
          releasedAtFormatted: formatDateSafe(shipment.releasedAt),
          importer: shipment.importer,
          exporter: shipment.exporter,
          clearanceDate: shipment.clearanceDate,
          clearanceDateFormatted: formatDateSafe(shipment.clearanceDate, 'PP'),
          mrn: shipment.mrn,
        };
      })
      .sort((a, b) => parseISO(b.releasedAt).getTime() - parseISO(a.releasedAt).getTime()); // Sort by most recent first
  }, [shipments, getTrailerById, isClient, currentPeriodStart, currentPeriodEnd]);

  const handlePrintReport = () => {
    window.print();
  };

  const handlePreviousMonth = () => {
    setDisplayDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setDisplayDate(prev => addMonths(prev, 1));
  };

  const handleThisMonth = () => {
    setDisplayDate(new Date());
  };

  const displayedMonthFormatted = format(displayDate, 'MMMM yyyy');

  const pageTitle = 'Monthly Released Shipments';
  const cardTitleText = `Released in ${displayedMonthFormatted}`;
  const cardDescriptionText = `Shipments released during ${displayedMonthFormatted}.`;
  const printTitleText = 'Monthly Released Shipments Report';
  const printPeriodText = `For month: ${displayedMonthFormatted}`;


  const ReportSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trailer ID</TableHead>
          <TableHead>STS Job</TableHead>
          <TableHead>Trailer Name</TableHead>
          <TableHead>Customer Job No.</TableHead>
          <TableHead>Importer</TableHead>
          <TableHead>Exporter</TableHead>
          <TableHead>Released At</TableHead>
          <TableHead>Clearance Date</TableHead>
          <TableHead>MRN</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow no-print">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Clock className="mr-3 h-8 w-8 text-primary" />
          {pageTitle}
        </h1>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
          <Button variant="outline" onClick={handlePreviousMonth} aria-label="Previous month">
            <ArrowLeft className="h-4 w-4 mr-0 sm:mr-2" /> <span className="hidden sm:inline">Prev Month</span>
          </Button>
          <Button variant="outline" onClick={handleThisMonth}>
             <Undo2 className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">This Month</span>
          </Button>
          <Button variant="outline" onClick={handleNextMonth} aria-label="Next month">
             <span className="hidden sm:inline">Next Month</span><ArrowRight className="h-4 w-4 ml-0 sm:ml-2" />
          </Button>
          <Button onClick={handlePrintReport} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      <Card className="shadow-lg printable-area">
        <CardHeader className="no-print">
          <CardTitle className="text-xl sm:text-2xl text-primary">{cardTitleText}</CardTitle>
          <CardDescription>
            {cardDescriptionText}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="print-only-block mb-4">
            <h2 className="text-xl font-semibold text-foreground">{printTitleText}</h2>
            <p className="text-sm text-muted-foreground">
              {printPeriodText}
            </p>
             {clientGeneratedDate && <p className="text-xs text-muted-foreground">Date Generated: {clientGeneratedDate}</p>}
          </div>

          {!isClient ? (
            <ReportSkeleton />
          ) : reportData.length === 0 ? (
            <div className="min-h-[200px] flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-md p-8">
              <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">
                No shipments were released in {displayedMonthFormatted}.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try navigating to a different month or check back later.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap"><Truck className="inline-block mr-1 h-4 w-4 print:hidden"/>Trailer ID</TableHead>
                    <TableHead className="whitespace-nowrap"><Hash className="inline-block mr-1 h-4 w-4 print:hidden"/>STS Job</TableHead>
                    <TableHead className="whitespace-nowrap">Trailer Name</TableHead>
                    <TableHead className="whitespace-nowrap"><Briefcase className="inline-block mr-1 h-4 w-4 print:hidden"/>Cust. Job No.</TableHead>
                    <TableHead className="whitespace-nowrap"><Users className="inline-block mr-1 h-4 w-4 print:hidden"/>Importer</TableHead>
                    <TableHead className="whitespace-nowrap"><Send className="inline-block mr-1 h-4 w-4 print:hidden"/>Exporter</TableHead>
                    <TableHead className="whitespace-nowrap"><CalendarDays className="inline-block mr-1 h-4 w-4 print:hidden"/>Released At</TableHead>
                    <TableHead className="whitespace-nowrap"><CalendarClock className="inline-block mr-1 h-4 w-4 print:hidden"/>Clearance Date</TableHead>
                    <TableHead className="whitespace-nowrap"><Fingerprint className="inline-block mr-1 h-4 w-4 print:hidden"/>MRN</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item) => (
                    <TableRow key={item.shipmentId}>
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
                      <TableCell>{item.trailerName || 'N/A'}</TableCell>
                      <TableCell>{item.customerJobNumber || 'N/A'}</TableCell>
                      <TableCell>{item.importer}</TableCell>
                      <TableCell>{item.exporter}</TableCell>
                      <TableCell>{item.releasedAtFormatted}</TableCell>
                      <TableCell>{item.clearanceDateFormatted}</TableCell>
                      <TableCell>{item.mrn || 'N/A'}</TableCell>
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
                Displaying {reportData.length} shipment(s) released in {displayedMonthFormatted}.
            </CardFooter>
        )}
      </Card>
    </div>
  );
}


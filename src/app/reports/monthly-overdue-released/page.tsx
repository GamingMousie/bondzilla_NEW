
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Shipment, Trailer } from '@/types'; 
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertOctagon, PackageSearch, Printer, Info, Truck, CalendarDays, Hash, Briefcase, TrendingUp, ArrowLeft, ArrowRight, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  differenceInDays,
  addMonths,
  subMonths,
} from 'date-fns';

interface OverdueReleasedReportItem {
  shipmentId: string;
  stsJob: number;
  customerJobNumber?: string;
  trailerId: string;
  trailerName?: string;
  trailerCompany?: string;
  storageExpiryDate: string; 
  storageExpiryDateFormatted: string;
  releasedAt: string; 
  releasedAtFormatted: string;
  daysOverdue: number;
}

export default function MonthlyOverdueReleasedReportPage() {
  const { shipments, getTrailerById, trailers: allTrailers } = useWarehouse();
  const [isClient, setIsClient] = useState(false);
  const [displayDate, setDisplayDate] = useState(new Date());
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [clientGeneratedDate, setClientGeneratedDate] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    setClientGeneratedDate(new Date().toLocaleDateString());
  }, []);
  
  const currentMonthStart = useMemo(() => startOfMonth(displayDate), [displayDate]);
  const currentMonthEnd = useMemo(() => endOfMonth(displayDate), [displayDate]);

  const formatDateSafe = (dateString?: string, dateFormat = 'PP') => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), dateFormat);
    } catch (error) {
      return "Invalid Date";
    }
  };

  const uniqueCompanies = useMemo(() => {
    if (!isClient) return [];
    const companies = new Set<string>();
    allTrailers.forEach(trailer => {
      if (trailer.company) {
        companies.add(trailer.company);
      }
    });
    return Array.from(companies).sort();
  }, [allTrailers, isClient]);

  const reportData = useMemo((): OverdueReleasedReportItem[] => {
    if (!isClient) return [];

    return shipments
      .filter(shipment => {
        if (!shipment.releasedAt) return false;
        try {
          const releasedDate = parseISO(shipment.releasedAt);
          return isWithinInterval(releasedDate, { start: currentMonthStart, end: currentMonthEnd });
        } catch (error) {
          return false;
        }
      })
      .map(shipment => {
        const trailer = getTrailerById(shipment.trailerId);
        if (!trailer || !trailer.storageExpiryDate || !shipment.releasedAt) {
          return null; 
        }
        
        if (companyFilter !== 'all' && trailer.company?.toLowerCase() !== companyFilter.toLowerCase()) {
          return null;
        }

        try {
          const releasedDate = parseISO(shipment.releasedAt);
          const expiryDate = parseISO(trailer.storageExpiryDate);

          if (releasedDate > expiryDate) {
            const daysOverdue = differenceInDays(releasedDate, expiryDate);
            return {
              shipmentId: shipment.id,
              stsJob: shipment.stsJob,
              customerJobNumber: shipment.customerJobNumber,
              trailerId: shipment.trailerId,
              trailerName: trailer.name,
              trailerCompany: trailer.company,
              storageExpiryDate: trailer.storageExpiryDate,
              storageExpiryDateFormatted: formatDateSafe(trailer.storageExpiryDate),
              releasedAt: shipment.releasedAt,
              releasedAtFormatted: formatDateSafe(shipment.releasedAt, 'PPpp'),
              daysOverdue,
            };
          }
        } catch (error) {
          console.error("Error processing shipment for overdue report:", shipment.id, error);
          return null;
        }
        return null;
      })
      .filter((item): item is OverdueReleasedReportItem => item !== null) 
      .sort((a, b) => b.daysOverdue - a.daysOverdue); 
  }, [shipments, getTrailerById, isClient, currentMonthStart, currentMonthEnd, companyFilter]);

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
  const selectedCompanyName = companyFilter === 'all' ? 'All Companies' : uniqueCompanies.find(c => c.toLowerCase() === companyFilter) || companyFilter;


  const pageTitle = 'Monthly Overdue Released Shipments';
  const cardTitleText = `Overdue Shipments Released in ${displayedMonthFormatted}`;
  const cardDescriptionText = `Shipments released in ${displayedMonthFormatted} after their trailer's storage expiry date. ${companyFilter !== 'all' ? `Filtered by company: ${selectedCompanyName}.` : ''}`;
  const printTitleText = 'Monthly Overdue Released Shipments Report';
  const printPeriodText = `For month: ${displayedMonthFormatted}`;


  const ReportSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trailer ID</TableHead>
          <TableHead>STS Job</TableHead>
          <TableHead>Trailer Name</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Free Storage Expiry</TableHead>
          <TableHead>Released At</TableHead>
          <TableHead className="text-right">Days Overdue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell> {/* Storage Expiry Skeleton */}
            <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-[70px] ml-auto" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow no-print">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <AlertOctagon className="mr-3 h-8 w-8 text-primary" />
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
           <Select value={companyFilter} onValueChange={(value) => setCompanyFilter(value)}>
            <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
               <div className="flex items-center">
                 <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                 <SelectValue placeholder="Filter by company" />
               </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {isClient && uniqueCompanies.map(company => (
                <SelectItem key={company} value={company.toLowerCase()}>{company}</SelectItem>
              ))}
              {!isClient && <Skeleton className="h-8 w-full my-1" />}
            </SelectContent>
          </Select>
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
            {companyFilter !== 'all' && <p className="text-sm text-muted-foreground">Filtered by Company: {selectedCompanyName}</p>}
             {clientGeneratedDate && <p className="text-xs text-muted-foreground">Date Generated: {clientGeneratedDate}</p>}
          </div>

          {!isClient ? (
            <ReportSkeleton />
          ) : reportData.length === 0 ? (
            <div className="min-h-[200px] flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-md p-8">
              <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">
                No overdue shipments found released in {displayedMonthFormatted} {companyFilter !== 'all' ? `for ${selectedCompanyName}` : ''}.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                This means all shipments released this month {companyFilter !== 'all' ? `for ${selectedCompanyName}` : ''} were done so before their storage expiry date, or no shipments met the criteria.
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
                    <TableHead className="whitespace-nowrap"><Briefcase className="inline-block mr-1 h-4 w-4 print:hidden"/>Trailer Company</TableHead>
                    <TableHead className="whitespace-nowrap"><Briefcase className="inline-block mr-1 h-4 w-4 print:hidden"/>Cust. Job No.</TableHead>
                    <TableHead className="whitespace-nowrap"><CalendarDays className="inline-block mr-1 h-4 w-4 print:hidden"/>Free Storage Expiry</TableHead>
                    <TableHead className="whitespace-nowrap"><CalendarDays className="inline-block mr-1 h-4 w-4 print:hidden"/>Released At</TableHead>
                    <TableHead className="text-right whitespace-nowrap"><TrendingUp className="inline-block mr-1 h-4 w-4 print:hidden"/>Days Overdue</TableHead>
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
                      <TableCell>{item.trailerCompany || 'N/A'}</TableCell>
                      <TableCell>{item.customerJobNumber || 'N/A'}</TableCell>
                      <TableCell className="text-destructive font-medium">{item.storageExpiryDateFormatted}</TableCell>
                      <TableCell>{item.releasedAtFormatted}</TableCell>
                      <TableCell className="text-right font-bold text-destructive">{item.daysOverdue}</TableCell>
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
                Displaying {reportData.length} overdue shipment(s) released in {displayedMonthFormatted} {companyFilter !== 'all' ? `for ${selectedCompanyName}` : ''}.
            </CardFooter>
        )}
      </Card>
    </div>
  );
}



'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Shipment, Trailer } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, PackageSearch, Info, Briefcase, CalendarDays, Printer, ArrowRightCircle, Clock, AlertOctagon, BarChart3, Hash, Warehouse } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

interface BondCheckReportItem {
  trailerId: string;
  trailerName?: string;
  company?: string;
  arrivalDate?: string;
  stsJob: number;
  shipmentId: string;
  customerJobNumber?: string;
  locationsDisplay: string;
}

export default function ReportsPage() {
  const { shipments, getTrailerById, trailers } = useWarehouse();
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [clientGeneratedDate, setClientGeneratedDate] = useState<string | null>(null);


  useEffect(() => {
    setIsClient(true);
    setClientGeneratedDate(new Date().toLocaleDateString());
    if (user?.companyFilter) {
      setCompanyFilter(user.companyFilter.toLowerCase());
    }
  }, [user]);

  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'PP'); // e.g., Jul 20, 2024
    } catch (error) {
      return "Invalid Date";
    }
  };

  const rawBondCheckReportData = useMemo((): BondCheckReportItem[] => {
    if (!isClient) return [];

    let userShipments = shipments;
    // Customer roles should only see data related to their company
    if (user?.companyFilter) {
        const companyTrailerIds = new Set(trailers.filter(t => t.company === user.companyFilter).map(t => t.id));
        userShipments = shipments.filter(s => companyTrailerIds.has(s.trailerId));
    }

    return userShipments
      .filter(shipment => !shipment.releasedAt)
      .map(shipment => {
        const trailer = getTrailerById(shipment.trailerId);
        const locations = shipment.locations || [{ name: 'Pending Assignment' }];
        const isPendingAssignment = locations.length === 1 && locations[0].name === 'Pending Assignment';

        let locationsDisplay = 'Pending Assignment';
        if (!isPendingAssignment) {
            locationsDisplay = locations.map(loc =>
                `${loc.name}${loc.pallets !== undefined ? ` (${loc.pallets} plts)` : ''}`
            ).join(', ');
        }

        return {
          trailerId: shipment.trailerId,
          trailerName: trailer?.name,
          company: trailer?.company,
          arrivalDate: trailer?.arrivalDate,
          stsJob: shipment.stsJob,
          shipmentId: shipment.id,
          customerJobNumber: shipment.customerJobNumber,
          locationsDisplay: locationsDisplay,
        };
      })
      .sort((a, b) => {
        // Primary sort by company, then trailerId, then stsJob
        if (a.company && b.company) {
          if (a.company.toLowerCase() < b.company.toLowerCase()) return -1;
          if (a.company.toLowerCase() > b.company.toLowerCase()) return 1;
        } else if (a.company) {
          return -1; // a has company, b doesn't
        } else if (b.company) {
          return 1; // b has company, a doesn't
        }

        if (a.trailerId < b.trailerId) return -1;
        if (a.trailerId > b.trailerId) return 1;
        if (a.stsJob < b.stsJob) return -1;
        if (a.stsJob > b.stsJob) return 1;
        return 0;
      });
  }, [shipments, getTrailerById, isClient, user, trailers]);

  const uniqueCompanies = useMemo(() => {
    if (!isClient) return [];
    if(user?.companyFilter) {
        return [user.companyFilter];
    }
    const companies = new Set<string>();
    rawBondCheckReportData.forEach(item => {
      if (item.company) {
        companies.add(item.company);
      }
    });
    return Array.from(companies).sort();
  }, [rawBondCheckReportData, isClient, user]);

  const filteredBondCheckReportData = useMemo(() => {
    if (companyFilter === 'all' || user?.companyFilter) {
      return rawBondCheckReportData;
    }
    return rawBondCheckReportData.filter(item =>
      item.company?.toLowerCase() === companyFilter.toLowerCase()
    );
  }, [rawBondCheckReportData, companyFilter, user]);

  const handlePrintReport = () => {
    window.print();
  };

  const ReportSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Trailer ID</TableHead>
          <TableHead>STS Job</TableHead>
          <TableHead>Trailer Name</TableHead>
          <TableHead>Customer Job No.</TableHead>
          <TableHead>
            <div className="flex items-center">
              <CalendarDays className="mr-1.5 h-4 w-4 print:hidden" />
              Arrival Date
            </div>
          </TableHead>
          <TableHead>Locations</TableHead>
          <TableHead className="text-right">Shipment ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
            <TableCell><Skeleton className="h-4 w-[90px]" /></TableCell>
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
          <ClipboardList className="mr-3 h-8 w-8 text-primary" />
          Reports Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-primary">
              <PackageSearch className="mr-2 h-6 w-6" />
              Bond Check Report
            </CardTitle>
            <CardDescription>
              View current unreleased stock in the warehouse. Detailed below.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              This report is detailed below on this page.
            </p>
          </CardFooter>
        </Card>

        <Link href="/reports/weekly-released">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col justify-between cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-primary">
                <Clock className="mr-2 h-6 w-6" />
                Monthly Released Shipments
              </CardTitle>
              <CardDescription>
                View all shipments that were marked as released this month.
              </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button variant="link" className="p-0 h-auto text-primary">
                View Report <ArrowRightCircle className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/reports/monthly-overdue-released">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col justify-between cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-primary">
                <AlertOctagon className="mr-2 h-6 w-6" />
                Monthly Overdue Released Shipments
              </CardTitle>
              <CardDescription>
                Shipments released this month after their storage expiry date.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="link" className="p-0 h-auto text-primary">
                View Report <ArrowRightCircle className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/reports/monthly-company-trailers">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col justify-between cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-primary">
                <BarChart3 className="mr-2 h-6 w-6" />
                Monthly Trailer Arrivals by Company
              </CardTitle>
              <CardDescription>
                Summary of trailer arrivals per company for the current month.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="link" className="p-0 h-auto text-primary">
                View Report <ArrowRightCircle className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/reports/unreleased-stock-locations">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col justify-between cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-primary">
                <Warehouse className="mr-2 h-6 w-6" />
                Unreleased Stock by Location
              </CardTitle>
              <CardDescription>
                View unreleased stock, their locations, pieces, and arrival dates.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="link" className="p-0 h-auto text-primary">
                View Report <ArrowRightCircle className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </Link>

      </div>

      {/* Bond Check Report (Existing Report) */}
      <Card className="shadow-lg printable-area">
        <CardHeader className="no-print">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle className="text-xl sm:text-2xl text-primary">Current Warehouse Stock (Unreleased)</CardTitle>
                <CardDescription>
                This report lists all shipments currently in the warehouse that have not been marked as "Released".
                {user?.companyFilter && ` This view is filtered for ${user.companyFilter}.`}
                </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                { !user?.companyFilter && (
                    <Select value={companyFilter} onValueChange={(value) => setCompanyFilter(value)}>
                        <SelectTrigger className="w-full sm:w-[220px]">
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
                )}
                 <Button onClick={handlePrintReport} variant="outline" className="w-full sm:w-auto">
                    <Printer className="mr-2 h-4 w-4" />
                    Print This Report
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Title and description for printed version */}
          <div className="print-only-block mb-4">
            <h2 className="text-xl font-semibold text-foreground">Bond Check Report - Current Warehouse Stock (Unreleased)</h2>
            {companyFilter !== 'all' && <p className="text-sm text-muted-foreground">Filtered by Company: {uniqueCompanies.find(c => c.toLowerCase() === companyFilter) || companyFilter}</p>}
            {clientGeneratedDate && <p className="text-xs text-muted-foreground">Date Generated: {clientGeneratedDate}</p>}
          </div>

          {!isClient ? (
            <ReportSkeleton />
          ) : filteredBondCheckReportData.length === 0 ? (
            <div className="min-h-[200px] flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-md p-8">
              <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">
                No unreleased shipments found for the selected filter.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                All shipments have been released, or there are no shipments matching your criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap"><Briefcase className="inline-block mr-1 h-4 w-4 print:hidden"/>Company</TableHead>
                    <TableHead className="whitespace-nowrap">Trailer ID</TableHead>
                    <TableHead className="whitespace-nowrap"><Hash className="inline-block mr-1 h-4 w-4 print:hidden"/>STS Job</TableHead>
                    <TableHead className="whitespace-nowrap">Trailer Name</TableHead>
                    <TableHead className="whitespace-nowrap">Customer Job No.</TableHead>
                    <TableHead className="whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarDays className="mr-1.5 h-4 w-4 print:hidden" />
                        Arrival Date
                      </div>
                    </TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Shipment ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBondCheckReportData.map((item) => (
                    <TableRow key={item.shipmentId}>
                      <TableCell>{item.company || 'N/A'}</TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/trailers/${item.trailerId}`} className="text-primary hover:underline print:text-foreground print:no-underline">
                          {item.trailerId}
                        </Link>
                      </TableCell>
                      <TableCell>{item.stsJob}</TableCell>
                      <TableCell>{item.trailerName || 'N/A'}</TableCell>
                      <TableCell>{item.customerJobNumber || 'N/A'}</TableCell>
                      <TableCell>{formatDateSafe(item.arrivalDate)}</TableCell>
                      <TableCell>{item.locationsDisplay}</TableCell>
                      <TableCell className="text-right">
                         <Link href={`/shipments/${item.shipmentId}`} className="text-primary hover:underline print:text-foreground print:no-underline">
                           {item.shipmentId.substring(0, 8)}...
                         </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
         {isClient && filteredBondCheckReportData.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground border-t pt-4 no-print">
                <Info className="h-4 w-4 mr-2 text-primary" />
                Displaying {filteredBondCheckReportData.length} unreleased shipment(s) matching filter.
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

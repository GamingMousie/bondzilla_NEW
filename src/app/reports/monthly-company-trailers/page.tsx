
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Trailer } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Printer, Info, Briefcase, CalendarCheck, ArrowLeft, ArrowRight, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  addMonths,
  subMonths,
} from 'date-fns';
import type { ChartConfig } from '@/components/ui/chart';

interface CompanyTrailerCount {
  companyName: string;
  trailerCount: number;
}

// Function to generate distinct colors for the chart
const generateChartColors = (numColors: number): string[] => {
  const colors: string[] = [];
  for (let i = 0; i < numColors; i++) {
    // Generate HSL colors with varying hue
    const hue = (i * (360 / (numColors + 1))) % 360;
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }
  return colors;
};


export default function MonthlyCompanyTrailersReportPage() {
  const { trailers } = useWarehouse();
  const [isClient, setIsClient] = useState(false);
  const [displayDate, setDisplayDate] = useState(new Date()); // Date to determine the month to display
  const [clientGeneratedDate, setClientGeneratedDate] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    setClientGeneratedDate(new Date().toLocaleDateString());
  }, []);

  const currentMonthStart = useMemo(() => startOfMonth(displayDate), [displayDate]);
  const currentMonthEnd = useMemo(() => endOfMonth(displayDate), [displayDate]);

  const reportData = useMemo((): CompanyTrailerCount[] => {
    if (!isClient) return [];

    const companyCounts: { [companyName: string]: number } = {};

    trailers.forEach(trailer => {
      if (trailer.arrivalDate) {
        try {
          const arrival = parseISO(trailer.arrivalDate);
          if (isWithinInterval(arrival, { start: currentMonthStart, end: currentMonthEnd })) {
            const companyName = trailer.company || 'Unknown Company';
            companyCounts[companyName] = (companyCounts[companyName] || 0) + 1;
          }
        } catch (error) {
          console.error("Error processing trailer for company report:", trailer.id, error);
        }
      }
    });

    return Object.entries(companyCounts)
      .map(([companyName, trailerCount]) => ({ companyName, trailerCount }))
      .sort((a, b) => b.trailerCount - a.trailerCount); // Sort by most trailers first
  }, [trailers, isClient, currentMonthStart, currentMonthEnd]);
  
  const chartColors = useMemo(() => generateChartColors(reportData.length), [reportData.length]);

  const chartConfig = useMemo((): ChartConfig => {
    const config: ChartConfig = {};
    reportData.forEach((item, index) => {
      config[item.companyName] = {
        label: item.companyName,
        color: chartColors[index % chartColors.length],
      };
    });
    return config;
  }, [reportData, chartColors]);


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

  const pageTitle = `Monthly Trailer Arrivals by Company`;
  const cardTitleText = `Trailer Arrivals per Company - ${displayedMonthFormatted}`;
  const cardDescriptionText = `Summary of trailers that arrived in ${displayedMonthFormatted}, grouped by company.`;
  const printTitleText = 'Monthly Trailer Arrivals by Company Report';
  const printPeriodText = `For month: ${displayedMonthFormatted}`;

  const ReportSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-[300px] w-full" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company Name</TableHead>
            <TableHead className="text-right">Trailers Arrived</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow no-print">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <BarChart3 className="mr-3 h-8 w-8 text-primary" />
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
          <CardDescription>{cardDescriptionText}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="print-only-block mb-4">
            <h2 className="text-xl font-semibold text-foreground">{printTitleText}</h2>
            <p className="text-sm text-muted-foreground">{printPeriodText}</p>
            {clientGeneratedDate && <p className="text-xs text-muted-foreground">Date Generated: {clientGeneratedDate}</p>}
          </div>

          {!isClient ? (
            <ReportSkeleton />
          ) : reportData.length === 0 ? (
            <div className="min-h-[200px] flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-md p-8">
              <CalendarCheck className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">
                No trailer arrivals recorded for any company in {displayedMonthFormatted}.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Chart Section */}
              <div className="h-[350px] w-full">
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData} margin={{ top: 5, right: 20, left: -20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="companyName" 
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip
                        cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.5 }}
                        content={<ChartTooltipContent />}
                      />
                      <Bar dataKey="trailerCount" radius={[4, 4, 0, 0]}>
                        {reportData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              {/* Table Section */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap"><Briefcase className="inline-block mr-1 h-4 w-4 print:hidden"/>Company Name</TableHead>
                      <TableHead className="text-right whitespace-nowrap"><BarChart3 className="inline-block mr-1 h-4 w-4 print:hidden"/>Trailers Arrived</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((item) => (
                      <TableRow key={item.companyName}>
                        <TableCell className="font-medium">{item.companyName}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">{item.trailerCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
        {isClient && reportData.length > 0 && (
          <CardFooter className="text-sm text-muted-foreground border-t pt-4 no-print">
            <Info className="h-4 w-4 mr-2 text-primary" />
            Displaying trailer arrival counts for {reportData.length} companies in {displayedMonthFormatted}.
          </CardFooter>
        )}
      </Card>
    </div>
  );
}


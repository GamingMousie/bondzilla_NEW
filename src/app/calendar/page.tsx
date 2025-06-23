
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Trailer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, CalendarDays, Package, Calendar as CalendarIconLucide, Eye } from 'lucide-react'; // Added CalendarIconLucide, Eye
import Link from 'next/link';
import {
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  parseISO,
  isSameMonth,
} from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

// Helper function to generate a unique key for a date (YYYY-MM-DD)
const getDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

// Define an interface for the enriched trailer data including total pieces
interface EnrichedTrailer extends Trailer {
  totalPieces: number;
}

export default function CalendarPage() {
  const { trailers, getShipmentsByTrailerId } = useWarehouse();
  const [isClient, setIsClient] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week'); // 'week' or 'month'

  useEffect(() => {
    setIsClient(true);
  }, []);

  const weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1; // Monday

  // Logic for current display period based on viewMode
  const currentDisplayInfo = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn });
      const end = endOfWeek(currentDate, { weekStartsOn });
      return {
        start,
        end,
        daysToDisplay: eachDayOfInterval({ start, end }),
        title: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`,
      };
    } else { // month view
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const displayGridStart = startOfWeek(monthStart, { weekStartsOn });
      const displayGridEnd = endOfWeek(monthEnd, { weekStartsOn });
      return {
        start: monthStart, // for checking isSameMonth
        end: monthEnd, // for checking isSameMonth
        daysToDisplay: eachDayOfInterval({ start: displayGridStart, end: displayGridEnd }),
        title: format(currentDate, 'MMMM yyyy'),
      };
    }
  }, [currentDate, viewMode, weekStartsOn]);

  const trailersByArrivalDate = useMemo(() => {
    const byDay: { [dateKey: string]: EnrichedTrailer[] } = {};
    if (!isClient || !getShipmentsByTrailerId) return byDay;

    trailers.forEach(trailer => {
      if (trailer.arrivalDate) {
        try {
          const arrival = parseISO(trailer.arrivalDate);
          const key = getDateKey(arrival);
          if (!byDay[key]) {
            byDay[key] = [];
          }
          const shipmentsForTrailer = getShipmentsByTrailerId(trailer.id);
          const totalPieces = shipmentsForTrailer.reduce((acc, shipment) => acc + shipment.quantity, 0);
          byDay[key].push({ ...trailer, totalPieces });
        } catch (error) {
          console.error("Error processing trailer for calendar:", trailer.id, trailer.arrivalDate, error);
        }
      }
    });
    return byDay;
  }, [trailers, isClient, getShipmentsByTrailerId]);

  const handlePrevious = () => {
    setCurrentDate(prev => viewMode === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1));
  };

  const handleNext = () => {
    setCurrentDate(prev => viewMode === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'week' ? 'month' : 'week');
  }

  const pageTitle = viewMode === 'week' ? 'Weekly Arrival Calendar' : 'Monthly Arrival Calendar';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          {viewMode === 'week' ? <CalendarDays className="mr-3 h-8 w-8 text-primary" /> : <CalendarIconLucide className="mr-3 h-8 w-8 text-primary" />}
          {pageTitle}
        </h1>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
          <Button variant="outline" onClick={handlePrevious} aria-label={viewMode === 'week' ? 'Previous week' : 'Previous month'}>
            <ArrowLeft className="h-4 w-4 mr-0 sm:mr-2" /> <span className="hidden sm:inline">{viewMode === 'week' ? 'Prev Week' : 'Prev Month'}</span>
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" onClick={handleNext} aria-label={viewMode === 'week' ? 'Next week' : 'Next month'}>
             <span className="hidden sm:inline">{viewMode === 'week' ? 'Next Week' : 'Next Month'}</span><ArrowRight className="h-4 w-4 ml-0 sm:ml-2" />
          </Button>
          <Button variant="outline" onClick={toggleViewMode} className="w-full sm:w-auto">
            <Eye className="mr-0 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">View {viewMode === 'week' ? 'Month' : 'Week'}</span>
            <span className="sm:hidden">{viewMode === 'week' ? 'Month View' : 'Week View'}</span>
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-2xl text-primary">{currentDisplayInfo.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 border-t border-l border-border">
            {/* Day headers for week view */}
            {viewMode === 'week' && currentDisplayInfo.daysToDisplay.map(day => (
              <div key={`header-${getDateKey(day)}`} className={`p-2 text-center font-medium text-sm sm:text-base border-b border-r border-border ${isToday(day) ? 'bg-primary/10 text-primary font-bold' : 'bg-card'}`}>
                <div>{format(day, 'EEE')}</div>
                <div className={`text-lg sm:text-xl ${isToday(day) ? 'text-primary' : ''}`}>{format(day, 'd')}</div>
              </div>
            ))}
             {/* Day headers for month view (only EEE) */}
            {viewMode === 'month' && currentDisplayInfo.daysToDisplay.slice(0, 7).map(day => (
              <div key={`header-month-${getDateKey(day)}`} className="p-2 text-center font-semibold text-sm sm:text-base border-b border-r border-border bg-card">
                {format(day, 'EEE')}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-l border-border">
            {currentDisplayInfo.daysToDisplay.map(day => {
              const dayKey = getDateKey(day);
              const isCurrentMonthDay = viewMode === 'month' ? isSameMonth(day, currentDisplayInfo.start) : true;
              return (
                <div 
                  key={dayKey} 
                  className={`border-b border-r border-border min-h-[100px] sm:min-h-[150px] flex flex-col 
                             ${isToday(day) ? 'bg-primary/5' : ''} 
                             ${!isCurrentMonthDay ? 'bg-muted/30' : ''}`}
                >
                  {/* Header for month cells, week view header is separate above */}
                  {viewMode === 'month' && (
                     <div className={`p-1.5 text-right font-medium text-xs sm:text-sm 
                                    ${isToday(day) ? 'text-primary font-bold' : isCurrentMonthDay ? 'text-foreground' : 'text-muted-foreground/70'}`}>
                       {format(day, 'd')}
                     </div>
                  )}
                  <div className={`p-1 sm:p-1.5 flex-grow space-y-1 overflow-y-auto max-h-[150px] sm:max-h-[200px] 
                                 ${viewMode === 'month' && !isCurrentMonthDay ? 'opacity-60' : ''}`}>
                    {isClient && trailersByArrivalDate[dayKey]?.map(trailer => (
                      <Link href={`/trailers/${trailer.id}`} key={trailer.id} className="block p-1 sm:p-1.5 bg-background hover:bg-secondary rounded-md text-xs sm:text-sm shadow-sm transition-all border border-border hover:border-primary/50">
                          <p className="font-semibold text-primary truncate" title={`ID: ${trailer.id}`}>ID: {trailer.id}</p>
                          {trailer.name && <p className="text-muted-foreground truncate text-[0.65rem] sm:text-xs" title={`Name: ${trailer.name}`}>{trailer.name}</p>}
                          <div className="flex items-center text-muted-foreground mt-0.5 text-[0.65rem] sm:text-xs">
                             <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 flex-shrink-0" /> 
                             <span>Pieces: {trailer.totalPieces}</span>
                          </div>
                      </Link>
                    ))}
                    {isClient && (!trailersByArrivalDate[dayKey] || trailersByArrivalDate[dayKey]?.length === 0) && isCurrentMonthDay && (
                      <div className="text-xs text-muted-foreground text-center pt-2 sm:pt-4 italic">
                        {viewMode === 'week' ? 'No arrivals' : ''} {/* Less verbose for month view empty days */}
                      </div>
                    )}
                    {!isClient && (
                       <div className="space-y-1 p-1 sm:p-1.5">
                         <Skeleton className="h-10 sm:h-12 w-full" />
                         <Skeleton className="h-10 sm:h-12 w-full" />
                       </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

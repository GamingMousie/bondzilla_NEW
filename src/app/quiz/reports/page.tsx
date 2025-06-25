
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { QuizReport } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListChecks, FileText, User, Calendar as CalendarIcon, ArrowRightCircle, Inbox } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';

export default function QuizReportsListPage() {
  const { quizReports } = useWarehouse();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sortedReports = useMemo(() => {
    if (!isClient) return [];
    return [...quizReports].sort((a, b) => parseISO(b.completedAt).getTime() - parseISO(a.completedAt).getTime());
  }, [quizReports, isClient]);

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PPpp'); // e.g., Jul 20, 2024, 2:30 PM
    } catch (error) {
      return "Invalid Date";
    }
  };
  
  const pageTitle = "Saved Quiz Reports";

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
          <Skeleton className="h-10 w-1/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-md">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <ListChecks className="mr-3 h-8 w-8 text-primary" />
          {pageTitle}
        </h1>
        <Button asChild variant="outline">
          <Link href="/quiz/stock-check">
            Start New Quiz
          </Link>
        </Button>
      </div>

      {sortedReports.length === 0 ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-md p-8 bg-card shadow">
          <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">No quiz reports found.</p>
          <p className="text-sm text-muted-foreground mt-2">Complete a stock check quiz to see reports here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedReports.map(report => (
            <Card key={report.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl text-primary flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Report ID: ...{report.id.slice(-6)}
                </CardTitle>
                <CardDescription>Completed on {formatDate(report.completedAt)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-1 text-sm">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <strong>Completed By:</strong>
                  <span className="ml-1.5">{report.completedBy}</span>
                </div>
                <div className="flex items-center">
                  <ListChecks className="mr-2 h-4 w-4 text-muted-foreground" />
                  <strong>Items Checked:</strong>
                  <span className="ml-1.5">{report.items.length}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="default" size="sm" className="w-full">
                  <Link href={`/quiz/reports/${report.id}`}>
                    View Details <ArrowRightCircle className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

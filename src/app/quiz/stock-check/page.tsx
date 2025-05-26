
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { QuizItem, AnsweredQuizItem, QuizReport as QuizReportType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Check, X, PackageSearch, HelpCircle, Truck, CalendarDays, Box as BoxIcon, Briefcase, MapPin, Save, ListChecks } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export default function StockCheckQuizPage() {
  const { shipments, getTrailerById, addQuizReport } = useWarehouse();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [itemId: string]: 'yes' | 'no' }>({});
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [completerName, setCompleterName] = useState('');
  
  const [sessionQuizItems, setSessionQuizItems] = useState<QuizItem[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDateSafe = (dateString?: string, dateFormat = 'PP') => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), dateFormat);
    } catch (error) {
      return "Invalid Date";
    }
  };
  
  useEffect(() => {
    if (isClient) {
      const initialItems: QuizItem[] = [];
      shipments
        .filter(shipment => !shipment.releasedAt)
        .forEach(shipment => {
          const trailer = getTrailerById(shipment.trailerId);
          const shipmentLocations = shipment.locations && shipment.locations.length > 0
            ? shipment.locations
            : []; // If no locations, it's effectively pending, treat as empty for quiz item generation

          shipmentLocations.forEach((loc, index) => {
            if (loc.name !== 'Pending Assignment') { // Only include items with specific locations
              initialItems.push({
                id: `${shipment.id}-${loc.name}-${index}`, 
                shipmentId: shipment.id,
                stsJob: shipment.stsJob,
                trailerId: shipment.trailerId,
                trailerCompany: trailer?.company,
                trailerArrivalDateFormatted: formatDateSafe(trailer?.arrivalDate),
                shipmentQuantity: shipment.quantity,
                locationName: loc.name,
                locationPallets: loc.pallets,
              });
            }
          });
        });

      const sortedInitialItems = initialItems.sort((a, b) => {
        // "Pending Assignment" items are already filtered out, so no need for specific sorting for them.
        if (a.locationName.toLowerCase() < b.locationName.toLowerCase()) return -1;
        if (a.locationName.toLowerCase() > b.locationName.toLowerCase()) return 1;
        const dateAVal = a.trailerArrivalDateFormatted;
        const dateBVal = b.trailerArrivalDateFormatted;
        const dateA = dateAVal !== 'N/A' && dateAVal !== 'Invalid Date' ? parseISO(formatDateSafe(dateAVal, 'yyyy-MM-dd')).getTime() : 0;
        const dateB = dateBVal !== 'N/A' && dateBVal !== 'Invalid Date' ? parseISO(formatDateSafe(dateBVal, 'yyyy-MM-dd')).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA; // Sort by date descending (newest first)
        if (a.trailerId.toLowerCase() < b.trailerId.toLowerCase()) return -1;
        if (a.trailerId.toLowerCase() > b.trailerId.toLowerCase()) return 1;
        return a.stsJob - b.stsJob;
      });
      setSessionQuizItems(sortedInitialItems);
    }
  }, [isClient, shipments, getTrailerById]);


  const currentItem = sessionQuizItems[currentIndex];
  const totalItems = sessionQuizItems.length;
  const progressPercentage = totalItems > 0 ? ((currentIndex + 1) / totalItems) * 100 : 0;

  const handleAnswer = (answer: 'yes' | 'no') => {
    if (!currentItem) return;
    setUserAnswers(prev => ({ ...prev, [currentItem.id]: answer }));
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsQuizComplete(true);
      setShowNamePrompt(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setUserAnswers({});
    setIsQuizComplete(false);
    setShowNamePrompt(false);
    setCompleterName('');
    if (isClient) { 
        const initialItems: QuizItem[] = [];
        shipments
            .filter(shipment => !shipment.releasedAt)
            .forEach(shipment => {
            const trailer = getTrailerById(shipment.trailerId);
            const shipmentLocations = shipment.locations && shipment.locations.length > 0
                ? shipment.locations
                : [];

            shipmentLocations.forEach((loc, index) => {
                if (loc.name !== 'Pending Assignment') { // Only include items with specific locations
                    initialItems.push({
                    id: `${shipment.id}-${loc.name}-${index}`,
                    shipmentId: shipment.id,
                    stsJob: shipment.stsJob,
                    trailerId: shipment.trailerId,
                    trailerCompany: trailer?.company,
                    trailerArrivalDateFormatted: formatDateSafe(trailer?.arrivalDate),
                    shipmentQuantity: shipment.quantity,
                    locationName: loc.name,
                    locationPallets: loc.pallets,
                    });
                }
            });
            });
        const sortedInitialItems = initialItems.sort((a, b) => {
            if (a.locationName.toLowerCase() < b.locationName.toLowerCase()) return -1;
            if (a.locationName.toLowerCase() > b.locationName.toLowerCase()) return 1;
            const dateAVal = a.trailerArrivalDateFormatted;
            const dateBVal = b.trailerArrivalDateFormatted;
            const dateA = dateAVal !== 'N/A' && dateAVal !== 'Invalid Date' ? parseISO(formatDateSafe(dateAVal, 'yyyy-MM-dd')).getTime() : 0;
            const dateB = dateBVal !== 'N/A' && dateBVal !== 'Invalid Date' ? parseISO(formatDateSafe(dateBVal, 'yyyy-MM-dd')).getTime() : 0;
            if (dateB !== dateA) return dateB - dateA; // Sort by date descending (newest first)
            if (a.trailerId.toLowerCase() < b.trailerId.toLowerCase()) return -1;
            if (a.trailerId.toLowerCase() > b.trailerId.toLowerCase()) return 1;
            return a.stsJob - b.stsJob;
        });
        setSessionQuizItems(sortedInitialItems);
    }
  };

  const handleSaveReport = () => {
    if (!completerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter the name of the person who completed the quiz.",
        variant: "destructive",
      });
      return;
    }

    const answeredItems: AnsweredQuizItem[] = sessionQuizItems.map(item => ({
      ...item,
      userAnswer: userAnswers[item.id] || 'no', 
    }));

    const report: Omit<QuizReportType, 'id'> = {
      completedAt: new Date().toISOString(),
      completedBy: completerName.trim(),
      items: answeredItems,
    };

    addQuizReport(report);
    toast({
      title: "Quiz Report Saved!",
      description: `Report completed by ${completerName.trim()} has been saved.`,
    });
    setShowNamePrompt(false);
  };
  
  const pageTitle = "Stock Check Quiz";

  if (!isClient) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Card className="shadow-lg">
          <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (totalItems === 0 && !isQuizComplete) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <HelpCircle className="mr-3 h-8 w-8 text-primary" />
            {pageTitle}
          </h1>
        </div>
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-md p-8 bg-card shadow">
          <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">No unreleased stock items with specific locations found to quiz.</p>
          <p className="text-sm text-muted-foreground mt-2">All stock might be released, pending assignment, or no items in the warehouse.</p>
           <Button asChild variant="outline" className="mt-6">
            <Link href="/reports/unreleased-stock-locations">View Unreleased Stock Report</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <HelpCircle className="mr-3 h-8 w-8 text-primary" />
          {pageTitle}
        </h1>
        {!isQuizComplete && totalItems > 0 && (
          <div className="text-sm text-muted-foreground font-medium">
            Item {Math.min(currentIndex + 1, totalItems)} of {totalItems}
          </div>
        )}
      </div>

      {!isQuizComplete && totalItems > 0 && (
        <Progress value={progressPercentage} className="w-full h-2" />
      )}
      
      {currentItem && !isQuizComplete && (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Verify Stock Item:</CardTitle>
            <CardDescription>Please confirm if the following details match the physical stock.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-base">
            <div className="flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
              <strong className="mr-2">Location:</strong>
              <span className="font-semibold text-lg">
                {currentItem.locationName}
                {currentItem.locationPallets !== undefined ? ` (${currentItem.locationPallets} plts)` : ''}
              </span>
            </div>
            <div className="flex items-center text-xl font-semibold">
              <Truck className="mr-2 h-6 w-6 text-muted-foreground" />
              <strong className="mr-2">Identifier:</strong>
              <span>Trailer <Link href={`/trailers/${currentItem.trailerId}`} className="text-primary hover:underline">{currentItem.trailerId}</Link> / Job <Link href={`/shipments/${currentItem.shipmentId}`} className="text-primary hover:underline">{currentItem.stsJob}</Link></span>
            </div>
             {currentItem.trailerCompany && (
              <div className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />
                <strong className="mr-2">Company:</strong>
                <span>{currentItem.trailerCompany}</span>
              </div>
            )}
            <div className="flex items-center">
              <CalendarDays className="mr-2 h-5 w-5 text-muted-foreground" />
              <strong className="mr-2">Trailer Arrival:</strong>
              <span>{currentItem.trailerArrivalDateFormatted}</span>
            </div>
            <div className="flex items-center">
              <BoxIcon className="mr-2 h-5 w-5 text-muted-foreground" />
              <strong className="mr-2">Pieces:</strong>
              <span className="font-semibold text-lg">{currentItem.shipmentQuantity}</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-6 border-t">
            <Button 
              onClick={() => handleAnswer('yes')} 
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-lg px-8 py-6"
              disabled={!!userAnswers[currentItem.id]}
            >
              <Check className="mr-2 h-6 w-6" /> YES
            </Button>
            <Button 
              onClick={() => handleAnswer('no')} 
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto text-lg px-8 py-6"
              disabled={!!userAnswers[currentItem.id]}
            >
              <X className="mr-2 h-6 w-6" /> NO
            </Button>
          </CardFooter>
        </Card>
      )}

      {isQuizComplete && !showNamePrompt && (
        <Card className="shadow-lg text-center p-8 bg-secondary">
          <CardTitle className="text-2xl text-primary mb-4">Quiz Complete & Report Saved!</CardTitle>
          <CardDescription className="text-base mb-6">
            You have reviewed all unreleased stock items. The report by {completerName || 'N/A'} has been saved.
          </CardDescription>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="outline" onClick={resetQuiz}>
              Start New Quiz
            </Button>
            <Button asChild>
              <Link href="/reports/unreleased-stock-locations">View Full Stock Report</Link>
            </Button>
            <Button asChild>
              <Link href="/quiz/reports" className="flex items-center">
                <ListChecks className="mr-2 h-4 w-4" /> View Quiz Reports
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {!isQuizComplete && totalItems > 0 && (
        <div className="flex justify-between items-center mt-6">
          <Button onClick={handlePrevious} disabled={currentIndex === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous Item
          </Button>
          <Button onClick={handleNext} disabled={currentIndex >= totalItems - 1 || !userAnswers[currentItem?.id]}>
            Next Item <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      <AlertDialog open={showNamePrompt} onOpenChange={setShowNamePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quiz Complete!</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter your name to save the quiz report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="completerNameInput" className="sr-only">Your Name</Label>
            <Input
              id="completerNameInput"
              placeholder="Enter your name"
              value={completerName}
              onChange={(e) => setCompleterName(e.target.value)}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setShowNamePrompt(false); /* User chose not to save */}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveReport} disabled={!completerName.trim()}>
              <Save className="mr-2 h-4 w-4" /> Save Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}



'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Shipment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer, Package, MapPin, CheckCircle2, CircleOff, FileText, Users, Weight, Box, Truck, Hash, Eye, Send, Briefcase, CalendarCheck, Archive, Edit3, Fingerprint, CalendarClock, Mail, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import EditShipmentDialog from '@/components/shipment/EditShipmentDialog'; 
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';

export default function SingleShipmentPage() {
  const router = useRouter();
  const params = useParams();
  const shipmentId = params.shipmentId as string;

  const { getShipmentById, getTrailerById, markShipmentAsPrinted, updateShipment } = useWarehouse();

  const [shipment, setShipment] = useState<Shipment | null | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const [printedDateTime, setPrintedDateTime] = useState<string | null>(null);
  const [isEditShipmentDialogOpen, setIsEditShipmentDialogOpen] = useState(false); 
  const [isReprintConfirmOpen, setIsReprintConfirmOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (shipmentId && getShipmentById) {
      const currentShipment = getShipmentById(shipmentId);
      setShipment(currentShipment);
    }
  }, [shipmentId, getShipmentById]);
  
  useEffect(() => {
    if (isClient && shipmentId && getShipmentById) {
      const currentShipment = getShipmentById(shipmentId);
      setShipment(currentShipment);
      if (currentShipment?.releasedAt) {
        setPrintedDateTime(new Date(currentShipment.releasedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
      } else {
        setPrintedDateTime(null);
      }
    }
  }, [isClient, shipmentId, getShipmentById, shipment?.releasedAt, shipment?.stsJob, shipment?.mrn, shipment?.clearanceDate]);


  const trailer = shipment?.trailerId ? getTrailerById(shipment.trailerId) : null;

  const canPrint = shipment?.cleared && shipment?.released;

  const proceedWithPrint = () => {
    if (!canPrint || !shipment) return;
    
    // Always update the 'releasedAt' timestamp on print or reprint.
    markShipmentAsPrinted(shipment.id);
    
    // Use a short timeout to allow the state update to propagate before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };
  
  const handlePrint = () => {
    if (canPrint && shipment) {
      if (shipment.releasedAt) {
        setIsReprintConfirmOpen(true);
      } else {
        proceedWithPrint();
      }
    }
  };

  const handleViewDocument = (documentName?: string) => {
    if (documentName) {
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Viewing Document: ${documentName}</title>
              <style>
                body { font-family: sans-serif; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f0f0f0; }
                .container { background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
                h1 { color: #333; }
                p { color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Viewing Document: ${documentName}</h1>
                <p>(This is a placeholder. In a real application, the document content for "${documentName}" would be displayed here.)</p>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        alert(`Could not open new window to view document: ${documentName}. Please check your popup blocker settings.`);
      }
    }
  };

  const formatDate = (dateString?: string, dateFormat = 'PPpp') => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), dateFormat); 
    } catch (error) {
      return "Invalid Date";
    }
  };

  const handleNotifyMissingDocuments = () => {
    if (!shipment) return;

    let missingParts = [];
    if (!shipment.cleared) {
      missingParts.push("clearance");
    }
    if (!shipment.released) {
      missingParts.push("release permission");
    }

    if (missingParts.length === 0) return; // Should not happen if button is visible

    const missingSubjectPart = missingParts.join(" & ");
    const subject = `Missing ${missingSubjectPart} for Trailer ${shipment.trailerId} / Job ${shipment.stsJob}`;
    const body = `Good Morning,\n\nWe have a driver waiting to collect "${shipment.trailerId} / Job ${shipment.stsJob}" but we are missing files for above shipment.\n\nCan you be able to update us ASAP please?`;
    const mailtoLink = `mailto:klaudia@mail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };


  if (!isClient || shipment === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(10)].map((_, i) => ( 
              <div key={i} className="flex items-center space-x-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (shipment === null) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] space-y-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <p className="text-2xl font-semibold text-destructive">Shipment Not Found</p>
        <p className="text-xl text-muted-foreground">Could not find shipment with ID: {shipmentId}</p>
        <Button variant="outline" onClick={() => router.push('/shipments')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Shipments
        </Button>
      </div>
    );
  }

  if (!shipment) return null;

  const locations = shipment.locations || [{ name: 'Pending Assignment' }];
  const isPendingAssignment = locations.length === 1 && locations[0].name === 'Pending Assignment';
  const showNotifyButton = !shipment.cleared || !shipment.released;


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <Button variant="outline" onClick={() => router.back()} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
          <Button onClick={() => setIsEditShipmentDialogOpen(true)} variant="outline" size="sm">
            <Edit3 className="mr-2 h-4 w-4" /> Edit Shipment
          </Button>
          {showNotifyButton && (
            <Button onClick={handleNotifyMissingDocuments} variant="outline" size="sm" className="text-orange-600 hover:text-orange-700 border-orange-500 hover:border-orange-600">
              <Mail className="mr-2 h-4 w-4" /> Notify Missing Docs
            </Button>
          )}
          <Button onClick={handlePrint} disabled={!canPrint} size="sm">
            <Printer className="mr-2 h-4 w-4" /> Print Shipment
            {!canPrint && <span className="ml-2 text-xs">(Requires Cleared & Permitted)</span>}
          </Button>
        </div>
      </div>

      <Card className="printable-area shadow-lg">
        <CardHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl md:text-3xl text-primary flex items-center">
                <Package className="mr-3 h-8 w-8" />
                Shipment Details
              </CardTitle>
              <CardDescription className="mt-1">
                STS Job: <span className="font-semibold text-foreground">{shipment.stsJob}</span> | Shipment ID: <span className="font-semibold text-foreground">{shipment.id.substring(0,8)}...</span>
                {shipment.customerJobNumber && ` | Cust. Job: ${shipment.customerJobNumber}`}
              </CardDescription>
            </div>
             {trailer && (
              <Link href={`/trailers/${trailer.id}`} className="no-print-in-area">
                <Badge variant="secondary" className="whitespace-nowrap hover:bg-primary/10">
                  <Truck className="mr-1.5 h-4 w-4"/>
                  Trailer: {trailer.id}
                </Badge>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 print:grid-cols-2 md:grid-cols-2 print:gap-x-4 print:gap-y-3 gap-x-8 gap-y-6 text-sm card-content-print">

          {trailer && (
            <div className="space-y-1">
              <h3 className="font-semibold text-muted-foreground flex items-center"><Truck className="mr-2 h-4 w-4" />Associated Trailer ID</h3>
              <p className="text-2xl font-bold text-foreground">
                <Link href={`/trailers/${trailer.id}`} className="hover:underline print:text-foreground print:no-underline">
                  {trailer.id}
                </Link>
              </p>
            </div>
          )}

          <div className="space-y-1">
            <h3 className="font-semibold text-muted-foreground flex items-center"><Hash className="mr-2 h-4 w-4" />STS Job Number</h3>
            <p className="text-2xl font-bold text-foreground">{shipment.stsJob}</p>
          </div>
          
          {shipment.customerJobNumber && (
            <div className="space-y-1">
              <h3 className="font-semibold text-muted-foreground flex items-center"><Briefcase className="mr-2 h-4 w-4" />Customer Job Number</h3>
              <p className="text-lg font-medium">{shipment.customerJobNumber}</p>
            </div>
          )}

          {shipment.mrn && (
            <div className="space-y-1 no-print">
              <h3 className="font-semibold text-muted-foreground flex items-center"><Fingerprint className="mr-2 h-4 w-4" />MRN</h3>
              <p className="text-lg font-medium">{shipment.mrn}</p>
            </div>
          )}


          <div className="space-y-1">
            <h3 className="font-semibold text-muted-foreground flex items-center"><Package className="mr-2 h-4 w-4" />Quantity</h3>
            <p className="text-base font-medium">{shipment.quantity} pieces</p>
          </div>

          {shipment.palletSpace !== undefined && shipment.palletSpace !== null && (
            <div className="space-y-1">
              <h3 className="font-semibold text-muted-foreground flex items-center"><Box className="mr-2 h-4 w-4" />Total Pallet Spaces</h3>
              <p>{shipment.palletSpace}</p>
            </div>
          )}

          <div className="space-y-1">
            <h3 className="font-semibold text-muted-foreground flex items-center"><Send className="mr-2 h-4 w-4" />Exporter (Consignor)</h3>
            <p>{shipment.exporter}</p>
          </div>
          
          <div className="space-y-1">
            <h3 className="font-semibold text-muted-foreground flex items-center"><Users className="mr-2 h-4 w-4" />Importer (Consignee)</h3>
            <p>{shipment.importer}</p>
          </div>


          {shipment.weight !== undefined && shipment.weight !== null && (
             <div className="space-y-1">
              <h3 className="font-semibold text-muted-foreground flex items-center"><Weight className="mr-2 h-4 w-4" />Weight</h3>
              <p>{shipment.weight} kg</p>
            </div>
          )}

           {shipment.releasedAt && (
            <div className="space-y-1 no-print">
              <h3 className="font-semibold text-muted-foreground flex items-center"><CalendarCheck className="mr-2 h-4 w-4" />Released At</h3>
              <p className="text-base font-medium">{formatDate(shipment.releasedAt)}</p>
            </div>
          )}

          {shipment.clearanceDate && (
            <div className="space-y-1 no-print">
              <h3 className="font-semibold text-muted-foreground flex items-center"><CalendarClock className="mr-2 h-4 w-4" />Clearance Date</h3>
              <p className="text-base font-medium">{formatDate(shipment.clearanceDate, 'PP')}</p>
            </div>
          )}

          {shipment.comments && (
            <div className="space-y-1 col-span-1 print:col-span-2 md:col-span-2">
                <h3 className="font-semibold text-muted-foreground flex items-center"><MessageSquare className="mr-2 h-4 w-4" />Comments</h3>
                <blockquote className="border-l-4 border-primary pl-4 italic text-base">
                    {shipment.comments}
                </blockquote>
            </div>
          )}

          <div className="space-y-1 col-span-1 print:col-span-2 md:col-span-2">
            <h3 className="font-semibold text-muted-foreground flex items-center"><MapPin className="mr-2 h-4 w-4" />Warehouse Locations</h3>
            <div className="flex flex-wrap gap-2 mt-1">
            {isPendingAssignment ? (
                <Badge variant="outline" className="text-base">Pending Assignment</Badge>
              ) : (
                locations.map((loc, index) => (
                  <Badge key={index} variant="secondary" className="text-base">
                    {loc.name}
                    {loc.pallets !== undefined && ` (${loc.pallets} plts)`}
                    {locations.length > 1 && ` (${index + 1} of ${locations.length})`}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3 col-span-1 print:col-span-2 md:col-span-2 border-t pt-4 mt-2">
            <h3 className="font-semibold text-muted-foreground mb-2">Status & Documents</h3>
            <div className="grid grid-cols-1 print:grid-cols-2 sm:grid-cols-2 print:gap-2 gap-4">
                 <div>
                    <div className="flex items-center mb-1">
                      {shipment.released ? <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" /> : <CircleOff className="mr-2 h-5 w-5 text-red-500" />}
                      <span className="font-medium">Permitted to be Released:</span>
                      <span className={`ml-2 font-bold ${shipment.released ? 'text-green-600' : 'text-red-500'}`}>
                        {shipment.released ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {shipment.releaseDocumentName && (
                      <div className="flex items-center text-xs text-muted-foreground ml-7">
                        <FileText className="mr-1 h-3.5 w-3.5" /> Doc: {shipment.releaseDocumentName}
                        <Button
                            variant="link"
                            size="sm"
                            className="ml-2 h-auto p-0 text-xs no-print-in-area"
                            onClick={() => handleViewDocument(shipment.releaseDocumentName)}
                            aria-label={`View release document ${shipment.releaseDocumentName}`}
                          >
                            <Eye className="mr-1 h-3 w-3" /> View
                          </Button>
                      </div>
                    )}
                 </div>
                 <div>
                    <div className="flex items-center mb-1">
                      {shipment.cleared ? <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" /> : <CircleOff className="mr-2 h-5 w-5 text-red-500" />}
                      <span className="font-medium">Cleared:</span>
                       <span className={`ml-2 font-bold ${shipment.cleared ? 'text-green-600' : 'text-red-500'}`}>
                        {shipment.cleared ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {shipment.clearanceDocumentName && (
                      <div className="flex items-center text-xs text-muted-foreground ml-7">
                        <FileText className="mr-1 h-3.5 w-3.5" /> Doc: {shipment.clearanceDocumentName}
                        <Button
                            variant="link"
                            size="sm"
                            className="ml-2 h-auto p-0 text-xs no-print-in-area"
                            onClick={() => handleViewDocument(shipment.clearanceDocumentName)}
                            aria-label={`View clearance document ${shipment.clearanceDocumentName}`}
                          >
                            <Eye className="mr-1 h-3 w-3" /> View
                          </Button>
                      </div>
                    )}
                 </div>
            </div>
            <div className="flex items-center pt-2">
              <Archive className={`mr-2 h-5 w-5 ${shipment.emptyPalletRequired && shipment.emptyPalletRequired > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className="font-medium">Empty Pallets Required:</span>
              <span className={`ml-2 font-bold ${shipment.emptyPalletRequired && shipment.emptyPalletRequired > 0 ? 'text-destructive text-lg' : ''}`}>
                {shipment.emptyPalletRequired && shipment.emptyPalletRequired > 0 ? shipment.emptyPalletRequired : 'No'}
              </span>
            </div>
          </div>
        </CardContent>
        {trailer && trailer.arrivalDate && (
          <CardFooter className="border-t pt-4 text-xs text-muted-foreground no-print">
              <p>Associated with Trailer <Link href={`/trailers/${trailer.id}`} className="text-primary hover:underline font-semibold print:text-foreground print:no-underline">{trailer.id}</Link>, arrived on {formatDate(trailer.arrivalDate, 'PP')}.</p>
          </CardFooter>
        )}

        {/* Signature Block - Print Only */}
        <div className="print-only-block print-signature-block px-6 pb-6 pt-8 mt-8 border-t border-border">
          <h3 className="text-lg font-semibold mb-8 text-center text-foreground">Driver's Acknowledgment of Receipt</h3>
          <div className="grid grid-cols-2 gap-x-12 gap-y-12">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted-foreground">Signature</label>
              <div className="h-12 border-b border-foreground"></div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted-foreground">Printed Name</label>
              <div className="h-12 border-b border-foreground"></div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted-foreground">Company</label>
              <div className="h-12 border-b border-foreground"></div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-muted-foreground">Vehicle Reg:</label>
              <div className="h-12 border-b border-foreground"></div>
            </div>
          </div>
        </div>
        
        {/* Released (printed) on Date - Print Only */}
        {printedDateTime && (
          <div className="print-only-block mt-4 pt-4 text-center border-t border-border px-6 pb-6">
            <p className="text-xs text-muted-foreground">
              Released (printed) on: {printedDateTime}
            </p>
          </div>
        )}

      </Card>

      {isEditShipmentDialogOpen && shipment && ( 
        <EditShipmentDialog
          isOpen={isEditShipmentDialogOpen}
          setIsOpen={setIsEditShipmentDialogOpen}
          shipmentToEdit={shipment}
        />
      )}

      {isReprintConfirmOpen && (
        <ConfirmationDialog
          isOpen={isReprintConfirmOpen}
          setIsOpen={setIsReprintConfirmOpen}
          onConfirm={proceedWithPrint}
          title="Reprint Shipment?"
          description={`This shipment was already released on ${printedDateTime}. Are you sure you want to print it again? This will update the release date to now.`}
          confirmText="Yes, Reprint"
        />
      )}
    </div>
  );
}

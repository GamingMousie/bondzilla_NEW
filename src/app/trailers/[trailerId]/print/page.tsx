
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Trailer, Shipment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer, Truck, FileText, Edit2, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Helper to create a line for data or empty space
const FormLine = ({ label, value, valueBold = false, fullWidthValue = false, minHeight = 'min-h-[1.5em]', className }: { label?: string, value?: string | number | null, valueBold?: boolean, fullWidthValue?: boolean, minHeight?: string, className?: string }) => {
  const valueDisplay = value !== undefined && value !== null ? String(value) : '';
  return (
    <div className={`flex ${fullWidthValue && label ? 'flex-col items-start' : 'flex-row items-end'} ${minHeight} mb-1 print:mb-0.5 ${className}`}>
      {label && <span className="text-xs print:text-[7pt] mr-1 whitespace-nowrap shrink-0">{label}:</span>}
      <span
        className={`flex-grow border-b border-foreground ${valueBold ? 'font-semibold' : ''} text-xs print:text-[8pt] pb-px overflow-hidden text-ellipsis whitespace-nowrap`}
      >
        {valueDisplay}
      </span>
    </div>
  );
};


export default function PrintTrailerTransferPage() {
  const router = useRouter();
  const params = useParams();
  const trailerId = params.trailerId as string;
  const { toast } = useToast();

  const { getTrailerById, getShipmentsByTrailerId, updateTrailer } = useWarehouse();

  const [trailer, setTrailer] = useState<Trailer | null | undefined>(undefined);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [generatedDate, setGeneratedDate] = useState<string | null>(null);

  // State for editable fields
  const [reportingPersonName, setReportingPersonName] = useState('');
  const [mvArrived, setMvArrived] = useState('');
  const [mvDate, setMvDate] = useState('');
  const [shipDateArrivalC, setShipDateArrivalC] = useState('');
  const [countryOfOriginC, setCountryOfOriginC] = useState('');
  const [customsSealNoC, setCustomsSealNoC] = useState('');

  const [showAdditionalDetailsForm, setShowAdditionalDetailsForm] = useState(false);


  useEffect(() => {
    setIsClient(true);
    if (trailerId && getTrailerById) {
      const currentTrailer = getTrailerById(trailerId);
      setTrailer(currentTrailer);
      if (currentTrailer) {
        const currentShipments = getShipmentsByTrailerId(trailerId);
        setShipments(currentShipments);
      }
    }
    setGeneratedDate(new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
  }, [trailerId, getTrailerById, getShipmentsByTrailerId]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveACPForm = () => {
    if (!trailer) return;
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    const acpDocName = `ACP_Form_${trailer.id}_${timestamp}.pdf`;
    updateTrailer(trailer.id, { acpDocumentName: acpDocName });
    toast({
      title: "ACP Form Saved",
      description: `Associated '${acpDocName}' with trailer ${trailer.id}. You can manage this in 'Edit Trailer'.`,
    });
  };

  const formatDateForForm = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return "Invalid Date";
    }
  };

  if (!isClient || trailer === undefined) {
    return (
      <div className="space-y-6 p-4">
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
            {[...Array(8)].map((_, i) => (
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

  if (trailer === null) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] space-y-4 p-4">
        <Truck className="h-16 w-16 text-muted-foreground" />
        <p className="text-2xl font-semibold text-destructive">Trailer Not Found</p>
        <p className="text-xl text-muted-foreground">Could not find trailer with ID: {trailerId}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  if (!trailer) return null;

  const manifestRef = trailer.id;
  const unitContainerNumber = trailer.name;
  const t1_1 = trailer.customField1;
  const t1_2 = trailer.customField2;
  const arrivalDateFormatted = formatDateForForm(trailer.arrivalDate);
  const totalShipments = shipments.length;
  const clearanceAgencyCompany = trailer.company;


  return (
    <div className="space-y-6 p-2 md:p-4 print:p-0">
      <div className="no-print flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <Button variant="outline" onClick={() => router.back()} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4"> {/* Grouping controls */}
          <div className="flex items-center gap-2">
            <Label htmlFor="reportingPersonName" className="whitespace-nowrap text-sm">Person Signing:</Label>
            <Input
                id="reportingPersonName"
                value={reportingPersonName}
                onChange={(e) => setReportingPersonName(e.target.value)}
                placeholder="Name"
                className="h-9 w-full sm:w-[150px]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdditionalDetailsForm(!showAdditionalDetailsForm)}
          >
            <Edit2 className="mr-2 h-4 w-4" />
            {showAdditionalDetailsForm ? 'Hide Details Form' : 'Edit Print Details'}
          </Button>
          <Button onClick={handleSaveACPForm} size="sm" variant="outline">
            <Save className="mr-2 h-4 w-4" /> Save ACP Form
          </Button>
          <Button onClick={handlePrint} size="sm">
            <Printer className="mr-2 h-4 w-4" /> Print Document
          </Button>
        </div>
      </div>

      {/* Editable fields section - no-print, conditionally rendered */}
      {showAdditionalDetailsForm && (
        <Card className="no-print mb-6 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center"><Edit2 className="mr-2 h-5 w-5 text-primary"/>Additional Details for Print</CardTitle>
            <CardDescription>Fill these fields before printing the document.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <Label htmlFor="mvArrived" className="text-sm font-medium">MV Arrived Per (Part A)</Label>
              <Input id="mvArrived" value={mvArrived} onChange={(e) => setMvArrived(e.target.value)} placeholder="Enter MV name" className="mt-1"/>
            </div>
            <div>
              <Label htmlFor="mvDate" className="text-sm font-medium">MV Arrival Date (Part A)</Label>
              <Input id="mvDate" value={mvDate} onChange={(e) => setMvDate(e.target.value)} placeholder="Enter MV arrival date" className="mt-1"/>
            </div>
            <div>
              <Label htmlFor="shipDateArrivalC" className="text-sm font-medium">Ship/Date of Arrival (Part C)</Label>
              <Input id="shipDateArrivalC" value={shipDateArrivalC} onChange={(e) => setShipDateArrivalC(e.target.value)} placeholder="Ship/Date" className="mt-1"/>
            </div>
            <div>
              <Label htmlFor="countryOfOriginC" className="text-sm font-medium">Country of Origin (Part C)</Label>
              <Input id="countryOfOriginC" value={countryOfOriginC} onChange={(e) => setCountryOfOriginC(e.target.value)} placeholder="Country" className="mt-1"/>
            </div>
            <div>
              <Label htmlFor="customsSealNoC" className="text-sm font-medium">Customs Seal No. (Part C)</Label>
              <Input id="customsSealNoC" value={customsSealNoC} onChange={(e) => setCustomsSealNoC(e.target.value)} placeholder="Customs Seal" className="mt-1"/>
            </div>
          </CardContent>
        </Card>
      )}


      <Card className="printable-area shadow-lg print:shadow-none print:border-none">
        <CardHeader className="border-b pb-2 print:pb-1 print:border-black">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg md:text-xl text-primary print:text-black print:font-bold flex items-center">
                <FileText className="mr-2 h-6 w-6 print:hidden" />
                Transfer to Authorised Temporary Storage Facility
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs print:text-[7pt]">
                Ref: {trailer.id} / {trailer.name}
              </CardDescription>
            </div>
            {generatedDate && (
                 <p className="text-xs text-muted-foreground print:text-[7pt] mt-1 self-start">Generated: {generatedDate}</p>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-3 text-xs print:text-[8pt] print:pt-1 space-y-3 print:space-y-1">
          {/* Part A */}
          <div className="space-y-1 print:space-y-0.5 border border-foreground print:border-black p-2 print:p-1">
            <h3 className="font-bold text-sm print:text-[9pt] mb-1 print:mb-0.5">Part A: (Removal Request for Direct imports from a third country)</h3>
            <div className="flex items-end">
              <span className="mr-1 text-xs print:text-[7pt] whitespace-nowrap">Customs &amp; Excise at</span>
              <span className="flex-grow border-b border-foreground text-xs print:text-[8pt] pb-px mx-1 min-w-[10ch]"></span>
              <span className="font-semibold mx-1 text-xs print:text-[8pt]">DUBLIN PORT</span>
              <span className="flex-grow border-b border-foreground text-xs print:text-[8pt] pb-px mx-1 min-w-[15ch]"></span>
              <span className="text-xs print:text-[7pt] whitespace-nowrap">(import station)</span>
            </div>
            <FormLine label="Permission is requested to remove unit/container number" value={unitContainerNumber} valueBold/>
            <div className="grid grid-cols-3 gap-x-2 items-end">
                <FormLine label="Which arrived per MV" value={mvArrived} />
                <FormLine label="date" value={mvDate} />
                <FormLine label="Manifest Ref" value={manifestRef} valueBold />
            </div>
            <FormLine label="to the Authorised Temporary Storage Facility of" value="SPRATT LOGISTICS" valueBold />

            <div className="text-xs print:text-[7pt] mt-1 print:mt-0.5">T1 Groupage covered Under Transit MRN No(s):</div>
            <div className="border border-dashed border-muted-foreground print:border-gray-400 p-1 min-h-[2.5em] print:min-h-[1.5em]">
                <p className="whitespace-pre-wrap text-xs print:text-[7pt]">{t1_1 || ''} {t1_1 && t1_2 && ' / '} {t1_2 || ''}</p>
            </div>

            <div className="grid grid-cols-3 gap-x-2 mt-2 print:mt-1">
                <FormLine label="Signature" value={reportingPersonName} />
                <FormLine label="Company" value="Spratt" valueBold />
                <FormLine label="Date" value={arrivalDateFormatted} valueBold />
            </div>
          </div>

          {/* Part B */}
          <div className="space-y-1 print:space-y-0.5 border border-foreground print:border-black p-2 print:p-1">
            <h3 className="font-bold text-sm print:text-[9pt] mb-1 print:mb-0.5">Part B (Official use only)</h3>
            <div className="grid grid-cols-[2fr_1fr] gap-x-4 print:gap-x-2"> {/* Adjusted grid for Part B layout */}
              <div className="space-y-1 print:space-y-0.5"> {/* Left column for fields */}
                <FormLine label="Customs seal number applied" />
                <FormLine label="Lorry Reg. Number" />
                <FormLine label="Sealing Official’s signature" />
              </div>
              <div className="space-y-1 print:space-y-0.5 flex flex-col justify-between"> {/* Right column for Local Ref and Date Stamp */}
                <FormLine label="Local Ref Number" />
                <div className="border border-foreground print:border-black flex items-center justify-center text-center min-h-[3em] print:min-h-[2.5em] p-1 text-xs print:text-[7pt]">
                  Date Stamp and Time
                </div>
              </div>
            </div>
          </div>


          {/* Part C */}
           <div className="space-y-1 print:space-y-0.5 border border-foreground print:border-black p-2 print:p-1">
            <h3 className="font-bold text-sm print:text-[9pt] mb-1 print:mb-0.5">Part C: (Notification on arrival of good at T.S. Facility)</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 print:gap-y-0">
                <FormLine label="Ship/date of Arrival" value={shipDateArrivalC}/>
                <FormLine label="T.S. (ACP) Ref" value={manifestRef} valueBold/>
                <FormLine label="Container/Trailer Number" value={unitContainerNumber} valueBold/>
                <FormLine label="Number of T1/Non-EU consignments" value={totalShipments} valueBold/>
                <FormLine label="Country of Origin" value={countryOfOriginC}/>
                <FormLine label="Customs Seal No." value={customsSealNoC}/>
                <FormLine label="Clearance Agency" value={clearanceAgencyCompany} valueBold/>
                <FormLine label="Person Reporting" value={reportingPersonName} valueBold/>
                <FormLine label="Contact No." value="01 8527 100" valueBold/>
            </div>
          </div>

          {/* N.B. Section */}
          <div className="text-xs print:text-[7pt] mt-2 print:mt-1 space-y-0.5 print:leading-tight">
            <p className="font-bold">N.B. On arrival of T1 goods at the Temporary Storage Facility, this completed advice note plus the groupage manifest and all associated Transit Document/s are to be emailed immediately to Customs Container Reports <span className="underline">tsfreports@revenue.ie</span></p>
            <p>Simultaneously, all associated transit MRNS are to be reported in NCTS.</p>
            <p>The container/trailer must be delivered direct to the Temporary Storage Facility above. If seals are affixed, they are not to be broken without Customs authorisation.</p>
            <p>Reporting is authorised —Mon to Fri 6am to 8pm & Sat 8am to 1pm only—</p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

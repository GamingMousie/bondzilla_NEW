'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Load, Shipment, LoadUpdateData } from '@/types';
import ShipmentCard from '@/components/shipment/ShipmentCard';
import AddShipmentDialog from '@/components/shipment/AddShipmentDialog';
import EditLoadDialog from '@/components/load/EditLoadDialog';
import AttachLoadDocumentDialog from '@/components/load/AttachLoadDocumentDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, Package, Truck, Briefcase, CalendarDays, Weight, Tag, Printer, FileText, Eye, Edit, UploadCloud, BookOpen, FileBadge, Mail, FileSignature, Download } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

// Define a type for the document fields we can manage
type LoadDocumentField = 'outturnReportDocumentName' | 't1SummaryDocumentName' | 'manifestDocumentName' | 'acpDocumentName';


export default function LoadShipmentsPage() {
  const router = useRouter();
  const params = useParams();
  const loadId = params.loadId as string;
  const { user } = useAuth();

  const {
    getShipmentsByLoadId,
    deleteShipment,
    getLoadById,
    updateLoad,
  } = useWarehouse();

  const [load, setLoad] = useState<Load | null | undefined>(undefined);
  const [isAddShipmentDialogOpen, setIsAddShipmentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [isAttachLoadDocDialogOpen, setIsAttachLoadDocDialogOpen] = useState(false);
  const [documentToManageInfo, setDocumentToManageInfo] = useState<{
    field: LoadDocumentField;
    currentName?: string | null;
    friendlyName: string;
  } | null>(null);


  useEffect(() => {
    if (loadId) {
      const currentLoad = getLoadById(loadId);
      setLoad(currentLoad);
    }
  }, [loadId, getLoadById]);

  const shipmentsForCurrentLoad = useMemo(() => {
    if (!load) return [];
    return getShipmentsByLoadId(load.id);
  }, [load, getShipmentsByLoadId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'PPpp');
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Invalid Date";
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
  
  const handleDownloadDocument = (documentName?: string) => {
    if (documentName) {
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Downloading Document: ${documentName}</title>
              <style>
                body { font-family: sans-serif; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f0f0f0; }
                .container { background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
                h1 { color: #333; }
                p { color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Simulating Download: ${documentName}</h1>
                <p>(This is a placeholder. In a real application, the file "${documentName}" would start downloading.)</p>
                <p>Current system only stores document names, not the files themselves.</p>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        alert(`Could not open new window to simulate download for: ${documentName}. Please check your popup blocker settings.`);
      }
    }
  };

  const handleEmailDocuments = () => {
    if (!load) return;
    const subject = `${load.id} // ${load.name}`;
    const emailTo = 'klaudia@mail.com';
    let body = "Good morning,\n\nPlease see attached:\n\n";
    body += "- ACP Form (Please generate from 'Print Load ACP Form' page and attach or ensure it's associated below)\n";
    if (load.t1SummaryDocumentName) {
      body += `- T1 Summary: ${load.t1SummaryDocumentName}\n`;
    } else {
      body += "- T1 Summary (not attached to load record)\n";
    }
    if (load.manifestDocumentName) {
      body += `- Manifest: ${load.manifestDocumentName}\n`;
    } else {
      body += "- Manifest (not attached to load record)\n";
    }
     if (load.acpDocumentName) {
      body += `- Saved ACP Form: ${load.acpDocumentName}\n`;
    }

    const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleOpenAttachDialog = (field: LoadDocumentField, friendlyName: string, currentName?: string | null) => {
    setDocumentToManageInfo({ field, currentName, friendlyName });
    setIsAttachLoadDocDialogOpen(true);
  };

  const handleLoadDocumentAction = (
    affectedLoadId: string,
    docField: keyof LoadUpdateData,
    newDocumentName: string | null
  ) => {
    if (affectedLoadId === load?.id) {
        const updatePayload: LoadUpdateData = {};
        (updatePayload as any)[docField] = newDocumentName;
        updateLoad(affectedLoadId, updatePayload);
    }
  };


  if (load === undefined) {
    return (
      <div class="flex justify-center items-center h-[calc(100vh-200px)]">
        <p class="text-xl text-muted-foreground">Loading load details...</p>
      </div>
    );
  }

  if (load === null) {
     return (
        <div class="flex flex-col justify-center items-center h-[calc(100vh-200px)] space-y-4">
          <Truck class="h-16 w-16 text-muted-foreground" />
          <p class="text-2xl font-semibold text-destructive">Load Not Found</p>
          <p class="text-xl text-muted-foreground">Could not find load with ID: {loadId}</p>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft class="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>
     );
  }

  const DocumentSection = ({ 
    title, 
    documentName, 
    icon: Icon, 
    documentField 
  }: { 
    title: string, 
    documentName?: string | null, 
    icon: React.ElementType, 
    documentField: LoadDocumentField 
  }) => (
    <div class="py-4 border-t">
      <h3 class="text-lg font-semibold flex items-center mb-2">
        <Icon class="mr-2 h-5 w-5 text-primary" />
        {title}
      </h3>
      {documentName ? (
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 rounded-md mb-2 gap-2">
          <div class="flex items-center">
            <FileText class="mr-2 h-4 w-4 text-muted-foreground" />
            <span class="text-sm font-medium break-all">{documentName}</span>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <Button
              variant="link"
              size="sm"
              onClick={() => handleViewDocument(documentName)}
              aria-label={`View ${title.toLowerCase()} ${documentName}`}
              class="p-0 h-auto"
            >
              <Eye class="mr-1 h-4 w-4" /> View
            </Button>
            <Button
              variant="link"
              size="sm"
              onClick={() => handleDownloadDocument(documentName)}
              aria-label={`Download ${title.toLowerCase()} ${documentName}`}
              class="p-0 h-auto text-primary"
            >
              <Download class="mr-1 h-4 w-4" /> Download
            </Button>
          </div>
        </div>
      ) : (
        <p class="text-sm text-muted-foreground mb-2">No {title.toLowerCase()} attached.</p>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleOpenAttachDialog(documentField, title, documentName)}
      >
        {documentName ? <Edit class="mr-2 h-4 w-4" /> : <UploadCloud class="mr-2 h-4 w-4" />}
        {documentName ? `Change/Remove ${title}` : `Add ${title}`}
      </Button>
      <p class="text-xs text-muted-foreground mt-1">Manage the {title.toLowerCase()} PDF.</p>
    </div>
  );

  return (
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowLeft class="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        <div class="flex gap-2 flex-wrap justify-center sm:justify-end">
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Edit class="mr-2 h-4 w-4" /> Edit Load Details
          </Button>
          <Button variant="outline" size="sm" onClick={handleEmailDocuments}>
            <Mail class="mr-2 h-4 w-4" /> Email Load Documents
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/loads/${load.id}/print`}>
              <Printer class="mr-2 h-4 w-4" /> Print Load ACP Form
            </Link>
          </Button>
        </div>
      </div>

      <Card class="shadow-lg">
        <CardHeader>
          <div class="flex items-start gap-4">
            <Truck class="h-12 w-12 text-primary mt-1" />
            <div>
              <CardTitle class="text-3xl">{load.id}</CardTitle>
              <CardDescription>
                Name: {load.name} | Status: <span class="font-semibold">{load.status}</span>
              </CardDescription>
              {load.company && (
                <CardDescription class="mt-1 flex items-center">
                  <Briefcase class="mr-2 h-4 w-4 text-muted-foreground" />
                  Company: <span class="font-semibold ml-1">{load.company}</span>
                </CardDescription>
              )}
               {load.sprattJobNumber && (
                <CardDescription class="mt-1 flex items-center">
                  <Briefcase class="mr-2 h-4 w-4 text-muted-foreground" />
                  Spratt Job Number: <span class="font-semibold ml-1">{load.sprattJobNumber}</span>
                </CardDescription>
              )}
              {load.weight !== undefined && load.weight !== null && (
                <CardDescription class="mt-1 flex items-center">
                  <Weight class="mr-2 h-4 w-4 text-muted-foreground" />
                  Weight: <span class="font-semibold ml-1">{load.weight} kg</span>
                </CardDescription>
              )}
               {load.arrivalDate && (
                <CardDescription class="mt-1 flex items-center">
                  <CalendarDays class="mr-2 h-4 w-4 text-muted-foreground" />
                  Arrival: <span class="font-semibold ml-1">{formatDate(load.arrivalDate)}</span>
                </CardDescription>
              )}
              {load.storageExpiryDate && (
                <CardDescription class="mt-1 flex items-center">
                  <CalendarDays class="mr-2 h-4 w-4 text-muted-foreground" />
                  Storage Expiry: <span class="font-semibold ml-1">{formatDate(load.storageExpiryDate)}</span>
                </CardDescription>
              )}
              {load.customField1 && (
                <CardDescription class="mt-1 flex items-center">
                  <Tag class="mr-2 h-4 w-4 text-muted-foreground" />
                  T1.1: <span class="font-semibold ml-1">{load.customField1}</span>
                </CardDescription>
              )}
              {load.customField2 && (
                <CardDescription class="mt-1 flex items-center">
                  <Tag class="mr-2 h-4 w-4 text-muted-foreground" />
                  T1.2: <span class="font-semibold ml-1">{load.customField2}</span>
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DocumentSection
            title="Out-turn Report"
            documentName={load.outturnReportDocumentName}
            icon={FileText}
            documentField="outturnReportDocumentName"
          />
          <DocumentSection
            title="T1 Summary"
            documentName={load.t1SummaryDocumentName}
            icon={FileBadge}
            documentField="t1SummaryDocumentName"
          />
          <DocumentSection
            title="Manifest"
            documentName={load.manifestDocumentName}
            icon={BookOpen}
            documentField="manifestDocumentName"
          />
          <DocumentSection
            title="ACP Form"
            documentName={load.acpDocumentName}
            icon={FileSignature}
            documentField="acpDocumentName"
          />

          <div class="flex justify-between items-center mb-6 pt-4 border-t mt-4">
            <h2 class="text-2xl font-semibold flex items-center">
              <Package class="mr-3 h-7 w-7 text-primary" />
              Shipments ({shipmentsForCurrentLoad.length})
            </h2>
            {user && !user.companyFilter && (
                <Button onClick={() => setIsAddShipmentDialogOpen(true)}>
                    <PlusCircle class="mr-2 h-5 w-5" /> Add Shipment
                </Button>
            )}
          </div>

          {shipmentsForCurrentLoad.length === 0 ? (
            <div class="text-center py-10 border rounded-md bg-muted/20">
              <p class="text-xl text-muted-foreground">No shipments for this load yet.</p>
               {user && !user.companyFilter && (
                <Button onClick={() => setIsAddShipmentDialogOpen(true)} variant="outline" className="mt-4">
                    <PlusCircle class="mr-2 h-5 w-5" /> Add Shipment
                </Button>
            )}
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shipmentsForCurrentLoad.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onDelete={() => deleteShipment(shipment.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

       {user && !user.companyFilter && (
         <AddShipmentDialog
            isOpen={isAddShipmentDialogOpen}
            setIsOpen={setIsAddShipmentDialogOpen}
            loadId={load.id}
         />
       )}

      {isEditDialogOpen && load && (
        <EditLoadDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          loadToEdit={load}
        />
      )}

      {isAttachLoadDocDialogOpen && documentToManageInfo && load && (
        <AttachLoadDocumentDialog
          isOpen={isAttachLoadDocDialogOpen}
          setIsOpen={setIsAttachLoadDocDialogOpen}
          loadId={load.id}
          loadIdentifier={`${load.name} (ID: ${load.id})`}
          documentTypeField={documentToManageInfo.field}
          documentFriendlyName={documentToManageInfo.friendlyName}
          currentDocumentName={documentToManageInfo.currentName}
          onDocumentAction={handleLoadDocumentAction}
        />
      )}
    </div>
  );
}

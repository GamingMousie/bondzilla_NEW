
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Shipment } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Edit3, Trash2, MoreVertical, FileText, CheckCircle2, CircleOff, Weight, Box, Pencil, FileUp, Users, Hash, Send, Briefcase, Truck, Archive, Fingerprint, CalendarClock, Mail, MessageSquare, ShieldAlert } from 'lucide-react';
import ManageLocationsDialog from './ManageLocationsDialog';
import EditShipmentDialog from './EditShipmentDialog';
import AttachDocumentDialog from './AttachDocumentDialog';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';
import { useWarehouse } from '@/contexts/WarehouseContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface ShipmentCardProps {
  shipment: Shipment;
  onDelete: () => void;
  viewMode?: 'grid' | 'list'; 
}

export default function ShipmentCard({ shipment, onDelete, viewMode = 'grid' }: ShipmentCardProps) {
  const { updateShipment, getLoadById } = useWarehouse();
  const { toast } = useToast();

  const [isManageLocationsOpen, setIsManageLocationsOpen] = useState(false);
  const [isEditShipmentOpen, setIsEditShipmentOpen] = useState(false);
  const [isAttachDocumentOpen, setIsAttachDocumentOpen] = useState(false);
  const [attachDocumentType, setAttachDocumentType] = useState<'release' | 'clearance' | null>(null);
  const [isShipmentDeleteDialogOpen, setIsShipmentDeleteDialogOpen] = useState(false);

  const shipmentIdentifier = `STS Job: ${shipment.stsJob}`; 
  const load = getLoadById(shipment.loadId);

  const handleMarkAsPermitted = () => {
    if (!shipment.released) {
      setAttachDocumentType('release');
      setIsAttachDocumentOpen(true);
    } else {
      updateShipment(shipment.id, { released: false, releaseDocumentName: undefined });
      toast({ title: "Shipment Updated", description: `${shipmentIdentifier} marked as not permitted. Release document removed.` });
    }
  };

  const handleMarkAsCleared = () => {
    if (!shipment.cleared) {
      setAttachDocumentType('clearance');
      setIsAttachDocumentOpen(true);
    } else {
      updateShipment(shipment.id, { cleared: false, clearanceDocumentName: undefined, clearanceDate: null });
      toast({ title: "Shipment Updated", description: `${shipmentIdentifier} marked as not cleared. Clearance document & date removed.` });
    }
  };

    const handleToggleOnHold = () => {
    const newOnHoldStatus = !shipment.onHold;
    updateShipment(shipment.id, { onHold: newOnHoldStatus });
    toast({
      title: "Shipment Updated",
      description: `${shipmentIdentifier} has been ${newOnHoldStatus ? 'placed on hold' : 'taken off hold'}.`,
      variant: newOnHoldStatus ? 'destructive' : 'default',
    });
  };

  const handleDocumentAttached = (
    attachedShipmentId: string,
    docType: 'release' | 'clearance',
    documentName: string
  ) => {
    if (docType === 'release') {
      updateShipment(attachedShipmentId, { releaseDocumentName: documentName, released: true });
    } else if (docType === 'clearance') {
      updateShipment(attachedShipmentId, { clearanceDocumentName: documentName, cleared: true, clearanceDate: new Date().toISOString() });
    }
    setIsAttachDocumentOpen(false);
  };

  const handleNotifyMissingDocuments = () => {
    let missingParts = [];
    if (!shipment.cleared) {
      missingParts.push("clearance");
    }
    if (!shipment.released) {
      missingParts.push("release permission");
    }

    const missingSubjectPart = missingParts.join(" & ");
    const subject = `Missing ${missingSubjectPart} for Load ${shipment.loadId} / Job ${shipment.stsJob}`;
    const body = `Good Morning,\n\nWe have a driver waiting to collect "${shipment.loadId} / Job ${shipment.stsJob}" but we are missing files for above shipment.\n\nCan you be able to update us ASAP please?`;
    const mailtoLink = `mailto:klaudia@mail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };


  const locations = shipment.locations || [{ name: 'Pending Assignment' }];
  const isPendingAssignment = locations.length === 1 && locations[0].name === 'Pending Assignment';

  const formatDate = (dateString?: string | null, dateFormat = 'PP') => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), dateFormat);
    } catch (error) {
      return "Invalid Date";
    }
  };

  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <CardTitle className={viewMode === 'list' ? "text-base font-semibold" : "text-lg"}>
            <Link href={`/shipments/${shipment.id}`} className="hover:underline text-primary flex items-center group">
              <Package className="mr-2 h-5 w-5 text-primary group-hover:animate-pulse" />
              Load {shipment.loadId} Job: {shipment.stsJob}
            </Link>
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Shipment ID: {shipment.id.substring(0,8)}...
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
               <Link href={`/shipments/${shipment.id}`} className="flex items-center w-full">
                 <Package className="mr-2 h-4 w-4" /> View Details
               </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsEditShipmentOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Shipment Details
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => setIsManageLocationsOpen(true)}>
              <MapPin className="mr-2 h-4 w-4" />
              Manage Locations
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleOnHold}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                {shipment.onHold ? 'Take Off Hold' : 'Place On Hold'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleMarkAsPermitted}>
              {shipment.released ? <CircleOff className="mr-2 h-4 w-4" /> : <FileUp className="mr-2 h-4 w-4 text-green-600" />}
              {shipment.released ? 'Mark as Not Permitted' : 'Permit (Attach Doc)'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleMarkAsCleared}>
               {shipment.cleared ? <CircleOff className="mr-2 h-4 w-4" /> : <FileUp className="mr-2 h-4 w-4 text-green-600" />}
              {shipment.cleared ? 'Mark as Not Cleared' : 'Clear (Attach Doc)'}
            </DropdownMenuItem>
            {(!shipment.released || !shipment.cleared) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleNotifyMissingDocuments}>
                  <Mail className="mr-2 h-4 w-4 text-orange-500" />
                  Notify Missing Docs
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsShipmentDeleteDialogOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Shipment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={`space-y-1 text-xs ${viewMode === 'grid' ? 'mt-2' : 'mt-1'}`}>
        {shipment.customerJobNumber && (
          <div className="flex items-center">
            <Briefcase className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Cust. Job No:</span>
            <span className="ml-1.5">{shipment.customerJobNumber}</span>
          </div>
        )}
        <p><span className="font-medium text-muted-foreground">Quantity:</span> {shipment.quantity}</p>

        <div className="flex items-center">
          <Send className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">Exporter (Consignor):</span>
          <span className="ml-1.5">{shipment.exporter}</span>
        </div>

        <div className="flex items-center">
          <Users className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">Importer (Consignee):</span>
          <span className="ml-1.5">{shipment.importer}</span>
        </div>

        {shipment.mrn && (
          <div className="flex items-center">
            <Fingerprint className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">MRN:</span>
            <span className="ml-1.5">{shipment.mrn}</span>
          </div>
        )}

        {shipment.weight !== undefined && shipment.weight !== null && (
          <div className="flex items-center">
            <Weight className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Weight:</span>
            <span className="ml-1.5">{shipment.weight} kg</span>
          </div>
        )}

        {shipment.palletSpace !== undefined && shipment.palletSpace !== null && (
          <div className="flex items-center">
            <Box className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Total Pallet Spaces:</span>
            <span className="ml-1.5">{shipment.palletSpace}</span>
          </div>
        )}

        <div className="flex items-start pt-0.5">
          <MapPin className="mr-1 h-3.5 w-3.5 text-muted-foreground mt-px flex-shrink-0" />
          <span className="font-medium text-muted-foreground mr-1">Locations:</span>
          <div className="flex flex-wrap gap-1">
            {isPendingAssignment ? (
              <Badge variant="outline" className="text-xs">Pending Assignment</Badge>
            ) : (
              locations.map((loc, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {loc.name}
                  {loc.pallets !== undefined && ` (${loc.pallets} plts)`}
                  {locations.length > 1 && ` (${index + 1} of ${locations.length})`}
                </Badge>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center pt-0.5">
          {shipment.released ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-green-600" /> : <CircleOff className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />}
          <span className="font-medium text-muted-foreground">Permitted:</span>
          <span className="ml-1.5 font-semibold">{shipment.released ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex items-center">
          {shipment.cleared ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-green-600" /> : <CircleOff className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />}
          <span className="font-medium text-muted-foreground">Cleared:</span>
          <span className="ml-1.5 font-semibold">{shipment.cleared ? 'Yes' : 'No'}</span>
        </div>
         {shipment.onHold && (
          <div className="flex items-center text-destructive">
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
            <span className="font-semibold">ON HOLD</span>
          </div>
        )}
        {shipment.cleared && shipment.clearanceDate && (
           <div className="flex items-center text-xs text-muted-foreground">
            <CalendarClock className="mr-1.5 h-3 w-3" />
            <span>Cleared Date: {formatDate(shipment.clearanceDate, 'PPp')}</span>
          </div>
        )}
        
         <div className="flex items-center">
          <Archive className={`mr-1.5 h-3.5 w-3.5 ${shipment.emptyPalletRequired && shipment.emptyPalletRequired > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          <span className="font-medium text-muted-foreground">Empty Pallets Required:</span>
          <span className={`ml-1.5 font-semibold ${shipment.emptyPalletRequired && shipment.emptyPalletRequired > 0 ? 'text-destructive text-base' : ''}`}>
            {shipment.emptyPalletRequired && shipment.emptyPalletRequired > 0 ? shipment.emptyPalletRequired : 'No'}
          </span>
        </div>
        
        {shipment.comments && (
            <div className="flex items-start text-xs text-muted-foreground pt-1">
                <MessageSquare className="mr-1.5 h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <p className="italic">"{shipment.comments}"</p>
            </div>
        )}

        {shipment.releaseDocumentName && (
          <div className="flex items-center pt-0.5">
            <FileText className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Release Doc:</span>
            <span className="ml-1.5 text-foreground truncate" title={shipment.releaseDocumentName}>{shipment.releaseDocumentName}</span>
          </div>
        )}
        {shipment.clearanceDocumentName && (
           <div className="flex items-center">
            <FileText className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Clearance Doc:</span>
            <span className="ml-1.5 text-foreground truncate" title={shipment.clearanceDocumentName}>{shipment.clearanceDocumentName}</span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <Card className={`flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-200 ${viewMode === 'list' ? 'w-full' : ''}`}>
        {viewMode === 'grid' ? (
          <>
            <CardHeader className="pb-2">
              {shipment.onHold && (
                <Badge variant="destructive" className="self-start text-xs">
                  <ShieldAlert className="mr-1 h-3 w-3" /> ON HOLD
                </Badge>
              )}
            </CardHeader>
            <CardContent className="text-sm flex-grow p-4 space-y-2">
              {cardContent}
            </CardContent>
            <CardFooter className="pt-3 p-4">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setIsManageLocationsOpen(true)}>
                <MapPin className="mr-2 h-4 w-4" /> Manage Locations
              </Button>
            </CardFooter>
          </>
        ) : ( // List View
          <div className="p-4 flex flex-col sm:flex-row items-start justify-between gap-4 w-full">
            <div className="flex-grow space-y-1.5">
              {cardContent}
            </div>
            <div className="mt-2 sm:mt-0 sm:ml-auto flex-shrink-0">
               <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setIsManageLocationsOpen(true)}>
                <MapPin className="mr-2 h-4 w-4" /> Manage Locations
              </Button>
            </div>
          </div>
        )}
      </Card>

      {isManageLocationsOpen && (
        <ManageLocationsDialog
          isOpen={isManageLocationsOpen}
          setIsOpen={setIsManageLocationsOpen}
          shipmentToManage={shipment}
        />
      )}

      {isEditShipmentOpen && ( 
        <EditShipmentDialog
          isOpen={isEditShipmentOpen}
          setIsOpen={setIsEditShipmentOpen}
          shipmentToEdit={shipment}
        />
      )}

      {isAttachDocumentOpen && attachDocumentType && (
        <AttachDocumentDialog
          isOpen={isAttachDocumentOpen}
          setIsOpen={setIsAttachDocumentOpen}
          shipmentId={shipment.id}
          shipmentIdentifier={shipmentIdentifier} 
          documentType={attachDocumentType}
          onDocumentAttached={handleDocumentAttached}
        />
      )}

      {isShipmentDeleteDialogOpen && (
        <ConfirmationDialog
          isOpen={isShipmentDeleteDialogOpen}
          setIsOpen={setIsShipmentDeleteDialogOpen}
          onConfirm={onDelete}
          title="Delete Shipment?"
          description={`Are you sure you want to delete shipment STS Job: ${shipment.stsJob} (ID: ${shipment.id.substring(0,8)}...)? This action cannot be undone.`}
          confirmText="Delete"
          confirmButtonVariant="destructive"
        />
      )}
    </>
  );
}

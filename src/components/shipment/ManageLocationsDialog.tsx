
import { useEffect, useRef, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Camera, AlertTriangle, MapPin, XIcon, PlusCircle, Box } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Shipment, LocationInfo } from '@/types';
import { useWarehouse } from '@/contexts/WarehouseContext';

const newLocationSchema = z.object({
  newLocationName: z.string().min(1, 'Location name cannot be empty').max(30, 'Location name too long'),
  newLocationPallets: z.coerce.number().int('Plt spaces must be a whole number.').min(0, 'Plt spaces cannot be negative.').optional().nullable(),
});
type NewLocationFormData = z.infer<typeof newLocationSchema>;

interface ManageLocationsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  shipmentToManage: Shipment;
}

export default function ManageLocationsDialog({
  isOpen,
  setIsOpen,
  shipmentToManage,
}: ManageLocationsDialogProps) {
  const { updateShipment } = useWarehouse();
  const { toast } = useToast();
  
  const { register, handleSubmit: handleNewLocationSubmit, reset: resetNewLocationForm, setValue: setNewLocationValue, formState: { errors: newLocationErrors } } = useForm<NewLocationFormData>({
    resolver: zodResolver(newLocationSchema),
    defaultValues: {
      newLocationName: "",
      newLocationPallets: null,
    }
  });

  const [currentEditedLocations, setCurrentEditedLocations] = useState<LocationInfo[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && shipmentToManage) {
      const initialLocations = shipmentToManage.locations || [{ name: 'Pending Assignment' }];
      if (initialLocations.length > 1 && initialLocations.some(loc => loc.name === 'Pending Assignment')) {
        setCurrentEditedLocations(initialLocations.filter(loc => loc.name !== 'Pending Assignment'));
      } else {
        setCurrentEditedLocations(initialLocations);
      }
      resetNewLocationForm({ newLocationName: "", newLocationPallets: null });
    } else {
      setIsScanning(false); 
      setHasCameraPermission(null); 
    }
  }, [isOpen, shipmentToManage, resetNewLocationForm]);

  useEffect(() => {
    if (isScanning) {
      const getCameraPermission = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('getUserMedia not supported');
          toast({
            variant: 'destructive',
            title: 'Camera Error',
            description: 'Your browser does not support camera access. Please ensure you are using a secure (HTTPS) connection.',
          });
          setHasCameraPermission(false);
          setIsScanning(false);
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setActiveStream(stream);
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      };
      getCameraPermission();
    } else {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        setActiveStream(null);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    }
    return () => { 
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning, toast, activeStream]); 

  const handleAddLocationToList = (data: NewLocationFormData) => {
    const nameToAdd = data.newLocationName.trim();
    const pallets = data.newLocationPallets ?? undefined;

    if (nameToAdd && !currentEditedLocations.some(loc => loc.name === nameToAdd)) {
      let newLocationsList = [...currentEditedLocations];
      if (newLocationsList.length === 1 && newLocationsList[0].name === 'Pending Assignment') {
        newLocationsList = [];
      }
      newLocationsList.push({ name: nameToAdd, pallets });
      setCurrentEditedLocations(newLocationsList);
    }
    resetNewLocationForm({ newLocationName: "", newLocationPallets: null });
  };

  const handleRemoveLocationFromList = (locationNameToRemove: string) => {
    setCurrentEditedLocations(currentEditedLocations.filter(loc => loc.name !== locationNameToRemove));
  };

  const handleSimulateScan = () => {
    const scannedValue = `SCANNED-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setNewLocationValue('newLocationName', scannedValue, { shouldValidate: true });
    setNewLocationValue('newLocationPallets', Math.floor(Math.random() * 5) + 1); // Simulate 1-5 pallets
    toast({
      title: "Barcode Scanned (Simulated)",
      description: `Location "${scannedValue}" ready to be added.`,
    });
    setIsScanning(false); 
  };

  const handleSaveChanges = () => {
    const finalLocations = currentEditedLocations.length > 0 ? currentEditedLocations : [{ name: 'Pending Assignment' }];
    updateShipment(shipmentToManage.id, { locations: finalLocations });
    toast({
      title: "Locations Updated!",
      description: `Locations for shipment STS Job: ${shipmentToManage.stsJob} have been saved.`,
    });
    closeDialogCleanup();
  };
  
  const closeDialogCleanup = () => {
    setIsOpen(false);
    setIsScanning(false);
    resetNewLocationForm({ newLocationName: "", newLocationPallets: null });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeDialogCleanup(); else setIsOpen(true); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" /> 
            {isScanning ? 'Scan Location Barcode' : 'Manage Shipment Locations'}
          </DialogTitle>
          {!isScanning && (
            <DialogDescription>
              For Shipment STS Job: <span className="font-semibold">{shipmentToManage.stsJob}</span>. Add or remove locations and specify pallet counts.
            </DialogDescription>
          )}
        </DialogHeader>

        {isScanning ? (
          <div className="space-y-4 py-4">
            {hasCameraPermission === null && <p className="text-muted-foreground text-center">Requesting camera access...</p>}
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Camera access denied or unavailable. Check browser permissions or enter manually.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              {hasCameraPermission && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3/4 h-1/3 border-2 border-dashed border-background/70 rounded-lg opacity-75"></div>
                  </div>
              )}
            </div>
            <Button onClick={handleSimulateScan} className="w-full" disabled={hasCameraPermission !== true}>
              Simulate Successful Scan
            </Button>
            <Button variant="outline" onClick={() => setIsScanning(false)} className="w-full">
              Cancel Scan & Enter Manually
            </Button>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            <div>
              <Label className="text-sm font-medium">Current Locations:</Label>
              <div className="mt-2 flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px] bg-muted/50 max-h-40 overflow-y-auto">
                {currentEditedLocations.length === 0 || (currentEditedLocations.length === 1 && currentEditedLocations[0].name === 'Pending Assignment') ? (
                  <Badge variant="outline">Pending Assignment</Badge>
                ) : (
                  currentEditedLocations.filter(loc => loc.name !== 'Pending Assignment').map((loc, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1.5 py-1 px-2">
                      <span>{loc.name}</span>
                      {loc.pallets !== undefined && <span className="text-xs text-muted-foreground">({loc.pallets} plts)</span>}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full hover:bg-destructive/20"
                        onClick={() => handleRemoveLocationFromList(loc.name)}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={handleNewLocationSubmit(handleAddLocationToList)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-2 items-end">
                <div>
                  <Label htmlFor="newLocationName">New Location Name</Label>
                  <Input
                    id="newLocationName"
                    {...register('newLocationName')}
                    placeholder="e.g., Shelf A1 or scan"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="newLocationPallets" className="flex items-center">
                    <Box className="mr-1 h-3 w-3 text-muted-foreground" /> Plt Spaces
                  </Label>
                  <Input
                    id="newLocationPallets"
                    type="number"
                    {...register('newLocationPallets')}
                    placeholder="No."
                    className="mt-1"
                  />
                </div>
                <Button type="submit" size="icon" variant="outline" className="self-end mb-px sm:mb-0"> {/* Adjusted margin for alignment */}
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-2">
                {newLocationErrors.newLocationName && <p className="text-sm text-destructive mt-0 sm:col-span-1">{newLocationErrors.newLocationName.message}</p>}
                <div className={newLocationErrors.newLocationName ? "sm:col-start-2" : "sm:col-start-1 sm:col-span-1"}> {/* Adjust based on first error */}
                 {newLocationErrors.newLocationPallets && <p className="text-sm text-destructive mt-0">{newLocationErrors.newLocationPallets.message}</p>}
                </div>
              </div>


              <Button type="button" variant="outline" onClick={() => setIsScanning(true)} className="w-full">
                <Camera className="mr-2 h-4 w-4" /> Scan Barcode for Location Name
              </Button>
            </form>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeDialogCleanup}>Cancel</Button>
              <Button onClick={handleSaveChanges}>
                Save Changes
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

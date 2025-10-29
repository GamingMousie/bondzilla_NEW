
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Checkbox removed as emptyPalletRequired is now a number
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Weight, Box, Users, MapPin, Send, Briefcase, Archive, Fingerprint, MessageSquare, ShieldAlert } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const shipmentSchema = z.object({
  stsJob: z.coerce.number().positive('STS Job must be a positive number'),
  customerJobNumber: z.string().max(50, 'Customer job number too long').optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  importer: z.string().min(1, 'Importer (Consignee) is required').max(50, 'Importer (Consignee) name too long'),
  exporter: z.string().min(1, 'Exporter (Consignor) is required').max(50, 'Exporter (Consignor) name too long'),
  initialLocationName: z.string().optional(),
  initialLocationPallets: z.coerce.number().int().positive().optional().nullable(),
  releaseDocument: z.any().optional(),
  clearanceDocument: z.any().optional(),
  released: z.boolean().optional(),
  cleared: z.boolean().optional(),
  onHold: z.boolean().optional(),
  weight: z.coerce.number().positive('Weight must be positive').optional().nullable(),
  palletSpace: z.coerce.number().int('Pallet space must be an integer').positive('Pallet space must be positive').optional().nullable(),
  emptyPalletRequired: z.coerce.number().int("Must be a whole number").min(0, 'Cannot be negative').optional().nullable(),
  mrn: z.string().max(50, "MRN too long").optional(),
  comments: z.string().max(200, "Comments are too long").optional(),
});

type ShipmentFormData = z.infer<typeof shipmentSchema>;

interface AddShipmentDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  trailerId: string;
}

export default function AddShipmentDialog({ isOpen, setIsOpen, trailerId }: AddShipmentDialogProps) {
  const { addShipment } = useWarehouse();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      released: false,
      cleared: false,
      onHold: false,
      weight: null,
      palletSpace: null,
      initialLocationName: '',
      initialLocationPallets: null,
      customerJobNumber: '',
      emptyPalletRequired: 0, 
      mrn: '',
      comments: '',
    }
  });

  const onSubmit: SubmitHandler<ShipmentFormData> = (data) => {
    const releaseDocumentName = data.releaseDocument && data.releaseDocument.length > 0 ? data.releaseDocument[0]?.name : undefined;
    const clearanceDocumentName = data.clearanceDocument && data.clearanceDocument.length > 0 ? data.clearanceDocument[0]?.name : undefined;

    addShipment({
      trailerId,
      stsJob: data.stsJob,
      customerJobNumber: data.customerJobNumber || undefined,
      quantity: data.quantity,
      importer: data.importer,
      exporter: data.exporter,
      initialLocationName: data.initialLocationName || undefined,
      initialLocationPallets: data.initialLocationPallets ?? undefined,
      releaseDocumentName,
      clearanceDocumentName,
      released: data.released,
      cleared: data.cleared,
      onHold: data.onHold,
      weight: data.weight ?? undefined,
      palletSpace: data.palletSpace ?? undefined,
      emptyPalletRequired: data.emptyPalletRequired ?? 0,
      mrn: data.mrn || undefined,
      comments: data.comments || undefined,
    });
    toast({
      title: "Success!",
      description: `Shipment with STS Job "${data.stsJob}" added to trailer ${trailerId}.`,
    });
    reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset(); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add New Shipment</DialogTitle>
          <DialogDescription>
            Enter details for the new shipment to be added to trailer ID: {trailerId}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stsJob">STS Job Number</Label>
              <Input id="stsJob" type="number" {...register('stsJob')} placeholder="e.g., 12345" />
              {errors.stsJob && <p className="text-sm text-destructive mt-1">{errors.stsJob.message}</p>}
            </div>
            <div>
              <Label htmlFor="customerJobNumber" className="flex items-center">
               <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" /> Customer Job Number (Optional)
              </Label>
              <Input id="customerJobNumber" {...register('customerJobNumber')} placeholder="e.g., CUST-XYZ-123" />
              {errors.customerJobNumber && <p className="text-sm text-destructive mt-1">{errors.customerJobNumber.message}</p>}
            </div>
          </div>


          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" {...register('quantity')} placeholder="e.g., 100" />
            {errors.quantity && <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>}
          </div>

          <div>
            <Label htmlFor="exporter" className="flex items-center">
              <Send className="mr-2 h-4 w-4 text-muted-foreground" /> Exporter (Consignor)
            </Label>
            <Input id="exporter" {...register('exporter')} placeholder="e.g., Local Exporters Co." />
            {errors.exporter && <p className="text-sm text-destructive mt-1">{errors.exporter.message}</p>}
          </div>

          <div>
            <Label htmlFor="importer" className="flex items-center">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" /> Importer (Consignee)
            </Label>
            <Input id="importer" {...register('importer')} placeholder="e.g., Global Importers LLC" />
            {errors.importer && <p className="text-sm text-destructive mt-1">{errors.importer.message}</p>}
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight" className="flex items-center">
                <Weight className="mr-2 h-4 w-4 text-muted-foreground" /> Weight (kg) (Optional)
              </Label>
              <Input id="weight" type="number" step="0.1" {...register('weight')} placeholder="e.g., 1250.5" />
              {errors.weight && <p className="text-sm text-destructive mt-1">{errors.weight.message}</p>}
            </div>
            <div>
              <Label htmlFor="palletSpace" className="flex items-center">
                <Box className="mr-2 h-4 w-4 text-muted-foreground" /> Pallet Spaces (Shipment Total) (Optional)
              </Label>
              <Input id="palletSpace" type="number" {...register('palletSpace')} placeholder="e.g., 4" />
              {errors.palletSpace && <p className="text-sm text-destructive mt-1">{errors.palletSpace.message}</p>}
            </div>
          </div>

           <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="initialLocationName" className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" /> Initial Location (Optional)
              </Label>
              <Input id="initialLocationName" {...register('initialLocationName')} placeholder="e.g., Bay C2" />
              {errors.initialLocationName && <p className="text-sm text-destructive mt-1">{errors.initialLocationName.message}</p>}
            </div>
             <div>
              <Label htmlFor="initialLocationPallets" className="flex items-center">
                <Box className="mr-2 h-4 w-4 text-muted-foreground" /> Plt Spaces in Loc. (Optional)
              </Label>
              <Input id="initialLocationPallets" type="number" {...register('initialLocationPallets')} placeholder="e.g., 2" />
              {errors.initialLocationPallets && <p className="text-sm text-destructive mt-1">{errors.initialLocationPallets.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="mrn" className="flex items-center">
              <Fingerprint className="mr-2 h-4 w-4 text-muted-foreground" /> MRN (Optional)
            </Label>
            <Input id="mrn" {...register('mrn')} placeholder="e.g., 24GB123..." />
            {errors.mrn && <p className="text-sm text-destructive mt-1">{errors.mrn.message}</p>}
          </div>

          <div>
            <Label htmlFor="comments" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" /> Comments (Optional)
            </Label>
            <Textarea id="comments" {...register('comments')} placeholder="e.g., Special handling instructions..." rows={3} />
            {errors.comments && <p className="text-sm text-destructive mt-1">{errors.comments.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="releaseDocument" className="flex items-center">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" /> Release Document (Optional)
            </Label>
            <Input id="releaseDocument" type="file" {...register('releaseDocument')} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
            {errors.releaseDocument && <p className="text-sm text-destructive mt-1">{(errors.releaseDocument as any)?.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clearanceDocument" className="flex items-center">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" /> Clearance Document (Optional)
            </Label>
            <Input id="clearanceDocument" type="file" {...register('clearanceDocument')} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
            {errors.clearanceDocument && <p className="text-sm text-destructive mt-1">{(errors.clearanceDocument as any)?.message}</p>}
          </div>
          
           <div>
              <Label htmlFor="emptyPalletRequired" className="flex items-center">
                <Archive className="mr-2 h-4 w-4 text-muted-foreground" /> Empty Pallets Required (Number, Optional)
              </Label>
              <Input id="emptyPalletRequired" type="number" {...register('emptyPalletRequired')} placeholder="e.g., 0 or 2" />
              {errors.emptyPalletRequired && <p className="text-sm text-destructive mt-1">{errors.emptyPalletRequired.message}</p>}
            </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="released" {...register('released')} className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"/>
              <Label htmlFor="released" className="font-normal">Permitted to be Released</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="cleared" {...register('cleared')} className="h-4 w-4 rounded border-primary text-primary focus:ring-primary" />
              <Label htmlFor="cleared" className="font-normal">Mark as Cleared</Label>
            </div>
          </div>
           <div className="flex items-center space-x-2">
              <input type="checkbox" id="onHold" {...register('onHold')} className="h-4 w-4 rounded border-destructive text-destructive focus:ring-destructive"/>
              <Label htmlFor="onHold" className="font-normal flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-4 w-4" /> Place On Hold
              </Label>
            </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Shipment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

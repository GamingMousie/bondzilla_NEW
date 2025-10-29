
import { useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Shipment, ShipmentUpdateData, ShipmentFormData } from '@/types'; // Use ShipmentFormData for form
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Weight, Box, Edit, Users, Send, Briefcase, Archive, Fingerprint, CalendarIcon, CalendarClock, MessageSquare, ShieldAlert } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Textarea } from '@/components/ui/textarea';

// Using ShipmentFormData as base for the form, which includes clearanceDate as Date | null
const editShipmentSchema = z.object({
  stsJob: z.coerce.number().positive('STS Job must be a positive number'),
  customerJobNumber: z.string().max(50, 'Customer job number too long').optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  importer: z.string().min(1, 'Importer (Consignee) is required').max(50, 'Importer (Consignee) name too long'),
  exporter: z.string().min(1, 'Exporter (Consignor) is required').max(50, 'Exporter (Consignor) name too long'),
  releaseDocument: z.any().optional(), // Keep as any for FileList or File
  clearanceDocument: z.any().optional(), // Keep as any for FileList or File
  released: z.boolean().optional(),
  cleared: z.boolean().optional(),
  onHold: z.boolean().optional(),
  weight: z.coerce.number().positive('Weight must be positive').optional().nullable(),
  palletSpace: z.coerce.number().int('Pallet space must be an integer').positive('Pallet space must be positive').optional().nullable(),
  emptyPalletRequired: z.coerce.number().int("Must be a whole number").min(0, 'Cannot be negative').optional().nullable(),
  mrn: z.string().max(50, "MRN too long").optional(),
  clearanceDate: z.date().nullable().optional(), // Matching ShipmentFormData
  comments: z.string().max(200, "Comments are too long").optional(),
});

// This type is for what the form's `data` object will look like on submit
type EditShipmentFormSubmitData = z.infer<typeof editShipmentSchema>;

interface EditShipmentDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  shipmentToEdit: Shipment;
}

export default function EditShipmentDialog({ isOpen, setIsOpen, shipmentToEdit }: EditShipmentDialogProps) {
  const { updateShipment } = useWarehouse();
  const { toast } = useToast();

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting }, watch, setValue } = useForm<EditShipmentFormSubmitData>({
    resolver: zodResolver(editShipmentSchema),
    // Default values are critical for controlled components
    defaultValues: {
      stsJob: 0, // Default to 0 or a sensible number
      customerJobNumber: '',
      quantity: 1, // Default to 1 or a sensible number
      importer: '',
      exporter: '',
      released: false,
      cleared: false,
      onHold: false,
      weight: null,
      palletSpace: null,
      releaseDocument: null,
      clearanceDocument: null,
      emptyPalletRequired: 0,
      mrn: '',
      clearanceDate: null,
      comments: '',
    }
  });

  useEffect(() => {
    if (shipmentToEdit && isOpen) {
      reset({
        stsJob: shipmentToEdit.stsJob,
        customerJobNumber: shipmentToEdit.customerJobNumber || '',
        quantity: shipmentToEdit.quantity,
        importer: shipmentToEdit.importer,
        exporter: shipmentToEdit.exporter,
        released: shipmentToEdit.released,
        cleared: shipmentToEdit.cleared,
        onHold: shipmentToEdit.onHold,
        weight: shipmentToEdit.weight ?? null,
        palletSpace: shipmentToEdit.palletSpace ?? null,
        releaseDocument: null, // File inputs are not reset with previous files typically
        clearanceDocument: null,
        emptyPalletRequired: shipmentToEdit.emptyPalletRequired ?? 0,
        mrn: shipmentToEdit.mrn || '',
        clearanceDate: shipmentToEdit.clearanceDate ? parseISO(shipmentToEdit.clearanceDate) : null,
        comments: shipmentToEdit.comments || '',
      });
    }
  }, [shipmentToEdit, isOpen, reset]);


  const onSubmit: SubmitHandler<EditShipmentFormSubmitData> = (data) => {
    const newReleaseDocumentFile = data.releaseDocument && data.releaseDocument.length > 0 ? data.releaseDocument[0] : null;
    const newClearanceDocumentFile = data.clearanceDocument && data.clearanceDocument.length > 0 ? data.clearanceDocument[0] : null;

    const updatedData: ShipmentUpdateData = { 
      stsJob: data.stsJob,
      customerJobNumber: data.customerJobNumber || undefined,
      quantity: data.quantity,
      importer: data.importer,
      exporter: data.exporter,
      releaseDocumentName: newReleaseDocumentFile ? newReleaseDocumentFile.name : shipmentToEdit.releaseDocumentName,
      clearanceDocumentName: newClearanceDocumentFile ? newClearanceDocumentFile.name : shipmentToEdit.clearanceDocumentName,
      released: data.released ?? false,
      cleared: data.cleared ?? false,
      onHold: data.onHold ?? false,
      weight: data.weight ?? undefined,
      palletSpace: data.palletSpace ?? undefined,
      emptyPalletRequired: data.emptyPalletRequired ?? 0,
      mrn: data.mrn || undefined,
      clearanceDate: data.clearanceDate ? data.clearanceDate.toISOString() : null,
      comments: data.comments,
    };

    updateShipment(shipmentToEdit.id, updatedData);
    toast({
      title: "Success!",
      description: `Shipment STS Job "${data.stsJob}" updated. Locations managed separately.`,
    });
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsOpen(true); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center"><Edit className="mr-2 h-5 w-5" /> Edit Shipment</DialogTitle>
          <DialogDescription>
            Modify the details for shipment ID: {shipmentToEdit.id.substring(0,8)}... Location details are managed in a separate dialog.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stsJob">STS Job Number</Label>
              <Input id="stsJob" type="number" {...register('stsJob')} />
              {errors.stsJob && <p className="text-sm text-destructive mt-1">{errors.stsJob.message}</p>}
            </div>
            <div>
              <Label htmlFor="customerJobNumber" className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" /> Customer Job Number
              </Label>
              <Input id="customerJobNumber" {...register('customerJobNumber')} />
              {errors.customerJobNumber && <p className="text-sm text-destructive mt-1">{errors.customerJobNumber.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" {...register('quantity')} />
            {errors.quantity && <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>}
          </div>

          <div>
            <Label htmlFor="exporter" className="flex items-center">
              <Send className="mr-2 h-4 w-4 text-muted-foreground" /> Exporter (Consignor)
            </Label>
            <Input id="exporter" {...register('exporter')} />
            {errors.exporter && <p className="text-sm text-destructive mt-1">{errors.exporter.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="importer" className="flex items-center">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" /> Importer (Consignee)
            </Label>
            <Input id="importer" {...register('importer')} />
            {errors.importer && <p className="text-sm text-destructive mt-1">{errors.importer.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight" className="flex items-center">
                <Weight className="mr-2 h-4 w-4 text-muted-foreground" /> Weight (kg)
              </Label>
              <Input id="weight" type="number" step="0.1" {...register('weight')} />
              {errors.weight && <p className="text-sm text-destructive mt-1">{errors.weight.message}</p>}
            </div>
            <div>
              <Label htmlFor="palletSpace" className="flex items-center">
                <Box className="mr-2 h-4 w-4 text-muted-foreground" /> Pallet Spaces (Shipment Total)
              </Label>
              <Input id="palletSpace" type="number" {...register('palletSpace')} />
              {errors.palletSpace && <p className="text-sm text-destructive mt-1">{errors.palletSpace.message}</p>}
            </div>
          </div>

           <div>
            <Label htmlFor="mrn" className="flex items-center">
              <Fingerprint className="mr-2 h-4 w-4 text-muted-foreground" /> MRN
            </Label>
            <Input id="mrn" {...register('mrn')} />
            {errors.mrn && <p className="text-sm text-destructive mt-1">{errors.mrn.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="comments" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" /> Comments
            </Label>
            <Textarea id="comments" {...register('comments')} placeholder="Special handling instructions..." rows={3} />
            {errors.comments && <p className="text-sm text-destructive mt-1">{errors.comments.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="releaseDocument" className="flex items-center">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" /> Release Document
            </Label>
            {shipmentToEdit.releaseDocumentName && !watch('releaseDocument')?.[0] && (
                <p className="text-xs text-muted-foreground">Current: {shipmentToEdit.releaseDocumentName} (upload new to replace)</p>
            )}
            <Input id="releaseDocument" type="file" {...register('releaseDocument')} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
            {errors.releaseDocument && <p className="text-sm text-destructive mt-1">{(errors.releaseDocument as any)?.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clearanceDocument" className="flex items-center">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" /> Clearance Document
            </Label>
             {shipmentToEdit.clearanceDocumentName && !watch('clearanceDocument')?.[0] && (
                <p className="text-xs text-muted-foreground">Current: {shipmentToEdit.clearanceDocumentName} (upload new to replace)</p>
            )}
            <Input id="clearanceDocument" type="file" {...register('clearanceDocument')} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
            {errors.clearanceDocument && <p className="text-sm text-destructive mt-1">{(errors.clearanceDocument as any)?.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="clearanceDateForm" className="flex items-center"> {/* Changed ID to avoid conflict */}
              <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" /> Clearance Date (Optional)
            </Label>
            <Controller
              name="clearanceDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined} // Pass Date object or undefined
                      onSelect={(date) => field.onChange(date || null)} // onChange expects Date | undefined, ensure null if no date
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.clearanceDate && <p className="text-sm text-destructive mt-1">{errors.clearanceDate.message}</p>}
            <p className="text-xs text-muted-foreground mt-1">Manually set/clear date. Auto-logic applies if "Cleared" status changes elsewhere.</p>
          </div>

          <div>
            <Label htmlFor="emptyPalletRequired">
              <Archive className="mr-2 h-4 w-4 text-muted-foreground inline" /> Empty Pallets Required (Number)
            </Label>
            <Input id="emptyPalletRequired" type="number" {...register('emptyPalletRequired')} />
            {errors.emptyPalletRequired && <p className="text-sm text-destructive mt-1">{errors.emptyPalletRequired.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <Controller
                name="released"
                control={control}
                render={({ field }) => (
                    <input type="checkbox" id="releasedEdit" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4 rounded border-primary text-primary focus:ring-primary" />
                )}
              />
              <Label htmlFor="releasedEdit" className="font-normal">Permitted to be Released</Label>
            </div>
            <div className="flex items-center space-x-2">
               <Controller
                name="cleared"
                control={control}
                render={({ field }) => (
                    <input type="checkbox" id="clearedEdit" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4 rounded border-primary text-primary focus:ring-primary" />
                )}
              />
              <Label htmlFor="clearedEdit" className="font-normal">Mark as Cleared</Label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
              <Controller
                name="onHold"
                control={control}
                render={({ field }) => (
                    <input type="checkbox" id="onHoldEdit" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} className="h-4 w-4 rounded border-destructive text-destructive focus:ring-destructive" />
                )}
              />
              <Label htmlFor="onHoldEdit" className="font-normal flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-4 w-4" /> Place On Hold
              </Label>
            </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

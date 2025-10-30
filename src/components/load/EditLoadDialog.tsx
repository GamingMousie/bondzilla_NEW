
import { useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { Load, LoadStatus, LoadUpdateData } from '@/types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Edit, Weight, Tag, FileText, UploadCloud, BookOpen, FileBadge, FileSignature, Hash } from "lucide-react"; // Added FileSignature
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';

// Internal form data type to handle Date objects from picker and new custom fields
type EditLoadFormDataInternal = {
  name: string;
  company?: string;
  sprattJobNumber?: string;
  status: LoadStatus;
  arrivalDate?: Date | null;
  storageExpiryDate?: Date | null;
  weight?: number | null;
  customField1?: string;
  customField2?: string;
  outturnReportDocument?: FileList | File | null;
  t1SummaryDocument?: FileList | File | null;
  manifestDocument?: FileList | File | null;
  acpDocument?: FileList | File | null; // Added ACP document
};

const allStatuses: LoadStatus[] = ['Scheduled', 'Arrived', 'Loading', 'Offloading', 'Devanned'];

const editLoadSchema = z.object({
  name: z.string().min(1, 'Load Name is required').max(50, 'Load Name too long'),
  company: z.string().max(50, 'Company name too long').optional(),
  sprattJobNumber: z.string().max(50, 'Spratt job number too long').optional(),
  status: z.enum(allStatuses as [LoadStatus, ...LoadStatus[]]),
  arrivalDate: z.date().nullable().optional(),
  storageExpiryDate: z.date().nullable().optional(),
  weight: z.coerce.number().positive('Weight must be a positive number').optional().nullable(),
  customField1: z.string().max(50, 'T1.1 value too long').optional(),
  customField2: z.string().max(50, 'T1.2 value too long').optional(),
  outturnReportDocument: z.any().optional(),
  t1SummaryDocument: z.any().optional(),
  manifestDocument: z.any().optional(),
  acpDocument: z.any().optional(), // Added ACP document schema
}).refine(data => {
  if (data.arrivalDate && data.storageExpiryDate && data.storageExpiryDate < data.arrivalDate) {
    return false;
  }
  return true;
}, {
  message: "Storage expiry date cannot be before arrival date.",
  path: ["storageExpiryDate"],
});


interface EditLoadDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  loadToEdit: Load;
}


export default function EditLoadDialog({ isOpen, setIsOpen, loadToEdit }: EditLoadDialogProps) {
  const { updateLoad } = useWarehouse();
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors, isSubmitting } } = useForm<EditLoadFormDataInternal>({
    resolver: zodResolver(editLoadSchema),
  });

  useEffect(() => {
    if (loadToEdit && isOpen) {
      reset({
        name: loadToEdit.name,
        company: loadToEdit.company || '',
        sprattJobNumber: loadToEdit.sprattJobNumber || '',
        status: loadToEdit.status,
        arrivalDate: loadToEdit.arrivalDate ? parseISO(loadToEdit.arrivalDate) : null,
        storageExpiryDate: loadToEdit.storageExpiryDate ? parseISO(loadToEdit.storageExpiryDate) : null,
        weight: loadToEdit.weight ?? null,
        customField1: loadToEdit.customField1 || '',
        customField2: loadToEdit.customField2 || '',
        outturnReportDocument: null,
        t1SummaryDocument: null,
        manifestDocument: null,
        acpDocument: null, // Reset ACP document
      });
    }
  }, [loadToEdit, isOpen, reset]);

   useEffect(() => {
    register('status');
  }, [register]);

  const selectedStatus = watch('status');
  const currentOutturnReportDocumentName = loadToEdit?.outturnReportDocumentName;
  const newOutturnDocumentFile = watch('outturnReportDocument');
  const currentT1SummaryDocumentName = loadToEdit?.t1SummaryDocumentName;
  const newT1SummaryDocumentFile = watch('t1SummaryDocument');
  const currentManifestDocumentName = loadToEdit?.manifestDocumentName;
  const newManifestDocumentFile = watch('manifestDocument');
  const currentAcpDocumentName = loadToEdit?.acpDocumentName; // For ACP Document
  const newAcpDocumentFile = watch('acpDocument'); // For ACP Document


  const onSubmit: SubmitHandler<EditLoadFormDataInternal> = (data) => {
    let outturnDocName: string | null | undefined = loadToEdit.outturnReportDocumentName;
    if (data.outturnReportDocument && data.outturnReportDocument.length > 0) {
      outturnDocName = data.outturnReportDocument[0].name;
    } else if (data.outturnReportDocument === null) {
        outturnDocName = null;
    }

    let t1SummaryDocName: string | null | undefined = loadToEdit.t1SummaryDocumentName;
    if (data.t1SummaryDocument && data.t1SummaryDocument.length > 0) {
      t1SummaryDocName = data.t1SummaryDocument[0].name;
    } else if (data.t1SummaryDocument === null) {
        t1SummaryDocName = null;
    }

    let manifestDocName: string | null | undefined = loadToEdit.manifestDocumentName;
    if (data.manifestDocument && data.manifestDocument.length > 0) {
      manifestDocName = data.manifestDocument[0].name;
    } else if (data.manifestDocument === null) {
        manifestDocName = null;
    }

    let acpDocName: string | null | undefined = loadToEdit.acpDocumentName; // For ACP Document
    if (data.acpDocument && data.acpDocument.length > 0) {
      acpDocName = data.acpDocument[0].name;
    } else if (data.acpDocument === null) {
      acpDocName = null;
    }


    const updateData: LoadUpdateData = {
      name: data.name,
      company: data.company || undefined,
      sprattJobNumber: data.sprattJobNumber || undefined,
      status: data.status,
      arrivalDate: data.arrivalDate ? data.arrivalDate.toISOString() : null,
      storageExpiryDate: data.storageExpiryDate ? data.storageExpiryDate.toISOString() : null,
      weight: data.weight ?? undefined,
      customField1: data.customField1 || undefined,
      customField2: data.customField2 || undefined,
      outturnReportDocumentName: outturnDocName,
      t1SummaryDocumentName: t1SummaryDocName,
      manifestDocumentName: manifestDocName,
      acpDocumentName: acpDocName, // Include ACP document name
    };

    updateLoad(loadToEdit.id, updateData);
    toast({
      title: "Success!",
      description: `Load "${data.name}" (ID: ${loadToEdit.id}) updated.`,
    });
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
     if (loadToEdit) {
      reset({
        name: loadToEdit.name,
        company: loadToEdit.company || '',
        sprattJobNumber: loadToEdit.sprattJobNumber || '',
        status: loadToEdit.status,
        arrivalDate: loadToEdit.arrivalDate ? parseISO(loadToEdit.arrivalDate) : null,
        storageExpiryDate: loadToEdit.storageExpiryDate ? parseISO(loadToEdit.storageExpiryDate) : null,
        weight: loadToEdit.weight ?? null,
        customField1: loadToEdit.customField1 || '',
        customField2: loadToEdit.customField2 || '',
        outturnReportDocument: null,
        t1SummaryDocument: null,
        manifestDocument: null,
        acpDocument: null,
      });
    }
  }

  if (!loadToEdit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsOpen(true); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center"><Edit className="mr-2 h-5 w-5" /> Edit Load</DialogTitle>
          <DialogDescription>
            Modify the details for load ID: {loadToEdit.id}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="loadIdDisplay">Load ID (Read-only)</Label>
            <Input id="loadIdDisplay" value={loadToEdit.id} readOnly className="bg-muted/50 cursor-not-allowed" />
          </div>
          <div>
            <Label htmlFor="name">Load Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g., Main Hauler" />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="company">Company (Optional)</Label>
            <Input id="company" {...register('company')} placeholder="e.g., Logistics Inc." />
            {errors.company && <p className="text-sm text-destructive mt-1">{errors.company.message}</p>}
          </div>
           <div>
            <Label htmlFor="sprattJobNumber" className="flex items-center">
              <Hash className="mr-2 h-4 w-4 text-muted-foreground" /> Spratt Job Number (Optional)
            </Label>
            <Input id="sprattJobNumber" {...register('sprattJobNumber')} placeholder="e.g., SJN-12345" />
            {errors.sprattJobNumber && <p className="text-sm text-destructive mt-1">{errors.sprattJobNumber.message}</p>}
          </div>
           <div>
            <Label htmlFor="weight" className="flex items-center">
              <Weight className="mr-2 h-4 w-4 text-muted-foreground" /> Weight (kg) (Optional)
            </Label>
            <Input id="weight" type="number" step="any" {...register('weight')} placeholder="e.g., 3500" />
            {errors.weight && <p className="text-sm text-destructive mt-1">{errors.weight.message}</p>}
          </div>
          <div>
            <Label htmlFor="customField1" className="flex items-center">
              <Tag className="mr-2 h-4 w-4 text-muted-foreground" /> T1.1 (Optional)
            </Label>
            <Input id="customField1" {...register('customField1')} placeholder="Value for T1.1" />
            {errors.customField1 && <p className="text-sm text-destructive mt-1">{errors.customField1.message}</p>}
          </div>
          <div>
            <Label htmlFor="customField2" className="flex items-center">
              <Tag className="mr-2 h-4 w-4 text-muted-foreground" /> T1.2 (Optional)
            </Label>
            <Input id="customField2" {...register('customField2')} placeholder="Value for T1.2" />
            {errors.customField2 && <p className="text-sm text-destructive mt-1">{errors.customField2.message}</p>}
          </div>
           <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={selectedStatus || loadToEdit.status}
              onValueChange={(value) => setValue('status', value as LoadStatus, { shouldValidate: true })}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
          </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="arrivalDate">Arrival Date (Optional)</Label>
              <Controller
                name="arrivalDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
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
                        selected={field.value || undefined}
                        onSelect={(date) => field.onChange(date || null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.arrivalDate && <p className="text-sm text-destructive mt-1">{errors.arrivalDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="storageExpiryDate">Storage Expiry Date (Optional)</Label>
               <Controller
                name="storageExpiryDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
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
                        selected={field.value || undefined}
                        onSelect={(date) => field.onChange(date || null)}
                         disabled={(date) =>
                          watch("arrivalDate") ? date < watch("arrivalDate")! : false
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.storageExpiryDate && <p className="text-sm text-destructive mt-1">{errors.storageExpiryDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="outturnReportDocument" className="flex items-center">
              <UploadCloud className="mr-2 h-4 w-4 text-muted-foreground" /> Out-turn Report PDF (Optional)
            </Label>
            {currentOutturnReportDocumentName && !newOutturnDocumentFile?.[0] && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <FileText className="mr-1 h-3.5 w-3.5" /> Current: {currentOutturnReportDocumentName}
                </p>
            )}
            <Input id="outturnReportDocument" type="file" {...register('outturnReportDocument')} accept=".pdf" className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
            {errors.outturnReportDocument && <p className="text-sm text-destructive mt-1">{(errors.outturnReportDocument as any)?.message}</p>}
            <p className="text-xs text-muted-foreground">Upload a new PDF to replace. Max 5MB.</p>
             {currentOutturnReportDocumentName && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-xs text-destructive p-0 h-auto"
                onClick={() => {
                  setValue('outturnReportDocument', null); // Signal to remove/clear
                  toast({ title: "Out-turn Report Cleared", description: "The out-turn report association will be removed upon saving."});
                }}
              >
                Clear Current Out-turn Report
              </Button>
            )}
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="t1SummaryDocument" className="flex items-center">
              <FileBadge className="mr-2 h-4 w-4 text-muted-foreground" /> T1 Summary PDF (Optional)
            </Label>
            {currentT1SummaryDocumentName && !newT1SummaryDocumentFile?.[0] && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <FileText className="mr-1 h-3.5 w-3.5" /> Current: {currentT1SummaryDocumentName}
                </p>
            )}
            <Input id="t1SummaryDocument" type="file" {...register('t1SummaryDocument')} accept=".pdf" className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
            {errors.t1SummaryDocument && <p className="text-sm text-destructive mt-1">{(errors.t1SummaryDocument as any)?.message}</p>}
            <p className="text-xs text-muted-foreground">Upload a new PDF to replace. Max 5MB.</p>
             {currentT1SummaryDocumentName && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-xs text-destructive p-0 h-auto"
                onClick={() => {
                  setValue('t1SummaryDocument', null);
                  toast({ title: "T1 Summary Cleared", description: "The T1 Summary association will be removed upon saving."});
                }}
              >
                Clear Current T1 Summary
              </Button>
            )}
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="manifestDocument" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" /> Manifest PDF (Optional)
            </Label>
            {currentManifestDocumentName && !newManifestDocumentFile?.[0] && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <FileText className="mr-1 h-3.5 w-3.5" /> Current: {currentManifestDocumentName}
                </p>
            )}
            <Input id="manifestDocument" type="file" {...register('manifestDocument')} accept=".pdf" className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
            {errors.manifestDocument && <p className="text-sm text-destructive mt-1">{(errors.manifestDocument as any)?.message}</p>}
            <p className="text-xs text-muted-foreground">Upload a new PDF to replace. Max 5MB.</p>
             {currentManifestDocumentName && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-xs text-destructive p-0 h-auto"
                onClick={() => {
                  setValue('manifestDocument', null);
                  toast({ title: "Manifest Cleared", description: "The Manifest association will be removed upon saving."});
                }}
              >
                Clear Current Manifest
              </Button>
            )}
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="acpDocument" className="flex items-center">
              <FileSignature className="mr-2 h-4 w-4 text-muted-foreground" /> ACP Form PDF (Optional)
            </Label>
            {currentAcpDocumentName && !newAcpDocumentFile?.[0] && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <FileText className="mr-1 h-3.5 w-3.5" /> Current: {currentAcpDocumentName}
                </p>
            )}
            <Input id="acpDocument" type="file" {...register('acpDocument')} accept=".pdf" className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
            {errors.acpDocument && <p className="text-sm text-destructive mt-1">{(errors.acpDocument as any)?.message}</p>}
            <p className="text-xs text-muted-foreground">Upload a new PDF to replace. Max 5MB.</p>
             {currentAcpDocumentName && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-xs text-destructive p-0 h-auto"
                onClick={() => {
                  setValue('acpDocument', null);
                  toast({ title: "ACP Form Cleared", description: "The ACP Form association will be removed upon saving."});
                }}
              >
                Clear Current ACP Form
              </Button>
            )}
          </div>


          <DialogFooter className="pt-6">
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

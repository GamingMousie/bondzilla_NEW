import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWarehouse } from '@/contexts/WarehouseContext';
import type { TrailerStatus, TrailerFormData as ExternalTrailerFormData } from '@/types';
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
import { CalendarIcon, Weight, Tag } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';

// Internal form data type to handle Date objects from picker and new custom fields
type TrailerFormData = Omit<ExternalTrailerFormData, 'arrivalDate' | 'storageExpiryDate' | 'weight' | 'customField1' | 'customField2'> & {
  arrivalDate?: Date | null;
  storageExpiryDate?: Date | null;
  weight?: number | null;
  customField1?: string;
  customField2?: string;
};

const allStatuses: TrailerStatus[] = ['Scheduled', 'Arrived', 'Loading', 'Offloading', 'Devanned'];

const trailerSchema = z.object({
  id: z.string().min(1, 'Trailer ID is required').max(20, 'Trailer ID too long'),
  name: z.string().min(1, 'Trailer Name is required').max(50, 'Trailer Name too long'),
  company: z.string().max(50, 'Company name too long').optional(),
  status: z.enum(allStatuses as [TrailerStatus, ...TrailerStatus[]]).default('Scheduled'),
  arrivalDate: z.date().nullable().optional(),
  storageExpiryDate: z.date().nullable().optional(),
  weight: z.coerce.number().positive('Weight must be a positive number').optional().nullable(),
  customField1: z.string().max(50, 'T1.1 value too long').optional(),
  customField2: z.string().max(50, 'T1.2 value too long').optional(),
}).refine(data => {
  if (data.arrivalDate && data.storageExpiryDate && data.storageExpiryDate < data.arrivalDate) {
    return false;
  }
  return true;
}, {
  message: "Storage expiry date cannot be before arrival date.",
  path: ["storageExpiryDate"],
});


interface AddTrailerDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}


export default function AddTrailerDialog({ isOpen, setIsOpen }: AddTrailerDialogProps) {
  const { addTrailer, trailers } = useWarehouse();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch, control } = useForm<TrailerFormData>({
    resolver: zodResolver(trailerSchema),
    defaultValues: {
      status: 'Scheduled', 
      company: '',
      arrivalDate: null,
      storageExpiryDate: null,
      weight: null,
      customField1: '',
      customField2: '',
    }
  });
  
  useEffect(() => {
    register('status');
  }, [register]);

  const selectedStatus = watch('status');

  const onSubmit: SubmitHandler<TrailerFormData> = (data) => {
    if (trailers.some(t => t.id === data.id)) {
      toast({
        title: "Error",
        description: "Trailer ID already exists. Please use a unique ID.",
        variant: "destructive",
      });
      return;
    }
    addTrailer({
      id: data.id,
      name: data.name,
      company: data.company,
      status: data.status,
      arrivalDate: data.arrivalDate ? data.arrivalDate.toISOString() : undefined,
      storageExpiryDate: data.storageExpiryDate ? data.storageExpiryDate.toISOString() : undefined,
      weight: data.weight ?? undefined,
      customField1: data.customField1 || undefined,
      customField2: data.customField2 || undefined,
    });
    toast({
      title: "Success!",
      description: `Trailer "${data.name}" (ID: ${data.id}) added.`,
    });
    reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Trailer</DialogTitle>
          <DialogDescription>
            Enter the details for the new trailer. Trailer ID must be unique.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="id">Trailer ID</Label>
            <Input id="id" {...register('id')} placeholder="e.g., T-101" />
            {errors.id && <p className="text-sm text-destructive mt-1">{errors.id.message}</p>}
          </div>
          <div>
            <Label htmlFor="name">Trailer Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g., Main Hauler" />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="company">Company (Optional)</Label>
            <Input id="company" {...register('company')} placeholder="e.g., Logistics Inc." />
            {errors.company && <p className="text-sm text-destructive mt-1">{errors.company.message}</p>}
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
            <Label htmlFor="status">Initial Status</Label>
            <Select 
              value={selectedStatus} 
              onValueChange={(value) => setValue('status', value as TrailerStatus, { shouldValidate: true })}
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


          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setIsOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Trailer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

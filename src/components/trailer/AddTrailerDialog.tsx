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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';

// Internal form data type to handle Date objects from picker
type TrailerFormData = Omit<ExternalTrailerFormData, 'arrivalDate' | 'storageExpiryDate'> & {
  arrivalDate?: Date | null;
  storageExpiryDate?: Date | null;
};

const trailerSchema = z.object({
  id: z.string().min(1, 'Trailer ID is required').max(20, 'Trailer ID too long'),
  name: z.string().min(1, 'Trailer Name is required').max(50, 'Trailer Name too long'),
  company: z.string().max(50, 'Company name too long').optional(),
  status: z.enum(['Docked', 'In-Transit', 'Empty', 'Loading', 'Unloading']).default('Empty'),
  arrivalDate: z.date().nullable().optional(),
  storageExpiryDate: z.date().nullable().optional(),
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

const allStatuses: TrailerStatus[] = ['Docked', 'In-Transit', 'Empty', 'Loading', 'Unloading'];

export default function AddTrailerDialog({ isOpen, setIsOpen }: AddTrailerDialogProps) {
  const { addTrailer, trailers } = useWarehouse();
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch, control } = useForm<TrailerFormData>({
    resolver: zodResolver(trailerSchema),
    defaultValues: {
      status: 'Empty',
      company: '',
      arrivalDate: null,
      storageExpiryDate: null,
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

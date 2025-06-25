
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { FileUp } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];


const attachDocumentSchema = z.object({
  document: z
    .any()
    .refine((files) => files?.[0], 'Document is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      ".pdf, .jpg, .png, .doc, .docx files are accepted."
    ),
});

type AttachDocumentFormData = z.infer<typeof attachDocumentSchema>;

interface AttachDocumentDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  shipmentId: string;
  shipmentIdentifier: string; // Changed from shipmentContentDescription
  documentType: 'release' | 'clearance';
  onDocumentAttached: (shipmentId: string, documentType: 'release' | 'clearance', documentName: string) => void;
}

export default function AttachDocumentDialog({
  isOpen,
  setIsOpen,
  shipmentId,
  shipmentIdentifier, // Changed from shipmentContentDescription
  documentType,
  onDocumentAttached,
}: AttachDocumentDialogProps) {
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AttachDocumentFormData>({
    resolver: zodResolver(attachDocumentSchema),
  });

  const onSubmit: SubmitHandler<AttachDocumentFormData> = (data) => {
    const documentFile = data.document[0] as File;
    onDocumentAttached(shipmentId, documentType, documentFile.name);
    toast({
      title: "Document Attached!",
      description: `${documentFile.name} has been associated as the ${documentType} document for shipment "${shipmentIdentifier}".`,
    });
    reset();
    setIsOpen(false);
  };

  const dialogTitle = documentType === 'release' ? 'Attach Release Document' : 'Attach Clearance Document';
  const dialogDescription = `Upload the ${documentType} document for shipment: ${shipmentIdentifier}.`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileUp className="mr-2 h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div>
            <Label htmlFor="documentFile" className="text-sm font-medium">
              {documentType === 'release' ? 'Release Document File' : 'Clearance Document File'}
            </Label>
            <Input
              id="documentFile"
              type="file"
              {...register('document')}
              accept={ACCEPTED_FILE_TYPES.join(',')}
              className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {errors.document && <p className="mt-1 text-sm text-destructive">{(errors.document as any)?.message}</p>}
             <p className="mt-1 text-xs text-muted-foreground">Max file size: 5MB. Accepted types: PDF, JPG, PNG, DOC, DOCX.</p>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Attaching...' : `Attach ${documentType === 'release' ? 'Release' : 'Clearance'} Doc`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
